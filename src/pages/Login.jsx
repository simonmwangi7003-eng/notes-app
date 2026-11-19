import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const from = useLocation().state?.from?.pathname || '/app'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await signIn(email.trim(), password)
    setBusy(false)
    if (error) setError(error.message)
    else navigate(from, { replace: true })
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to open your notes." footer={<>New here? <Link className="font-medium text-brand-700 hover:underline dark:text-brand-300" to="/signup">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="email">Email</label><input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div>
          <div className="flex items-center justify-between"><label className="label" htmlFor="password">Password</label><Link to="/forgot-password" className="mb-1.5 text-xs text-brand-700 hover:underline dark:text-brand-300">Forgot password?</Link></div>
          <div className="relative">
            <input id="password" className="input pr-10" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        <button className="btn-primary w-full py-2.5" disabled={busy}>{busy && <Spinner className="h-4 w-4" />} Sign in</button>
      </form>
    </AuthLayout>
  )
}
