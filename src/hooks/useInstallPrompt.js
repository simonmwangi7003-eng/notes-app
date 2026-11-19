import { useCallback, useEffect, useState } from 'react'

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(() => window.__deferredPrompt || null)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const onPrompt = () => setDeferred(window.__deferredPrompt || null)
    const onInstalled = () => {
      window.__deferredPrompt = null
      setDeferred(null)
      setInstalled(true)
    }
    window.addEventListener('pwa-installable', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('pwa-installable', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return false
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    window.__deferredPrompt = null
    setDeferred(null)
    return outcome === 'accepted'
  }, [deferred])

  return { installed, canInstall: !!deferred && !installed, showIOSHelp: isIOS() && !installed, install }
}
