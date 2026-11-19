import { Link } from 'react-router-dom'
import { CheckSquare, CloudOff, FolderTree, Share2, ShieldCheck, Smartphone } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  [CheckSquare, 'Markdown that stays out of the way', 'Headings, checklists, code and links, with a live preview and list auto-continue.'],
  [FolderTree, 'Folders, tags, colours, pins', 'Sort notes the way your head does and find any of them with instant search.'],
  [Smartphone, 'Installs like an app', 'Add it to your home screen on iPhone, Android or desktop for a full-screen experience.'],
  [CloudOff, 'Reads offline', 'Your latest notes are saved on the device, so they open on a plane or a bad connection.'],
  [Share2, 'Share by link', 'Turn on a read-only link for any note and switch it off whenever you like.'],
  [ShieldCheck, 'Private by default', 'Row-level security means only you can read your notes. Not even admins can open them.']
]

export default function Landing() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 pt-safe">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? <Link to="/app" className="btn-primary">Open notes</Link> : (<><Link to="/login" className="btn-ghost">Sign in</Link><Link to="/signup" className="btn-primary">Get started</Link></>)}
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-12 lg:grid-cols-2 lg:pt-20">
        <div>
          <h1 className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-6xl">Notes that follow you everywhere.</h1>
          <p className="mt-6 max-w-lg text-lg text-slate-600 dark:text-slate-400">Jotbook is a fast, private notebook for lists, drafts and half-formed ideas. Write on your phone, pick it up on your laptop.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={user ? '/app' : '/signup'} className="btn-primary px-6 py-3 text-base">{user ? 'Open my notes' : 'Start writing free'}</Link>
            {!user && <Link to="/login" className="btn-secondary px-6 py-3 text-base">I have an account</Link>}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
          <div className="absolute -left-4 top-6 h-full w-full rotate-[-4deg] rounded-2xl border border-yellow-200 bg-yellow-50 dark:border-yellow-900/60 dark:bg-yellow-950/40" />
          <div className="absolute -right-3 top-3 h-full w-full rotate-[3deg] rounded-2xl border border-teal-200 bg-teal-50 dark:border-teal-900/60 dark:bg-teal-950/40" />
          <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <p className="font-serif text-xl font-semibold text-slate-900 dark:text-white">Trip to Mombasa</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
              {[['Book train tickets', true], ['Pack sunscreen and hat', true], ['Confirm hotel pickup', false], ['Download offline maps', false]].map(([t, d]) => (
                <li key={t} className="flex items-center gap-3"><span className={`flex h-5 w-5 items-center justify-center rounded border ${d ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 dark:border-slate-600'}`}>{d && '✓'}</span><span className={d ? 'text-slate-400 line-through' : ''}>{t}</span></li>
              ))}
            </ul>
            <div className="mt-5 flex gap-1.5 text-xs"><span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">#travel</span><span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">#december</span></div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-10 px-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([Icon, title, text]) => (
            <div key={title}>
              <Icon className="h-6 w-6 text-brand-700 dark:text-brand-300" />
              <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-5 py-8 text-center text-sm text-slate-500 pb-safe">© {new Date().getFullYear()} Jotbook</footer>
    </div>
  )
}
