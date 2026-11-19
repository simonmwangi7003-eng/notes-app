import { cn } from '../lib/utils'

export function LogoMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="#0f766e" />
      <path d="M16 14h24l8 8v30H16z" fill="#f0fdfa" />
      <path d="M40 14v8h8" fill="#99f6e4" />
      <path d="M23 30h18M23 37h18M23 44h11" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo({ className }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-serif text-xl font-semibold tracking-tight text-slate-900 dark:text-white', className)}>
      <LogoMark />
      Jotbook
    </span>
  )
}
