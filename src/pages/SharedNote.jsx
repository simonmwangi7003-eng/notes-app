import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileX } from 'lucide-react'
import Logo from '../components/Logo'
import { FullSpinner } from '../components/Spinner'
import { supabase } from '../lib/supabase'
import { colorOf, cn, formatDate } from '../lib/utils'

export default function SharedNote() {
  const { token } = useParams()
  const [note, setNote] = useState(undefined)

  useEffect(() => {
    supabase.rpc('get_shared_note', { p_token: token }).then(({ data, error }) => setNote(error || !data?.length ? null : data[0]))
  }, [token])

  if (note === undefined) return <FullSpinner />
  return (
    <div className="min-h-screen px-4 py-8 pb-safe pt-safe">
      <div className="mx-auto max-w-2xl">
        <Link to="/"><Logo /></Link>
        {note === null ? (
          <div className="mt-20 text-center">
            <FileX className="mx-auto h-12 w-12 text-slate-400" />
            <h1 className="mt-4 font-serif text-2xl font-semibold text-slate-900 dark:text-white">This note isn’t available</h1>
            <p className="mt-1 text-sm text-slate-500">The link may be wrong, or the owner stopped sharing it.</p>
          </div>
        ) : (
          <article className={cn('mt-8 rounded-2xl border p-6 shadow-sm sm:p-10', colorOf(note.color).card)}>
            <h1 className="font-serif text-3xl font-semibold text-slate-900 dark:text-white">{note.title || 'Untitled'}</h1>
            <p className="mt-2 text-sm text-slate-500">By {note.author} · Updated {formatDate(note.updated_at)}</p>
            <div className="prose prose-slate mt-6 max-w-none dark:prose-invert prose-a:text-brand-700 dark:prose-a:text-brand-300">
              <Markdown remarkPlugins={[remarkGfm]} components={{ a: (p) => <a {...p} target="_blank" rel="noopener noreferrer nofollow" /> }}>{note.content}</Markdown>
            </div>
            {note.tags?.length > 0 && <div className="mt-6 flex flex-wrap gap-1.5">{note.tags.map((t) => <span key={t} className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs dark:bg-white/10">#{t}</span>)}</div>}
          </article>
        )}
        <p className="mt-8 text-center text-sm text-slate-500">Made with Jotbook · <Link className="font-medium text-brand-700 hover:underline dark:text-brand-300" to="/signup">Start your own notebook</Link></p>
      </div>
    </div>
  )
}
