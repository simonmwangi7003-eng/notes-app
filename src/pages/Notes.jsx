import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDownUp, Archive, Folder, LayoutGrid, List, NotebookText, Pencil, Plus, Search, Star, Trash2, X, Hash } from 'lucide-react'
import { useNotes } from '../context/NotesContext'
import NoteCard from '../components/NoteCard'
import NoteEditor from '../components/NoteEditor'
import Modal, { ConfirmDialog } from '../components/Modal'
import { cn } from '../lib/utils'

const TITLES = { all: 'All notes', favorites: 'Favorites', archive: 'Archive', trash: 'Trash' }
const EMPTY = {
  all: [NotebookText, 'Your first note is one tap away', 'Capture ideas, lists and drafts. Everything syncs to your other devices.'],
  favorites: [Star, 'No favorites yet', 'Tap the star on a note to keep it close.'],
  archive: [Archive, 'Archive is empty', 'Archive notes you want out of the way but not deleted.'],
  trash: [Trash2, 'Trash is empty', 'Deleted notes stay here for 30 days before they are removed.'],
  folder: [Folder, 'This folder is empty', 'Create a note here or move an existing one into it.'],
  tag: [Hash, 'No notes with this tag', 'Add the tag to a note and it will show up here.']
}

export default function Notes({ view }) {
  const { folderId, tag } = useParams()
  const { notes, folders, loading, offlineData, createNote, emptyTrash, renameFolder, deleteFolder, deleteForever } = useNotes()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()

  const [q, setQ] = useState('')
  const [sort, setSort] = useState(() => localStorage.getItem('jotbook-sort') || 'updated')
  const [layout, setLayout] = useState(() => localStorage.getItem('jotbook-layout') || 'grid')
  const [editingId, setEditingId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const searchRef = useRef(null)
  const handledNew = useRef(false)

  const folder = folders.find((f) => f.id === folderId)
  const title = view === 'folder' ? folder?.name || 'Folder' : view === 'tag' ? `#${tag}` : TITLES[view]

  useEffect(() => localStorage.setItem('jotbook-sort', sort), [sort])
  useEffect(() => localStorage.setItem('jotbook-layout', layout), [layout])
  useEffect(() => setQ(''), [view, folderId, tag])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleNew = async () => {
    const note = await createNote({
      folder_id: view === 'folder' ? folderId : null,
      tags: view === 'tag' ? [tag] : [],
      is_favorite: view === 'favorites'
    })
    if (note) setEditingId(note.id)
  }

  // PWA shortcut / deep link: /app?new=1
  useEffect(() => {
    if (!loading && sp.get('new') && !handledNew.current) {
      handledNew.current = true
      sp.delete('new')
      setSp(sp, { replace: true })
      handleNew()
    }
  }) // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    let l = notes.filter((n) => {
      if (view === 'trash') return !!n.deleted_at
      if (n.deleted_at) return false
      if (view === 'archive') return n.is_archived
      if (n.is_archived) return false
      if (view === 'favorites') return n.is_favorite
      if (view === 'folder') return n.folder_id === folderId
      if (view === 'tag') return n.tags.includes(tag)
      return true
    })
    if (term) l = l.filter((n) => `${n.title} ${n.content} ${n.tags.join(' ')}`.toLowerCase().includes(term))
    const cmp = {
      updated: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
      created: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      title: (a, b) => (a.title || '~').localeCompare(b.title || '~')
    }[sort]
    return [...l].sort(cmp)
  }, [notes, view, folderId, tag, q, sort])

  const pinned = view === 'trash' ? [] : list.filter((n) => n.is_pinned)
  const others = view === 'trash' ? list : list.filter((n) => !n.is_pinned)
  const folderName = (n) => (view === 'folder' ? null : folders.find((f) => f.id === n.folder_id)?.name)
  const [EmptyIcon, emptyTitle, emptyText] = EMPTY[view]

  const grid = (items) => (
    <div className={layout === 'grid' ? 'columns-1 gap-4 min-[560px]:columns-2 xl:columns-3 2xl:columns-4' : 'mx-auto max-w-3xl'}>
      {items.map((n) => (
        <NoteCard key={n.id} note={n} layout={layout} folderName={folderName(n)} onOpen={setEditingId} onDeleteForever={(note) => setConfirm({ type: 'note', note })} />
      ))}
    </div>
  )

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pt-8">
      {offlineData && <p className="mb-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">Showing the last saved copy of your notes. Reconnect to sync.</p>}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="mr-auto min-w-0">
          <h1 className="truncate font-serif text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          <p className="text-sm text-slate-500">{list.length} {list.length === 1 ? 'note' : 'notes'}{q && ' found'}</p>
        </div>
        {view === 'folder' && folder && (
          <div className="flex gap-1">
            <button className="btn-secondary" onClick={() => { setRenameValue(folder.name); setRenameOpen(true) }}><Pencil className="h-4 w-4" /> Rename</button>
            <button className="btn-secondary text-red-600" onClick={() => setConfirm({ type: 'folder' })}><Trash2 className="h-4 w-4" /> Delete</button>
          </div>
        )}
        {view === 'trash' && list.length > 0 && <button className="btn-secondary text-red-600" onClick={() => setConfirm({ type: 'empty' })}><Trash2 className="h-4 w-4" /> Empty trash</button>}
        {view !== 'trash' && <button className="btn-primary hidden sm:inline-flex" onClick={handleNew}><Plus className="h-4 w-4" /> New note</button>}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input ref={searchRef} className="input pl-9 pr-9" type="search" placeholder="Search notes, text and tags  (Ctrl K)" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Clear search"><X className="h-4 w-4" /></button>}
        </div>
        <label className="relative">
          <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select className="input w-auto pl-9" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort notes">
            <option value="updated">Last edited</option>
            <option value="created">Date created</option>
            <option value="title">Title A–Z</option>
          </select>
        </label>
        <div className="flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
          {[['grid', LayoutGrid, 'Grid view'], ['list', List, 'List view']].map(([k, Icon, label]) => (
            <button key={k} onClick={() => setLayout(k)} aria-label={label} title={label} className={cn('rounded-md p-1.5', layout === k ? 'bg-brand-700 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200')}><Icon className="h-4 w-4" /></button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="columns-1 gap-4 min-[560px]:columns-2 xl:columns-3">
          {[...Array(6)].map((_, i) => <div key={i} className="mb-4 h-32 animate-pulse break-inside-avoid rounded-2xl bg-slate-200 dark:bg-slate-800" style={{ height: 90 + ((i * 37) % 80) }} />)}
        </div>
      ) : list.length === 0 ? (
        <div className="mx-auto mt-16 max-w-sm text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"><EmptyIcon className="h-7 w-7" /></span>
          <h2 className="mt-4 font-serif text-xl font-semibold text-slate-900 dark:text-white">{q ? 'No notes match your search' : emptyTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{q ? 'Try different words or check the spelling.' : emptyText}</p>
          {!q && view !== 'trash' && view !== 'archive' && <button className="btn-primary mt-5" onClick={handleNew}><Plus className="h-4 w-4" /> New note</button>}
        </div>
      ) : (
        <>
          {pinned.length > 0 && (<section className="mb-8"><h2 className="mb-3 text-sm font-semibold text-amber-700 dark:text-amber-400">Pinned</h2>{grid(pinned)}</section>)}
          {others.length > 0 && (<section>{pinned.length > 0 && <h2 className="mb-3 text-sm font-semibold text-slate-500">Other notes</h2>}{grid(others)}</section>)}
        </>
      )}

      {view !== 'trash' && (
        <button onClick={handleNew} aria-label="New note" className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-xl transition active:scale-95 sm:hidden" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
          <Plus className="h-6 w-6" />
        </button>
      )}

      {editingId && <NoteEditor noteId={editingId} onClose={() => setEditingId(null)} />}

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename folder">
        <form className="space-y-4 pb-2" onSubmit={(e) => { e.preventDefault(); if (renameValue.trim()) { renameFolder(folderId, renameValue.trim()); setRenameOpen(false) } }}>
          <input className="input" autoFocus maxLength={60} value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setRenameOpen(false)}>Cancel</button><button className="btn-primary">Save</button></div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        danger
        title={confirm?.type === 'folder' ? 'Delete this folder?' : confirm?.type === 'empty' ? 'Empty trash?' : 'Delete forever?'}
        message={confirm?.type === 'folder' ? 'The folder will be removed. Its notes are kept and move to All notes.' : confirm?.type === 'empty' ? 'Every note in the trash will be permanently deleted.' : 'This note will be permanently deleted. This can’t be undone.'}
        confirmLabel={confirm?.type === 'folder' ? 'Delete folder' : 'Delete forever'}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const c = confirm
          setConfirm(null)
          if (c.type === 'folder') { await deleteFolder(folderId); navigate('/app') }
          else if (c.type === 'empty') await emptyTrash()
          else await deleteForever(c.note.id)
        }}
      />
    </div>
  )
}
