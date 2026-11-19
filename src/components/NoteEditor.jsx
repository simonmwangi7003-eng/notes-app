import { useCallback, useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Archive, ArchiveRestore, ArrowLeft, Bold, Check, Code, Download, Eye, Folder, Heading, Italic, Link2, List,
  ListChecks, ListOrdered, Loader2, Palette, Pencil, Pin, Quote, RotateCcw, Share2, Star, Trash2, X
} from 'lucide-react'
import { useNotes } from '../context/NotesContext'
import { useToast } from '../context/ToastContext'
import ShareModal from './ShareModal'
import { ConfirmDialog } from './Modal'
import { NOTE_COLORS, cn, colorOf, downloadFile, formatDateTime, safeFileName, wordCount } from '../lib/utils'

export default function NoteEditor({ noteId, onClose }) {
  const { notes, folders, updateNote, trashNote, restoreNote, deleteForever } = useNotes()
  const toast = useToast()
  const note = notes.find((n) => n.id === noteId)

  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [mode, setMode] = useState('edit')
  const [status, setStatus] = useState('saved')
  const [shareOpen, setShareOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const taRef = useRef(null)
  const dirty = useRef(false)
  const latest = useRef({ title, content })
  latest.current = { title, content }
  const readOnly = !!note?.deleted_at

  const save = useCallback(async () => {
    if (!dirty.current) return
    dirty.current = false
    setStatus('saving')
    const ok = await updateNote(noteId, { title: latest.current.title, content: latest.current.content })
    setStatus(ok ? 'saved' : 'error')
  }, [noteId, updateNote])

  // debounced autosave
  useEffect(() => {
    if (!dirty.current) return
    setStatus('saving')
    const t = setTimeout(save, 700)
    return () => clearTimeout(t)
  }, [title, content, save])

  const close = useCallback(async () => {
    await save()
    const { title: t, content: c } = latest.current
    if (note && !t.trim() && !c.trim() && !note.tags.length && !note.deleted_at) await deleteForever(noteId)
    onClose()
  }, [save, note, noteId, deleteForever, onClose])

  useEffect(() => {
    if (!note) onClose() // deleted elsewhere (e.g. another device)
  }, [note, onClose])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        save()
      }
      if (e.key === 'Escape' && !shareOpen && !confirmDelete && !colorOpen) close()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [save, close, shareOpen, confirmDelete, colorOpen])

  // flush when the tab is hidden or closed
  useEffect(() => {
    const flush = () => document.visibilityState === 'hidden' && save()
    document.addEventListener('visibilitychange', flush)
    return () => document.removeEventListener('visibilitychange', flush)
  }, [save])

  if (!note) return null
  const palette = colorOf(note.color)

  // ---------- markdown helpers ----------
  const apply = (fn) => {
    const ta = taRef.current
    if (!ta) return
    const { value, start, end } = fn(ta.value, ta.selectionStart, ta.selectionEnd)
    setContent(value)
    dirty.current = true
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start, end)
    })
  }
  const wrap = (before, after = before, placeholder = 'text') =>
    apply((v, s, e) => {
      const sel = v.slice(s, e) || placeholder
      return { value: v.slice(0, s) + before + sel + after + v.slice(e), start: s + before.length, end: s + before.length + sel.length }
    })
  const prefixLines = (prefix) =>
    apply((v, s, e) => {
      const ls = s === 0 ? 0 : v.lastIndexOf('\n', s - 1) + 1
      let le = v.indexOf('\n', e)
      if (le === -1) le = v.length
      const block = v.slice(ls, le).split('\n').map((l, i) => (prefix === '1. ' ? `${i + 1}. ${l}` : prefix + l)).join('\n')
      return { value: v.slice(0, ls) + block + v.slice(le), start: ls, end: ls + block.length }
    })
  const insertLink = () =>
    apply((v, s, e) => {
      const sel = v.slice(s, e) || 'link text'
      const ins = `[${sel}](https://)`
      return { value: v.slice(0, s) + ins + v.slice(e), start: s + sel.length + 3, end: s + ins.length - 1 }
    })

  // continue lists when pressing Enter
  const onKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
    const ta = e.target
    const pos = ta.selectionStart
    if (pos !== ta.selectionEnd) return
    const v = ta.value
    const ls = pos === 0 ? 0 : v.lastIndexOf('\n', pos - 1) + 1
    const line = v.slice(ls, pos)
    const m = line.match(/^(\s*)([-*+]|\d+\.)\s(\[[ xX]\]\s)?/)
    if (!m) return
    e.preventDefault()
    let next, caret
    if (line.trim() === m[0].trim()) {
      next = v.slice(0, ls) + v.slice(pos)
      caret = ls
    } else {
      const marker = /\d/.test(m[2]) ? `${parseInt(m[2], 10) + 1}.` : m[2]
      const ins = `\n${m[1]}${marker} ${m[3] ? '[ ] ' : ''}`
      next = v.slice(0, pos) + ins + v.slice(pos)
      caret = pos + ins.length
    }
    setContent(next)
    dirty.current = true
    requestAnimationFrame(() => ta.setSelectionRange(caret, caret))
  }

  // ---------- tags ----------
  const addTag = (raw) => {
    const t = raw.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-').slice(0, 24)
    if (t && !note.tags.includes(t) && note.tags.length < 12) updateNote(note.id, { tags: [...note.tags, t] })
    setTagInput('')
  }
  const removeTag = (t) => updateNote(note.id, { tags: note.tags.filter((x) => x !== t) })
  const onTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && note.tags.length) removeTag(note.tags[note.tags.length - 1])
  }

  const exportNote = () => {
    downloadFile(`${safeFileName(title)}.md`, `# ${title || 'Untitled'}\n\n${content}\n`, 'text/markdown')
    toast('Note exported as Markdown')
  }

  const tools = [
    [Bold, 'Bold', () => wrap('**')],
    [Italic, 'Italic', () => wrap('*')],
    [Heading, 'Heading', () => prefixLines('## ')],
    [List, 'Bullet list', () => prefixLines('- ')],
    [ListOrdered, 'Numbered list', () => prefixLines('1. ')],
    [ListChecks, 'Checklist', () => prefixLines('- [ ] ')],
    [Quote, 'Quote', () => prefixLines('> ')],
    [Code, 'Code', () => wrap('`')],
    [Link2, 'Link', insertLink]
  ]

  const Action = ({ icon: Icon, label, onClick, active }) => (
    <button className={cn('icon-btn', active && 'text-amber-600 dark:text-amber-400')} onClick={onClick} aria-label={label} title={label}>
      <Icon className={cn('h-[18px] w-[18px]', active && 'fill-current')} />
    </button>
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-sm" onClick={close} />
      <div className={cn('relative flex h-full w-full animate-sheet-up flex-col border shadow-2xl sm:h-[92vh] sm:max-w-3xl sm:rounded-2xl', palette.card)}>
        {/* top bar */}
        <div className="flex items-center gap-1 border-b border-black/5 px-2 py-2 pt-safe dark:border-white/10">
          <button className="icon-btn" onClick={close} aria-label="Close editor"><ArrowLeft className="h-5 w-5 sm:hidden" /><X className="hidden h-5 w-5 sm:block" /></button>
          <span className="hidden min-w-0 items-center gap-1.5 text-xs text-slate-500 sm:flex">
            {readOnly ? 'In trash' : status === 'saving' ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</> : status === 'error' ? <span className="text-red-500">Not saved</span> : <><Check className="h-3 w-3 text-emerald-500" /> Saved</>}
          </span>
          <div className="no-scrollbar ml-auto flex items-center gap-0.5 overflow-x-auto">
            {readOnly ? (
              <>
                <button className="btn-secondary px-3 py-1.5" onClick={async () => { await restoreNote(note.id); toast('Note restored') }}><RotateCcw className="h-4 w-4" /> Restore</button>
                <button className="btn-danger px-3 py-1.5" onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4" /> Delete forever</button>
              </>
            ) : (
              <>
                <Action icon={Pin} label={note.is_pinned ? 'Unpin' : 'Pin'} active={note.is_pinned} onClick={() => updateNote(note.id, { is_pinned: !note.is_pinned })} />
                <Action icon={Star} label={note.is_favorite ? 'Remove favorite' : 'Favorite'} active={note.is_favorite} onClick={() => updateNote(note.id, { is_favorite: !note.is_favorite })} />
                <div className="relative">
                  <Action icon={Palette} label="Colour" onClick={() => setColorOpen((o) => !o)} />
                  {colorOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setColorOpen(false)} />
                      <div className="absolute right-0 top-11 z-20 grid w-44 grid-cols-5 gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                        {Object.entries(NOTE_COLORS).map(([k, c]) => (
                          <button key={k} title={c.label} aria-label={c.label} onClick={() => { updateNote(note.id, { color: k }); setColorOpen(false) }} className={cn('flex h-6 w-6 items-center justify-center rounded-full border-2', c.dot, note.color === k && 'ring-2 ring-brand-500 ring-offset-1')}>
                            {note.color === k && <Check className="h-3 w-3 text-slate-700" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <Action icon={Share2} label="Share" active={note.is_shared} onClick={() => setShareOpen(true)} />
                <Action icon={Download} label="Export as Markdown" onClick={exportNote} />
                <Action icon={note.is_archived ? ArchiveRestore : Archive} label={note.is_archived ? 'Unarchive' : 'Archive'} onClick={() => { updateNote(note.id, { is_archived: !note.is_archived }); toast(note.is_archived ? 'Moved back to notes' : 'Note archived'); onClose() }} />
                <Action icon={Trash2} label="Move to trash" onClick={async () => { await save(); await trashNote(note.id); toast('Moved to trash'); onClose() }} />
              </>
            )}
          </div>
        </div>

        {/* title */}
        <div className="px-5 pt-4 sm:px-8">
          <input
            value={title}
            readOnly={readOnly}
            onChange={(e) => { setTitle(e.target.value); dirty.current = true }}
            placeholder="Title"
            maxLength={200}
            className="w-full bg-transparent font-serif text-2xl font-semibold text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white sm:text-3xl"
          />
          <p className="mt-1 text-xs text-slate-500">Edited {formatDateTime(note.updated_at)} · {wordCount(content)} words · {content.length} characters</p>
        </div>

        {/* toolbar */}
        {!readOnly && (
          <div className="mx-3 mt-3 flex items-center gap-1 rounded-xl bg-black/[.04] p-1 dark:bg-white/5 sm:mx-6">
            <div className="flex rounded-lg bg-white/70 p-0.5 dark:bg-slate-900/60">
              {[['edit', Pencil, 'Write'], ['preview', Eye, 'Preview']].map(([m, Icon, label]) => (
                <button key={m} onClick={() => setMode(m)} className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium', mode === m ? 'bg-brand-700 text-white' : 'text-slate-600 dark:text-slate-300')}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
            {mode === 'edit' && (
              <div className="no-scrollbar flex flex-1 items-center gap-0.5 overflow-x-auto">
                {tools.map(([Icon, label, fn]) => (
                  <button key={label} className="icon-btn h-8 w-8" onClick={fn} aria-label={label} title={label}><Icon className="h-4 w-4" /></button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-8">
          {mode === 'edit' && !readOnly ? (
            <textarea
              ref={taRef}
              value={content}
              onChange={(e) => { setContent(e.target.value); dirty.current = true }}
              onKeyDown={onKeyDown}
              placeholder={'Start writing…\n\nTip: use Markdown – **bold**, # headings, - [ ] checklists'}
              className="h-full min-h-[40vh] w-full resize-none bg-transparent text-base leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none dark:text-slate-200"
              autoFocus={!note.title && !note.content}
            />
          ) : content.trim() ? (
            <div className="prose prose-slate max-w-none dark:prose-invert prose-a:text-brand-700 dark:prose-a:text-brand-300 prose-pre:bg-slate-900">
              <Markdown remarkPlugins={[remarkGfm]} components={{ a: (p) => <a {...p} target="_blank" rel="noopener noreferrer" /> }}>{content}</Markdown>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nothing to preview yet.</p>
          )}
        </div>

        {/* footer: folder + tags */}
        <div className="flex flex-col gap-2 border-t border-black/5 px-4 py-3 pb-safe dark:border-white/10 sm:flex-row sm:items-center sm:px-6">
          <label className="flex shrink-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Folder className="h-4 w-4" />
            <select disabled={readOnly} value={note.folder_id || ''} onChange={(e) => updateNote(note.id, { folder_id: e.target.value || null })} className="rounded-lg border-0 bg-black/5 py-1.5 pl-2 pr-7 text-sm focus:ring-2 focus:ring-brand-500 dark:bg-white/10">
              <option value="">No folder</option>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {note.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-black/5 py-0.5 pl-2.5 pr-1 text-xs dark:bg-white/10">
                #{t}
                {!readOnly && <button onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`} className="rounded-full p-0.5 hover:bg-black/10"><X className="h-3 w-3" /></button>}
              </span>
            ))}
            {!readOnly && (
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={onTagKey} onBlur={() => tagInput && addTag(tagInput)} placeholder={note.tags.length ? 'Add tag' : 'Add tags (Enter)'} className="min-w-[7rem] flex-1 bg-transparent py-1 text-sm placeholder-slate-400 focus:outline-none" />
            )}
          </div>
        </div>
      </div>

      {shareOpen && <ShareModal note={note} onClose={() => setShareOpen(false)} />}
      <ConfirmDialog
        open={confirmDelete}
        danger
        title="Delete forever?"
        message="This note will be permanently deleted. This can’t be undone."
        confirmLabel="Delete forever"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => { setConfirmDelete(false); await deleteForever(note.id); onClose() }}
      />
    </div>
  )
}
