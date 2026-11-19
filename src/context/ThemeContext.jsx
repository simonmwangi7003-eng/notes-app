import { createContext, useContext, useEffect, useState } from 'react'

const Ctx = createContext(null)
export const useTheme = () => useContext(Ctx)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('jotbook-theme') || 'system')

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#020617' : '#f8fafc')
    }
    apply()
    localStorage.setItem('jotbook-theme', theme)
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}
