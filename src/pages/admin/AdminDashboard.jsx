import { useCallback, useEffect, useState } from 'react'
import { Archive, Activity, FileText, FolderOpen, Globe, Hash, Pin, RefreshCw, Star, Trash2, UserPlus, Users, UserX } from 'lucide-react'
import { Link } from 'react-router-dom'
import BarChart from '../../components/BarChart'
import Spinner from '../../components/Spinner'
import { supabase } from '../../lib/supabase'
import { cn, formatNumber, timeAgo } from '../../lib/utils'

const Stat = ({ icon: Icon, label, value, sub, tone = 'brand' }) => {
  const tones = { brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300', amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' }
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tones[tone])}><Icon className="h-5 w-5" /></span>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <p className="mt-3 font-serif text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">{formatNumber(value)}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [days, setDays] = useState(30)
  const [stats, setStats] = useState(null)
  const [series, setSeries] = useState([])
  const [tags, setTags] = useState([])
  const [recent, setRecent] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [s, t, g, u] = await Promise.all([
      supabase.rpc('admin_stats'),
      supabase.rpc('admin_timeseries', { p_days: days }),
      supabase.rpc('admin_top_tags'),
      supabase.rpc('admin_users')
    ])
    const err = s.error || t.error || g.error || u.error
    if (err) setError(err.message)
    else {
      setError('')
      setStats(s.data)
      setSeries(t.data)
      setTags(g.data)
      setRecent(u.data.slice(0, 6))
    }
    setLoading(false)
  }, [days])

  useEffect(() => { load() }, [load])

  const fmt = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const live = stats ? Math.max(stats.total_notes, 1) : 1
  const breakdown = stats && [
    ['Pinned', stats.pinned_notes, 'bg-amber-500'],
    ['Favorites', stats.favorite_notes, 'bg-yellow-400'],
    ['Shared by link', stats.shared_notes, 'bg-sky-500'],
    ['Archived', stats.archived_notes, 'bg-slate-400']
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-white">Statistics</h1>
          <p className="text-sm text-slate-500">Usage across all accounts. Note contents are never shown here.</p>
        </div>
        <select className="input w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Chart range">
          <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
        </select>
        <button className="btn-secondary" onClick={load} disabled={loading}>{loading ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />} Refresh</button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}. Make sure schema.sql was run and your account has the admin role.</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={Users} label="Total users" value={stats.total_users} sub={`${stats.admins} admin${stats.admins === 1 ? '' : 's'}`} />
            <Stat icon={UserPlus} label="New this week" value={stats.new_users_7d} sub={`${stats.new_users_today} today`} tone="sky" />
            <Stat icon={Activity} label="Active (24h)" value={stats.active_users_24h} sub={`${stats.active_users_7d} in 7 days`} tone="amber" />
            <Stat icon={UserX} label="Suspended" value={stats.suspended_users} tone="rose" />
            <Stat icon={FileText} label="Notes" value={stats.total_notes} sub={`${stats.avg_notes_per_user} per user`} />
            <Stat icon={FileText} label="Created this week" value={stats.notes_7d} sub={`${stats.notes_today} today`} tone="sky" />
            <Stat icon={FolderOpen} label="Folders" value={stats.total_folders} tone="amber" />
            <Stat icon={Trash2} label="In trash" value={stats.trashed_notes} tone="rose" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5"><h2 className="mb-4 font-semibold text-slate-900 dark:text-white">New sign-ups</h2><BarChart barClass="bg-sky-500" data={series.map((d) => ({ label: fmt(d.day), value: d.new_users }))} /></div>
            <div className="card p-5"><h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Notes created</h2><BarChart data={series.map((d) => ({ label: fmt(d.day), value: d.new_notes }))} /></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card p-5">
              <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Note breakdown</h2>
              <div className="space-y-4">
                {breakdown.map(([label, n, color]) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">{label}</span><span className="tabular-nums text-slate-900 dark:text-white">{formatNumber(n)}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={cn('h-full rounded-full', color)} style={{ width: `${Math.min((n / live) * 100, 100)}%` }} /></div>
                  </div>
                ))}
                <p className="border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">{formatNumber(stats.total_characters)} characters stored</p>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Top tags</h2>
              {tags.length ? <ul className="space-y-2.5">{tags.map((t) => <li key={t.tag} className="flex items-center justify-between text-sm"><span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300"><Hash className="h-3.5 w-3.5 text-slate-400" />{t.tag}</span><span className="tabular-nums text-slate-500">{t.uses}</span></li>)}</ul> : <p className="text-sm text-slate-500">No tags used yet.</p>}
            </div>

            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-slate-900 dark:text-white">Newest users</h2><Link to="/admin/users" className="text-sm text-brand-700 hover:underline dark:text-brand-300">View all</Link></div>
              <ul className="space-y-3">
                {recent.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0"><p className="truncate font-medium text-slate-800 dark:text-slate-200">{u.full_name || u.email}</p><p className="truncate text-xs text-slate-500">{u.email}</p></div>
                    <span className="shrink-0 text-xs text-slate-500">{timeAgo(u.created_at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
