import { useState } from 'react'
import { Check, Copy, Globe, Lock } from 'lucide-react'
import Modal from './Modal'
import { useNotes } from '../context/NotesContext'
import { useToast } from '../context/ToastContext'

export default function ShareModal({ note, onClose }) {
  const { updateNote } = useNotes()
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/shared/${note.share_token}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast('Could not copy – select the link and copy it manually.', 'error')
    }
  }

  return (
    <Modal open onClose={onClose} title="Share note">
      <div className="space-y-4 pb-3">
        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          {note.is_shared ? <Globe className="mt-0.5 h-5 w-5 text-sky-500" /> : <Lock className="mt-0.5 h-5 w-5 text-slate-400" />}
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{note.is_shared ? 'Anyone with the link can read this note' : 'Only you can see this note'}</p>
            <p className="mt-0.5 text-xs text-slate-500">Shared notes are read-only and show your name as the author.</p>
          </div>
        </div>
        {note.is_shared && (
          <div className="flex gap-2">
            <input readOnly className="input" value={link} onFocus={(e) => e.target.select()} />
            <button className="btn-secondary shrink-0" onClick={copy}>{copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied' : 'Copy'}</button>
          </div>
        )}
        <button className={note.is_shared ? 'btn-secondary w-full' : 'btn-primary w-full'} onClick={() => updateNote(note.id, { is_shared: !note.is_shared })}>
          {note.is_shared ? 'Stop sharing' : 'Create share link'}
        </button>
      </div>
    </Modal>
  )
}
