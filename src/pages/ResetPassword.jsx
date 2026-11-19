import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import Spinner, { FullSpinner } from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ResetPassword() {
  const { session, loading, updatePassword } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // A recovery link carries tokens in the URL; give Supabase a moment to turn them into a session.
  const hasToken = /access_token|type=recovery|[?&]code=/.test(window.location.hash + window.location.search)
  const [waiting, setWaiting] = useState(hasToken)
  useEffect(() => {
    if (!waiting) return
    const t = setTimeout(() => setWaiting(false), 4000)
    return () => clearTimeout(t)
  }, [waiting])

  if (loading || (waiting && !session)) return <FullSpinner />
  if (!session)
    return (
      <AuthLayout title="Link expired" subtitle="This reset link is invalid or has already been used." footer={<Link className="font-medium text-brand-700 hover:underline dark:text-brand-300" to="/login">Back to sign in</Link>}>
        <Link to="/forgot-password" className="btn-primary w-full">Request a new link</Link>
      </AuthLayout>
    )

  const submit = async (e) => {
    e.preventDefault()
    if (password.length < 8) return setError('Use at least 8 characters.')
    setBusy(true)
    const { error } = await updatePassword(password)
    setBusy(false)
    if (error) return setError(error.message)
    toast('Password updated')
    navigate('/app', { replace: true })
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="You’ll stay signed in after saving.">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="pw">New password</label><input id="pw" className="input" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <button className="btn-primary w-full py-2.5" disabled={busy}>{busy && <Spinner className="h-4 w-4" />} Save password</button>
      </form>
    </AuthLayout>
  )
}
