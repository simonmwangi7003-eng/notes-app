import { Loader2 } from 'lucide-react'

export default function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-label="Loading" />
}

export function FullSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center text-brand-700 dark:text-brand-300">
      <Spinner className="h-8 w-8" />
    </div>
  )
}
