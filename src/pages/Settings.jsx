import { useRef, useState } from 'react'
import { Download, FileDown, FileUp, Monitor, Moon, ShieldAlert, Smartphone, Sun, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotes } from '../context/NotesContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import Modal from '../components/Modal'
import { supabase } from '../lib/supabase'
import { cn, downloadFile, formatDate } from '../lib/utils'
import { useNavigate } from 'react-router-dom'

const Section = ({ title, desc, children }) => (
  <section className="card p-5 sm:p-6">
    <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
    {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
    <div className="mt-4">{children}</div>
  </section>
)

export default function Settings() {
  const { user, profile, updateProfile, updatePassword, signOut } = useAuth()
  const { notes, folders, importNotes } = useNotes()
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()
  const { installed, canInstall, showIOSHelp, install } = useInstallPrompt()

  const [name, setName] = useState(profile?.full_name || '')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const fileRef = useRef(null)

  const live = notes.filter((n) => !n.deleted_at)
  const folderName = (id) => folders.find((f) => f.id === id)?.name || null

  const saveName = async (e) => {
    e.preventDefault()
    setBusy('name')
    const { error } = await updateProfile({ full_name: name.trim() })
    setBusy('')
    error ? toast(error.message, 'error') : toast('Profile updated')
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (password.length < 8) return toast('Use at least 8 characters.', 'error')
    setBusy('pw')
    const { error } = await updatePassword(password)
    setBusy('')
    if (error) toast(error.message, 'error')
    else { toast('Password changed'); setPassword('') }
  }

  const exportJSON = () => {
    const data = live.map(({ title, content, color, tags, is_pinned, is_favorite, is_archived, created_at, updated_at, folder_id }) => ({ title, content, color, tags, is_pinned, is_favorite, is_archived, created_at, updated_at, folder: folderName(folder_id) }))
    downloadFile(`jotbook-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'jotbook', version: 1, notes: data }, null, 2), 'application/json')
    toast(`Exported ${data.length} notes`)
  }

  const exportMarkdown = () => {
    const md = live.map((n) => `# ${n.title || 'Untitled'}\n\n${n.tags.length ? n.tags.map((t) => `#${t}`).join(' ') + '\n\n' : ''}${n.content}\n`).join('\n---\n\n')
    downloadFile(`jotbook-notes-${new Date().toISOString().slice(0, 10)}.md`, md, 'text/markdown')
  }

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const rows = (Array.isArray(parsed) ? parsed : parsed.notes || []).slice(0, 500).map((n) => ({
        title: String(n.title || '').slice(0, 200),
        content: String(n.content || ''),
        color: n.color || 'default',
        tags: Array.isArray(n.tags) ? n.tags.map(String).slice(0, 12) : [],
        is_pinned: !!n.is_pinned,
        is_favorite: !!n.is_favorite,
        is_archived: !!n.is_archived
      }))
      if (!rows.length) return toast('No notes found in that file.', 'error')
      setBusy('import')
      const { error } = await importNotes(rows)
      setBusy('')
      error ? toast(error.message, 'error') : toast(`Imported ${rows.length} notes`)
    } catch {
      toast('That file is not a valid Jotbook backup.', 'error')
    }
  }

  const deleteAccount = async () => {
    setBusy('delete')
    const { error } = await supabase.rpc('delete_my_account')
    if (error) { setBusy(''); return toast(error.message, 'error') }
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pb-24 pt-6 sm:px-6 lg:pt-10">
      <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-white">Settings</h1>

      <Section title="Profile" desc={`Member since ${profile ? formatDate(profile.created_at) : '…'} · ${live.length} notes`}>
        <form onSubmit={saveName} className="space-y-3">
          <div><label className="label">Email</label><input className="input opacity-70" readOnly value={user.email} /></div>
          <div><label className="label" htmlFor="fn">Full name</label><input id="fn" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
          <button className="btn-primary" disabled={busy === 'name' || !name.trim()}>Save profile</button>
        </form>
      </Section>

      <Section title="Appearance">
        <div className="grid grid-cols-3 gap-2">
          {[['system', Monitor, 'System'], ['light', Sun, 'Light'], ['dark', Moon, 'Dark']].map(([k, Icon, label]) => (
            <button key={k} onClick={() => setTheme(k)} className={cn('flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm', theme === k ? 'border-brand-600 bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800')}>
              <Icon className="h-5 w-5" /> {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Install app" desc="Run Jotbook full-screen from your home screen or desktop.">
        {installed ? <p className="text-sm text-emerald-600 dark:text-emerald-400">Jotbook is installed on this device.</p>
          : canInstall ? <button className="btn-primary" onClick={install}><Smartphone className="h-4 w-4" /> Install Jotbook</button>
          : showIOSHelp ? <p className="text-sm text-slate-600 dark:text-slate-400">In Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>.</p>
          : <p className="text-sm text-slate-600 dark:text-slate-400">Use your browser’s menu → <b>Install app</b> (or “Add to Home Screen”).</p>}
      </Section>

      <Section title="Password">
        <form onSubmit={savePassword} className="flex flex-col gap-3 sm:flex-row">
          <input className="input" type="password" autoComplete="new-password" placeholder="New password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn-secondary shrink-0" disabled={busy === 'pw' || !password}>Change password</button>
        </form>
      </Section>

      <Section title="Your data" desc="Back up, move or import your notes.">
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={exportJSON}><FileDown className="h-4 w-4" /> Backup (JSON)</button>
          <button className="btn-secondary" onClick={exportMarkdown}><Download className="h-4 w-4" /> Export Markdown</button>
          <button className="btn-secondary" disabled={busy === 'import'} onClick={() => fileRef.current?.click()}><FileUp className="h-4 w-4" /> Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
        </div>
      </Section>

      <section className="rounded-2xl border border-red-200 p-5 dark:border-red-900/60 sm:p-6">
        <h2 className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400"><ShieldAlert className="h-4 w-4" /> Delete account</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Permanently removes your account, folders and every note. This can’t be undone.</p>
        <button className="btn-danger mt-4" onClick={() => setDeleteOpen(true)}>Delete my account</button>
      </section>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete your account?" footer={<><button className="btn-secondary" onClick={() => setDeleteOpen(false)}>Cancel</button><button className="btn-danger" disabled={confirmText !== 'DELETE' || busy === 'delete'} onClick={deleteAccount}>Delete everything</button></>}>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">Type <b>DELETE</b> to confirm.</p>
        <input className="input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
      </Modal>
    </div>
  )
}
