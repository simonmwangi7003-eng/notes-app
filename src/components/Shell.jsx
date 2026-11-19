import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'

// Responsive frame: fixed sidebar on desktop, slide-in drawer on phones/tablets.
export default function Shell({ sidebar, children }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])

  return (
    <div className="min-h-screen lg:flex">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/85 px-3 pt-safe backdrop-blur dark:border-slate-800 dark:bg-slate-950/85 lg:hidden">
        <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        <Logo className="text-lg" />
      </header>

      {open && <div className="fixed inset-0 z-40 animate-fade-in bg-slate-950/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white pt-safe pb-safe transition-transform dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button className="icon-btn absolute right-2 top-2 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
        {sidebar()}
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
