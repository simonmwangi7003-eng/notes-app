import { Archive, Folder, Globe, Pin, RotateCcw, Star, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotes } from '../context/NotesContext'
import { cn, colorOf, stripMarkdown, timeAgo } from '../lib/utils'

export default function NoteCard({ note, layout, folderName, onOpen, onDeleteForever }) {
  const { updateNote, restoreNote } = useNotes()
  const navigate = useNavigate()
  const trashed = !!note.deleted_at
  const preview = stripMarkdown(note.content).slice(0, 320)

  const stop = (fn) => (e) => {
    e.stopPropagation()
    fn()
  }

  return (
    <article
      tabIndex={0}
      onClick={() => onOpen(note.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(note.id))}
      className={cn(
        'group relative cursor-pointer break-inside-avoid rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-offset-0',
        colorOf(note.color).card,
        layout === 'grid' ? 'mb-4' : 'mb-3'
      )}
    >
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 break-words font-serif text-lg font-semibold leading-snug text-slate-900 dark:text-white">
          {note.title || <span className="text-slate-400">Untitled</span>}
        </h3>
        {!trashed && (
          <div className="-mr-1 -mt-1 flex shrink-0 gap-0.5">
            <button className={cn('icon-btn h-8 w-8', note.is_pinned && 'text-amber-600 dark:text-amber-400')} onClick={stop(() => updateNote(note.id, { is_pinned: !note.is_pinned }))} aria-label={note.is_pinned ? 'Unpin' : 'Pin'} title={note.is_pinned ? 'Unpin' : 'Pin'}>
              <Pin className={cn('h-4 w-4', note.is_pinned && 'fill-current')} />
            </button>
            <button className={cn('icon-btn h-8 w-8', !note.is_favorite && 'sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100', note.is_favorite && 'text-amber-500')} onClick={stop(() => updateNote(note.id, { is_favorite: !note.is_favorite }))} aria-label="Toggle favorite" title="Favorite">
              <Star className={cn('h-4 w-4', note.is_favorite && 'fill-current')} />
            </button>
          </div>
        )}
      </div>

      {preview && (
        <p className={cn('mt-2 whitespace-pre-line break-words text-sm text-slate-600 dark:text-slate-400', layout === 'grid' ? 'line-clamp-6' : 'line-clamp-2')}>
          {preview}
        </p>
      )}

      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {note.tags.slice(0, 5).map((t) => (
            <button key={t} onClick={stop(() => navigate(`/app/tag/${encodeURIComponent(t)}`))} className="rounded-full bg-slate-900/5 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-300">#{t}</button>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <span>{timeAgo(note.updated_at)}</span>
        {folderName && <span className="inline-flex min-w-0 items-center gap-1 truncate"><Folder className="h-3 w-3 shrink-0" />{folderName}</span>}
        {note.is_shared && <Globe className="h-3 w-3 text-sky-500" aria-label="Shared" />}
        {note.is_archived && <Archive className="h-3 w-3" aria-label="Archived" />}
        {trashed && (
          <span className="ml-auto flex gap-1">
            <button className="btn-secondary px-2 py-1 text-xs" onClick={stop(() => restoreNote(note.id))}><RotateCcw className="h-3 w-3" /> Restore</button>
            <button className="btn-secondary px-2 py-1 text-xs text-red-600" onClick={stop(() => onDeleteForever(note))} aria-label="Delete forever"><Trash2 className="h-3 w-3" /></button>
          </span>
        )}
      </div>
    </article>
  )
}
