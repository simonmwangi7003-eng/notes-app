import { Link, NavLink } from 'react-router-dom'
import { ArrowLeft, LayoutDashboard, LogOut, Users } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'
import { navCls } from '../lib/utils'

export default function AdminSidebar() {
  const { user, signOut } = useAuth()
  return (
    <>
      <div className="px-5 pb-1 pt-5"><Link to="/admin"><Logo /></Link></div>
      <p className="px-5 pb-3 text-xs font-medium text-brand-700 dark:text-brand-300">Admin console</p>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        <NavLink to="/admin" end className={navCls}><LayoutDashboard className="h-4 w-4" /> Statistics</NavLink>
        <NavLink to="/admin/users" className={navCls}><Users className="h-4 w-4" /> Users</NavLink>
      </nav>
      <div className="space-y-1 border-t border-slate-200 p-3 dark:border-slate-800">
        <Link to="/app" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><ArrowLeft className="h-4 w-4" /> Back to my notes</Link>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><LogOut className="h-4 w-4" /> Sign out</button>
        <p className="truncate px-3 pt-1 text-xs text-slate-400">{user.email}</p>
      </div>
    </>
  )
}
