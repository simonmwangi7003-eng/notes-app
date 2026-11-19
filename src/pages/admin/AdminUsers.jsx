import { useCallback, useEffect, useMemo, useState } from 'react'
import { Ban, CheckCircle2, Download, Search, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../../components/Modal'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { cn, downloadFile, formatDate, formatNumber, initials, timeAgo } from '../../lib/utils'

export default function AdminUsers() {
  const { user } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_users')
    if (error) toast(error.message, 'error')
    else setUsers(data)
    setLoading(false)
  }, [toast])
  useEffect(() => { load() }, [load])

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    return users.filter((u) => {
      if (filter === 'admin' && u.role !== 'admin') return false
      if (filter === 'suspended' && !u.is_suspended) return false
      return !t || `${u.email} ${u.full_name}`.toLowerCase().includes(t)
    })
  }, [users, q, filter])

  const run = async (fn, args, ok) => {
    const { error } = await supabase.rpc(fn, args)
    if (error) toast(error.message, 'error')
    else { toast(ok); load() }
  }

  const exportCSV = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = ['name,email,role,suspended,notes,folders,joined,last_seen', ...users.map((u) => [u.full_name, u.email, u.role, u.is_suspended, u.note_count, u.folder_count, u.created_at, u.last_seen_at].map(esc).join(','))].join('\n')
    downloadFile('jotbook-users.csv', csv, 'text/csv')
  }

  const Actions = ({ u }) => {
    const self = u.id === user.id
    return (
      <div className="flex gap-1">
        <button disabled={self} className="icon-btn disabled:opacity-30" title={u.role === 'admin' ? 'Remove admin' : 'Make admin'} aria-label="Toggle admin" onClick={() => setConfirm({ title: u.role === 'admin' ? 'Remove admin rights?' : 'Make this user an admin?', message: `${u.email} will ${u.role === 'admin' ? 'lose' : 'gain'} access to the admin console.`, label: 'Confirm', run: () => run('admin_set_role', { target: u.id, new_role: u.role === 'admin' ? 'user' : 'admin' }, 'Role updated') })}>
          {u.role === 'admin' ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
        </button>
        <button disabled={self} className="icon-btn disabled:opacity-30" title={u.is_suspended ? 'Reinstate' : 'Suspend'} aria-label="Toggle suspension" onClick={() => run('admin_set_suspended', { target: u.id, suspended: !u.is_suspended }, u.is_suspended ? 'User reinstated' : 'User suspended')}>
          {u.is_suspended ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Ban className="h-4 w-4" />}
        </button>
        <button disabled={self} className="icon-btn text-red-500 disabled:opacity-30" title="Delete user" aria-label="Delete user" onClick={() => setConfirm({ danger: true, title: 'Delete this user?', message: `${u.email} and all of their notes will be permanently deleted.`, label: 'Delete user', run: () => run('admin_delete_user', { target: u.id }, 'User deleted') })}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  const Badges = ({ u }) => (
    <span className="flex flex-wrap gap-1">
      {u.role === 'admin' && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800 dark:bg-brand-500/20 dark:text-brand-200">Admin</span>}
      {u.is_suspended && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/20 dark:text-red-300">Suspended</span>}
      {u.id === user.id && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">You</span>}
    </span>
  )

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto"><h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-white">Users</h1><p className="text-sm text-slate-500">{users.length} accounts</p></div>
        <button className="btn-secondary" onClick={exportCSV}><Download className="h-4 w-4" /> Export CSV</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="input pl-9" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
          {[['all', 'All'], ['admin', 'Admins'], ['suspended', 'Suspended']].map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={cn('rounded-md px-3 py-1.5 text-sm', filter === k ? 'bg-brand-700 text-white' : 'text-slate-600 dark:text-slate-300')}>{l}</button>)}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-16 text-brand-700"><Spinner className="h-7 w-7" /></div> : (
        <>
          {/* desktop table */}
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900"><tr><th className="px-4 py-3 font-medium">User</th><th className="px-4 py-3 font-medium">Notes</th><th className="px-4 py-3 font-medium">Joined</th><th className="px-4 py-3 font-medium">Last seen</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">{initials(u.full_name || u.email)}</span><div className="min-w-0"><p className="truncate font-medium text-slate-900 dark:text-white">{u.full_name || '—'}</p><p className="truncate text-xs text-slate-500">{u.email}</p></div></div><div className="mt-1 pl-12"><Badges u={u} /></div></td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(u.note_count)} <span className="text-xs text-slate-400">· {u.folder_count} folders</span></td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{timeAgo(u.last_seen_at)}</td>
                    <td className="px-4 py-3"><div className="flex justify-end"><Actions u={u} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <div className="space-y-3 md:hidden">
            {rows.map((u) => (
              <div key={u.id} className="card p-4">
                <div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">{initials(u.full_name || u.email)}</span><div className="min-w-0 flex-1"><p className="truncate font-medium text-slate-900 dark:text-white">{u.full_name || '—'}</p><p className="truncate text-xs text-slate-500">{u.email}</p></div></div>
                <div className="mt-2"><Badges u={u} /></div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs"><div><dt className="text-slate-500">Notes</dt><dd className="font-medium">{u.note_count}</dd></div><div><dt className="text-slate-500">Joined</dt><dd className="font-medium">{formatDate(u.created_at)}</dd></div><div><dt className="text-slate-500">Last seen</dt><dd className="font-medium">{timeAgo(u.last_seen_at)}</dd></div></dl>
                <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800"><Actions u={u} /></div>
              </div>
            ))}
          </div>
          {!rows.length && <p className="py-12 text-center text-sm text-slate-500">No users match.</p>}
        </>
      )}

      <ConfirmDialog open={!!confirm} danger={confirm?.danger} title={confirm?.title} message={confirm?.message} confirmLabel={confirm?.label} onCancel={() => setConfirm(null)} onConfirm={() => { const c = confirm; setConfirm(null); c.run() }} />
    </div>
  )
}
