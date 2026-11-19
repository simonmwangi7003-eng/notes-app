import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-serif text-7xl font-semibold text-brand-700 dark:text-brand-300">404</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">That page doesn’t exist</h1>
      <p className="mt-1 text-sm text-slate-500">It may have moved, or the link is mistyped.</p>
      <Link to="/app" className="btn-primary mt-6">Go to my notes</Link>
    </div>
  )
}
