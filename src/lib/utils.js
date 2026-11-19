export const cn = (...a) => a.filter(Boolean).join(' ')

export const navCls = ({ isActive }) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  )

export function timeAgo(date) {
  const d = new Date(date)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 45) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

export const formatDateTime = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
export const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' })
export const formatNumber = (n) => Number(n || 0).toLocaleString()

export function stripMarkdown(text = '') {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+\[( |x)\]\s+/gim, (m, c) => (c.trim() ? '☑ ' : '☐ '))
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^>\s?/gm, '')
    .replace(/[*_~`]/g, '')
    .trim()
}

export const wordCount = (t = '') => (t.trim() ? t.trim().split(/\s+/).length : 0)

export function downloadFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const safeFileName = (s) => (s || 'untitled').replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'untitled'

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?'

// Full class strings so Tailwind can detect them.
export const NOTE_COLORS = {
  default: { label: 'Default', card: 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800', dot: 'bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600' },
  red:     { label: 'Red',     card: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900/60', dot: 'bg-red-300 border-red-400' },
  orange:  { label: 'Orange',  card: 'bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900/60', dot: 'bg-orange-300 border-orange-400' },
  yellow:  { label: 'Yellow',  card: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-900/60', dot: 'bg-yellow-300 border-yellow-400' },
  green:   { label: 'Green',   card: 'bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-900/60', dot: 'bg-green-300 border-green-400' },
  teal:    { label: 'Teal',    card: 'bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:border-teal-900/60', dot: 'bg-teal-300 border-teal-400' },
  blue:    { label: 'Blue',    card: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/60', dot: 'bg-blue-300 border-blue-400' },
  purple:  { label: 'Purple',  card: 'bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900/60', dot: 'bg-purple-300 border-purple-400' },
  pink:    { label: 'Pink',    card: 'bg-pink-50 border-pink-200 dark:bg-pink-950/40 dark:border-pink-900/60', dot: 'bg-pink-300 border-pink-400' }
}
export const colorOf = (c) => NOTE_COLORS[c] || NOTE_COLORS.default
