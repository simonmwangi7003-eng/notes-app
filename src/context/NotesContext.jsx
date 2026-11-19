import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const Ctx = createContext(null)
export const useNotes = () => useContext(Ctx)

const TRASH_DAYS = 30
const byUpdated = (a, b) => new Date(b.updated_at) - new Date(a.updated_at)

export function NotesProvider({ children }) {
  const { user } = useAuth()
  const toast = useToast()
  const uid = user.id
  const cacheKey = `jotbook:cache:${uid}`

  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [offlineData, setOfflineData] = useState(false)
  const loaded = useRef(false)

  // ---- initial load (falls back to the local cache when offline) ----
  const load = useCallback(async () => {
    try {
      // auto-purge notes that sat in the trash for more than 30 days
      const cutoff = new Date(Date.now() - TRASH_DAYS * 864e5).toISOString()
      await supabase.from('notes').delete().lt('deleted_at', cutoff)

      const [n, f] = await Promise.all([
        supabase.from('notes').select('*').order('updated_at', { ascending: false }),
        supabase.from('folders').select('*').order('name')
      ])
      if (n.error) throw n.error
      if (f.error) throw f.error
      setNotes(n.data)
      setFolders(f.data)
      setOfflineData(false)
    } catch (err) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        setNotes(parsed.notes || [])
        setFolders(parsed.folders || [])
        setOfflineData(true)
      } else {
        toast(`Could not load notes: ${err.message}`, 'error')
      }
    } finally {
      loaded.current = true
      setLoading(false)
    }
  }, [cacheKey, toast])

  useEffect(() => {
    load()
  }, [load])

  // ---- keep an offline copy ----
  useEffect(() => {
    if (!loaded.current || offlineData) return
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ notes, folders }))
    } catch {
      /* storage full – ignore */
    }
  }, [notes, folders, cacheKey, offlineData])

  // ---- realtime sync across devices ----
  useEffect(() => {
    const channel = supabase
      .channel(`sync-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, (p) => {
        if (p.eventType === 'DELETE') return setNotes((l) => l.filter((x) => x.id !== p.old.id))
        if (p.new.user_id !== uid) return
        setNotes((l) => (l.some((x) => x.id === p.new.id) ? l.map((x) => (x.id === p.new.id ? p.new : x)) : [p.new, ...l]))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, (p) => {
        if (p.eventType === 'DELETE') return setFolders((l) => l.filter((x) => x.id !== p.old.id))
        if (p.new.user_id !== uid) return
        setFolders((l) => (l.some((x) => x.id === p.new.id) ? l.map((x) => (x.id === p.new.id ? p.new : x)) : [...l, p.new]))
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [uid])

  // ---- note actions ----
  const createNote = useCallback(
    async (partial = {}) => {
      const { data, error } = await supabase.from('notes').insert({ user_id: uid, ...partial }).select().single()
      if (error) {
        toast(navigator.onLine ? error.message : 'You are offline – connect to create notes.', 'error')
        return null
      }
      setNotes((l) => (l.some((x) => x.id === data.id) ? l : [data, ...l]))
      return data
    },
    [uid, toast]
  )

  const updateNote = useCallback(
    async (id, patch) => {
      setNotes((l) => l.map((n) => (n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n)))
      const { error } = await supabase.from('notes').update(patch).eq('id', id)
      if (error) toast(navigator.onLine ? error.message : 'Offline – change was not saved.', 'error')
      return !error
    },
    [toast]
  )

  const trashNote = useCallback((id) => updateNote(id, { deleted_at: new Date().toISOString(), is_pinned: false }), [updateNote])
  const restoreNote = useCallback((id) => updateNote(id, { deleted_at: null }), [updateNote])

  const deleteForever = useCallback(
    async (id) => {
      setNotes((l) => l.filter((n) => n.id !== id))
      const { error } = await supabase.from('notes').delete().eq('id', id)
      if (error) toast(error.message, 'error')
    },
    [toast]
  )

  const emptyTrash = useCallback(async () => {
    setNotes((l) => l.filter((n) => !n.deleted_at))
    const { error } = await supabase.from('notes').delete().not('deleted_at', 'is', null)
    if (error) toast(error.message, 'error')
  }, [toast])

  const importNotes = useCallback(
    async (rows) => {
      const { error } = await supabase.from('notes').insert(rows.map((r) => ({ ...r, user_id: uid })))
      if (error) return { error }
      await load()
      return { error: null }
    },
    [uid, load]
  )

  // ---- folder actions ----
  const createFolder = useCallback(
    async (name) => {
      const { data, error } = await supabase.from('folders').insert({ user_id: uid, name }).select().single()
      if (error) {
        toast(error.message, 'error')
        return null
      }
      setFolders((l) => (l.some((x) => x.id === data.id) ? l : [...l, data]))
      return data
    },
    [uid, toast]
  )

  const renameFolder = useCallback(
    async (id, name) => {
      setFolders((l) => l.map((f) => (f.id === id ? { ...f, name } : f)))
      const { error } = await supabase.from('folders').update({ name }).eq('id', id)
      if (error) toast(error.message, 'error')
    },
    [toast]
  )

  const deleteFolder = useCallback(
    async (id) => {
      setFolders((l) => l.filter((f) => f.id !== id))
      setNotes((l) => l.map((n) => (n.folder_id === id ? { ...n, folder_id: null } : n)))
      const { error } = await supabase.from('folders').delete().eq('id', id)
      if (error) toast(error.message, 'error')
    },
    [toast]
  )

  const sorted = useMemo(() => [...notes].sort(byUpdated), [notes])

  const tags = useMemo(() => {
    const map = new Map()
    notes.filter((n) => !n.deleted_at).forEach((n) => n.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)))
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
  }, [notes])

  const counts = useMemo(() => {
    const live = notes.filter((n) => !n.deleted_at)
    return {
      all: live.filter((n) => !n.is_archived).length,
      favorites: live.filter((n) => n.is_favorite && !n.is_archived).length,
      archive: live.filter((n) => n.is_archived).length,
      trash: notes.length - live.length
    }
  }, [notes])

  const value = {
    notes: sorted, folders, tags, counts, loading, offlineData,
    reload: load, createNote, updateNote, trashNote, restoreNote, deleteForever, emptyTrash, importNotes,
    createFolder, renameFolder, deleteFolder
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
