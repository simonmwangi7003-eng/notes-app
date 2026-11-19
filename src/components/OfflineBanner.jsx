import { WifiOff } from 'lucide-react'
import { useOnline } from '../hooks/useOnline'

export default function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div className="fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 pt-safe text-xs font-medium text-amber-950">
      <WifiOff className="h-3.5 w-3.5" /> You’re offline – showing saved notes. Changes need a connection.
    </div>
  )
}
