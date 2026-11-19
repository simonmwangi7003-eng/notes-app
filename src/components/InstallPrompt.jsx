import { useEffect, useState } from 'react'
import { Download, Share, PlusSquare, X } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { LogoMark } from './Logo'

const KEY = 'jotbook-install-dismissed'
const SNOOZE_DAYS = 7

export default function InstallPrompt() {
  const { installed, canInstall, showIOSHelp, install } = useInstallPrompt()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (installed || !(canInstall || showIOSHelp)) return setVisible(false)
    const at = Number(localStorage.getItem(KEY) || 0)
    if (Date.now() - at < SNOOZE_DAYS * 864e5) return
    const t = setTimeout(() => setVisible(true), 4000)
    return () => clearTimeout(t)
  }, [installed, canInstall, showIOSHelp])

  const dismiss = () => {
    localStorage.setItem(KEY, String(Date.now()))
    setVisible(false)
  }
  const doInstall = async () => {
    const ok = await install()
    if (!ok) dismiss()
    else setVisible(false)
  }

  if (!visible) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] flex justify-center p-3 pb-safe sm:justify-end sm:p-5">
      <div role="dialog" aria-label="Install Jotbook" className="w-full max-w-sm animate-sheet-up rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <LogoMark className="h-12 w-12 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 dark:text-white">Install Jotbook</p>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
              Add it to your home screen for one-tap access, a full-screen view and offline reading.
            </p>
          </div>
          <button onClick={dismiss} className="icon-btn -mr-2 -mt-2" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        {canInstall ? (
          <div className="mt-4 flex gap-2">
            <button onClick={doInstall} className="btn-primary flex-1"><Download className="h-4 w-4" /> Install app</button>
            <button onClick={dismiss} className="btn-ghost">Not now</button>
          </div>
        ) : (
          <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <p className="flex items-center gap-2">1. Tap <Share className="h-4 w-4 text-sky-500" /> <b>Share</b> in Safari’s toolbar</p>
            <p className="flex items-center gap-2">2. Choose <PlusSquare className="h-4 w-4" /> <b>Add to Home Screen</b></p>
            <button onClick={dismiss} className="btn-secondary mt-2 w-full">Got it</button>
          </div>
        )}
      </div>
    </div>
  )
}
