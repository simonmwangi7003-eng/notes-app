import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { isConfigured } from './lib/supabase'
import { useAuth } from './context/AuthContext'
import { NotesProvider } from './context/NotesContext'
import Shell from './components/Shell'
import AppSidebar from './components/AppSidebar'
import AdminSidebar from './components/AdminSidebar'
import InstallPrompt from './components/InstallPrompt'
import OfflineBanner from './components/OfflineBanner'
import { FullSpinner } from './components/Spinner'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Notes from './pages/Notes'
import Settings from './pages/Settings'
import SharedNote from './pages/SharedNote'
import NotFound from './pages/NotFound'
import SetupNeeded from './pages/SetupNeeded'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'

function RequireAuth({ admin }) {
  const { user, profile, profileError, loading, signOut } = useAuth()
  const location = useLocation()
  if (loading) return <FullSpinner />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (profileError)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="font-serif text-2xl font-semibold">Couldn’t load your profile</h1>
        <p className="max-w-md text-sm text-slate-500">{profileError}. Check that supabase/schema.sql has been run in your project.</p>
        <button className="btn-secondary" onClick={signOut}>Sign out</button>
      </div>
    )
  if (profile?.is_suspended)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="font-serif text-2xl font-semibold">Account suspended</h1>
        <p className="max-w-md text-sm text-slate-500">An administrator has suspended this account. Contact support if you think this is a mistake.</p>
        <button className="btn-secondary" onClick={signOut}>Sign out</button>
      </div>
    )
  if (admin && profile?.role !== 'admin') return <Navigate to="/app" replace />
  return <Outlet />
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullSpinner />
  return user ? <Navigate to="/app" replace /> : children
}

const AppLayout = () => (
  <NotesProvider>
    <Shell sidebar={() => <AppSidebar />}><Outlet /></Shell>
  </NotesProvider>
)
const AdminLayout = () => <Shell sidebar={() => <AdminSidebar />}><Outlet /></Shell>

export default function App() {
  if (!isConfigured) return <SetupNeeded />
  return (
    <>
      <OfflineBanner />
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/shared/:token" element={<SharedNote />} />

        <Route element={<RequireAuth />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Notes view="all" />} />
            <Route path="favorites" element={<Notes view="favorites" />} />
            <Route path="archive" element={<Notes view="archive" />} />
            <Route path="trash" element={<Notes view="trash" />} />
            <Route path="folder/:folderId" element={<Notes view="folder" />} />
            <Route path="tag/:tag" element={<Notes view="tag" />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        <Route element={<RequireAuth admin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
