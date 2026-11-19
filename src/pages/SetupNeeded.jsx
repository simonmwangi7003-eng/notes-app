import { Database } from 'lucide-react'

export default function SetupNeeded() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card max-w-lg p-8">
        <Database className="h-10 w-10 text-brand-700" />
        <h1 className="mt-4 font-serif text-2xl font-semibold text-slate-900 dark:text-white">Connect Supabase to continue</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">The app can’t find your Supabase keys. Create a <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env</code> file in the project root:</p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">{`VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key`}</pre>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Then restart <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">npm run dev</code>. See README.md for the full guide.</p>
      </div>
    </div>
  )
}
