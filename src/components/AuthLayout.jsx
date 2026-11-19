import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Logo from './Logo'

const POINTS = ['Markdown, checklists, tags and folders', 'Live sync across phone, tablet and desktop', 'Works offline once installed']

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-12 text-brand-50 lg:flex">
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-brand-700/40" />
        <div className="pointer-events-none absolute -right-8 top-32 h-40 w-40 rotate-12 rounded-3xl bg-amber-300/90" />
        <Link to="/" className="relative font-serif text-2xl font-semibold">Jotbook</Link>
        <div className="relative">
          <h2 className="font-serif text-4xl font-semibold leading-tight">Write it down.<br />Find it later.</h2>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => <li key={p} className="flex items-center gap-3 text-brand-100"><CheckCircle2 className="h-5 w-5 shrink-0 text-brand-300" />{p}</li>)}
          </ul>
        </div>
        <p className="relative text-sm text-brand-300">Your notes are private to you.</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-10 pb-safe pt-safe">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-block lg:hidden"><Logo /></Link>
          <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-white">{title}</h1>
          <p className="mb-7 mt-1.5 text-sm text-slate-500">{subtitle}</p>
          {children}
          <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
        </div>
      </main>
    </div>
  )
}
