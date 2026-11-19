import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) return setError('Use at least 8 characters for your password.')
    setBusy(true)
    const { data, error } = await signUp(form.email.trim(), form.password, form.name.trim())
    setBusy(false)
    if (error) return setError(error.message)
    if (data.session) navigate('/app', { replace: true })
    else setConfirmSent(true)
  }

  if (confirmSent)
    return (
      <AuthLayout title="Check your inbox" subtitle={`We sent a confirmation link to ${form.email}.`} footer={<Link className="font-medium text-brand-700 hover:underline dark:text-brand-300" to="/login">Back to sign in</Link>}>
        <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-4 text-sm text-brand-900 dark:bg-brand-500/10 dark:text-brand-200"><MailCheck className="mt-0.5 h-5 w-5 shrink-0" />Open the link in the email to activate your account, then sign in.</div>
      </AuthLayout>
    )

  return (
    <AuthLayout title="Create your account" subtitle="Free to use. No credit card." footer={<>Already have an account? <Link className="font-medium text-brand-700 hover:underline dark:text-brand-300" to="/login">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="name">Full name</label><input id="name" className="input" autoComplete="name" required value={form.name} onChange={set('name')} /></div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" className="input" type="email" autoComplete="email" required value={form.email} onChange={set('email')} /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" className="input" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} /><p className="mt-1 text-xs text-slate-500">At least 8 characters.</p></div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <button className="btn-primary w-full py-2.5" disabled={busy}>{busy && <Spinner className="h-4 w-4" />} Create account</button>
      </form>
    </AuthLayout>
  )
}
