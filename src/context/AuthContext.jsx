import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [initialized, setInitialized] = useState(false)
  const touched = useRef(false)

  const fetchProfile = useCallback(async (uid) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (error) {
      setProfileError(error.message)
      return null
    }
    setProfileError(null)
    setProfile(data)
    if (!touched.current) {
      touched.current = true
      supabase.rpc('touch_last_seen').then(() => {})
    }
    return data
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setInitialized(true)
    })
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) {
        setProfile(null)
        touched.current = false
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const uid = session?.user?.id
  useEffect(() => {
    if (uid) fetchProfile(uid)
  }, [uid, fetchProfile])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    profileError,
    loading: !initialized || (!!session && !profile && !profileError),
    isAdmin: profile?.role === 'admin',
    refreshProfile: () => (uid ? fetchProfile(uid) : null),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password, fullName) =>
      supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/app` }
      }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) =>
      supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
    updateProfile: async (patch) => {
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', uid).select().single()
      if (!error) setProfile(data)
      return { data, error }
    }
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
