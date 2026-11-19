import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await resetPassword(email.trim())
    setBusy(false)
    error ? setError(error.message) : setSent(true)
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we’ll send you a reset link." footer={<Link className="font-medium text-brand-700 hover:underline dark:text-brand-300" to="/login">Back to sign in</Link>}>
      {sent ? (
        <p className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900 dark:bg-brand-500/10 dark:text-brand-200">If an account exists for {email}, a reset link is on its way.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label" htmlFor="email">Email</label><input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
          <button className="btn-primary w-full py-2.5" disabled={busy}>{busy && <Spinner className="h-4 w-4" />} Send reset link</button>
        </form>
      )}
    </AuthLayout>
  )
}
