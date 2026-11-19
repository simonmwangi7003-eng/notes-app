import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

let openCount = 0

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    openCount++
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (--openCount <= 0) document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-xl' }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative flex max-h-[90vh] w-full animate-sheet-up flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl', widths[size])}>
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button className="icon-btn -mr-2" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-3">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 pb-5 pt-3 pb-safe">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmLabel}</button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
    </Modal>
  )
}
