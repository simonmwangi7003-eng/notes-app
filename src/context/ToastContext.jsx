import { createContext, useCallback, useContext, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

const Ctx = createContext(null)
export const useToast = () => useContext(Ctx)

const ICONS = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-sky-500" />
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const dismiss = useCallback((id) => setItems((i) => i.filter((t) => t.id !== id)), [])
  const toast = useCallback(
    (message, type = 'success', ms = 3500) => {
      const id = Math.random().toString(36).slice(2)
      setItems((i) => [...i.slice(-3), { id, message, type }])
      setTimeout(() => dismiss(id), ms)
    },
    [dismiss]
  )

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 pb-safe sm:bottom-auto sm:left-auto sm:right-4 sm:top-4 sm:items-end"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm animate-sheet-up items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            {ICONS[t.type]}
            <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{t.message}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
