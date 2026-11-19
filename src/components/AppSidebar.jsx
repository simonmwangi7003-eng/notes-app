import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Archive, FolderPlus, Folder, Hash, LogOut, Moon, NotebookText, Settings, ShieldCheck, Star, Sun, Monitor, Trash2 } from 'lucide-react'
import Logo from './Logo'
import Modal from './Modal'
import { useAuth } from '../context/AuthContext'
import { useNotes } from '../context/NotesContext'
import { useTheme } from '../context/ThemeContext'
import { initials, navCls } from '../lib/utils'

const Count = ({ n }) => (n ? <span className="ml-auto text-xs tabular-nums text-slate-400">{n}</span> : null)

export default function AppSidebar() {
  const { profile, user, isAdmin, signOut } = useAuth()
  const { counts, folders, tags, notes, createFolder } = useNotes()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [folderModal, setFolderModal] = useState(false)
  const [name, setName] = useState('')

  const folderCount = (id) => notes.filter((n) => n.folder_id === id && !n.deleted_at && !n.is_archived).length
  const nextTheme = { system: 'light', light: 'dark', dark: 'system' }[theme]
  const ThemeIcon = { system: Monitor, light: Sun, dark: Moon }[theme]

  const submitFolder = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const f = await createFolder(name.trim())
    if (f) {
      setName('')
      setFolderModal(false)
      navigate(`/app/folder/${f.id}`)
    }
  }

  return (
    <>
      <div className="px-5 pb-3 pt-5"><Link to="/app"><Logo /></Link></div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        <div className="space-y-0.5">
          <NavLink to="/app" end className={navCls}><NotebookText className="h-4 w-4" /> All notes <Count n={counts.all} /></NavLink>
          <NavLink to="/app/favorites" className={navCls}><Star className="h-4 w-4" /> Favorites <Count n={counts.favorites} /></NavLink>
          <NavLink to="/app/archive" className={navCls}><Archive className="h-4 w-4" /> Archive <Count n={counts.archive} /></NavLink>
          <NavLink to="/app/trash" className={navCls}><Trash2 className="h-4 w-4" /> Trash <Count n={counts.trash} /></NavLink>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between px-3">
            <span className="text-xs font-semibold text-slate-500">Folders</span>
            <button className="icon-btn h-7 w-7" onClick={() => setFolderModal(true)} aria-label="New folder"><FolderPlus className="h-4 w-4" /></button>
          </div>
          <div className="space-y-0.5">
            {folders.map((f) => (
              <NavLink key={f.id} to={`/app/folder/${f.id}`} className={navCls}>
                <Folder className="h-4 w-4 shrink-0" /> <span className="truncate">{f.name}</span> <Count n={folderCount(f.id)} />
              </NavLink>
            ))}
            {!folders.length && <p className="px-3 py-1 text-xs text-slate-400">No folders yet</p>}
          </div>
        </div>

        {tags.length > 0 && (
          <div>
            <span className="mb-1 block px-3 text-xs font-semibold text-slate-500">Tags</span>
            <div className="space-y-0.5">
              {tags.slice(0, 12).map((t) => (
                <NavLink key={t.name} to={`/app/tag/${encodeURIComponent(t.name)}`} className={navCls}>
                  <Hash className="h-4 w-4 shrink-0" /> <span className="truncate">{t.name}</span> <Count n={t.count} />
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="space-y-1 border-t border-slate-200 p-3 dark:border-slate-800">
        {isAdmin && <NavLink to="/admin" className={navCls}><ShieldCheck className="h-4 w-4" /> Admin dashboard</NavLink>}
        <NavLink to="/app/settings" className={navCls}><Settings className="h-4 w-4" /> Settings</NavLink>
        <div className="flex items-center gap-2 rounded-lg px-2 pt-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">{initials(profile?.full_name || user.email)}</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{profile?.full_name || 'You'}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <button className="icon-btn" onClick={() => setTheme(nextTheme)} aria-label={`Theme: ${theme}`} title={`Theme: ${theme}`}><ThemeIcon className="h-4 w-4" /></button>
          <button className="icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>

      <Modal open={folderModal} onClose={() => setFolderModal(false)} title="New folder">
        <form onSubmit={submitFolder} className="space-y-4 pb-2">
          <input className="input" autoFocus maxLength={60} placeholder="Folder name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setFolderModal(false)}>Cancel</button>
            <button className="btn-primary" disabled={!name.trim()}>Create folder</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
