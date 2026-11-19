# Jotbook – full-stack notes PWA

React (Vite) + Tailwind CSS + Supabase (Auth, PostgreSQL, Realtime). Installable PWA with an install pop-up, offline reading, dark mode and an admin console.

## Features

**Notes**
- Create, edit with autosave, pin, favorite, archive, colour-code (9 colours)
- Markdown editor with toolbar, live preview, GitHub-style checklists and list auto-continue
- Folders, tags, instant search (Ctrl/⌘ + K), sort by edited / created / title, grid and list views
- Trash with restore, permanent delete and automatic purge after 30 days
- Share any note through a read-only public link (can be switched off at any time)
- Export a note as Markdown; back up / import all notes as JSON; export everything as Markdown
- Realtime sync between devices; last copy cached locally for offline reading

**Accounts**
- Email + password sign-up, login, forgot / reset password, change password, profile, delete account
- Row Level Security: users can only ever read their own notes

**PWA**
- Install pop-up (Chrome / Edge / Android) with iOS “Add to Home Screen” instructions, 7-day snooze
- Manifest, maskable icons, service worker, auto-update, offline banner, “New note” app shortcut

**Admin console** (`/admin`)
- Statistics: total / new / active / suspended users, notes, folders, trash, sign-ups and notes charts (7/30/90 days), note breakdown, top tags, newest users
- Users: search, filter, make / remove admin, suspend / reinstate, delete user, export CSV
- Privacy by design: admins see aggregate numbers only, never note contents

---

## 1. Prerequisites
- Node.js 18+ (https://nodejs.org)
- A free Supabase account (https://supabase.com)

## 2. Create the Supabase project
1. Supabase Dashboard → **New project**. Pick a name, a database password and a region.
2. When it is ready, open **SQL Editor → New query**, paste the whole of `supabase/schema.sql` and press **Run**. It creates the tables, security policies, triggers, admin functions and realtime settings. It is safe to run twice.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key.

## 3. Configure and run locally
```bash
cd jotbook
npm install
cp .env.example .env        # Windows: copy .env.example .env
```
Edit `.env`:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```
Then:
```bash
npm run dev
```
Open http://localhost:5173.

## 4. Configure Supabase Auth
In **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:5173` (change to your real domain after deploying)
- **Redirect URLs**: add `http://localhost:5173/**` and `https://YOUR-DOMAIN/**`

Email confirmation: by default Supabase requires new users to confirm their email. For quick local testing you can switch it off in **Authentication → Providers → Email → Confirm email**. For production keep it on and configure a custom SMTP server (Authentication → SMTP Settings), because the built-in mailer is heavily rate limited.

## 5. Create your admin account
1. Sign up in the app with your own email.
2. In the SQL Editor run:
```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```
3. Refresh the app. An **Admin dashboard** link appears in the sidebar (or visit `/admin`).
Later admins can be promoted from **Admin → Users** without SQL.

## 6. Build and deploy
```bash
npm run build      # outputs /dist
npm run preview    # test the production build + service worker locally
```
The PWA (service worker and install prompt) only works on **HTTPS** or `localhost`.

**Vercel**: import the repo, framework preset *Vite*, add the two `VITE_` environment variables, deploy. `vercel.json` already handles SPA routing.
**Netlify**: build command `npm run build`, publish directory `dist`, add the env vars. `public/_redirects` handles SPA routing.
After deploying, add your production URL to Supabase **Site URL** and **Redirect URLs** (step 4).

## 7. Testing the PWA
1. Run `npm run build && npm run preview`, open the URL in Chrome.
2. After ~4 seconds the install pop-up appears (also: Chrome menu → *Install Jotbook*, or Settings → *Install app*).
3. Dismissing the pop-up hides it for 7 days. To see it again clear `jotbook-install-dismissed` in localStorage.
4. iOS Safari does not expose an install event, so the pop-up shows Share → Add to Home Screen steps.
5. Offline test: DevTools → Network → Offline, reload. The shell and your last-loaded notes still open.

## Project structure
```
supabase/schema.sql        database, RLS policies, triggers, admin RPC functions
public/                    PWA icons, favicon, SPA redirects
src/
  lib/                     supabase client, helpers, note colours
  context/                 Auth, Notes (data + realtime + cache), Theme, Toast
  hooks/                   useInstallPrompt, useOnline
  components/              NoteCard, NoteEditor, ShareModal, Modal, Sidebars, InstallPrompt…
  pages/                   Landing, auth pages, Notes, Settings, SharedNote
  pages/admin/             AdminDashboard, AdminUsers
vite.config.js             Vite + PWA manifest + Workbox
```

## Security notes
- The anon key is safe to expose; data is protected by Row Level Security in `schema.sql`.
- Never put the `service_role` key in this project.
- Users cannot change their own role or suspension flag (database trigger).
- Admin functions verify `is_admin()` on the server, so hiding the UI is not the only protection.
- Suspended users are blocked at the database level and signed out of the app UI.

## Troubleshooting
| Problem | Fix |
|---|---|
| “Connect Supabase to continue” screen | `.env` missing or dev server not restarted after editing it |
| “Couldn't load your profile” | `schema.sql` was not run, or ran with errors |
| Admin page redirects to `/app` | Your profile role isn't `admin` yet (step 5) |
| No confirmation email | Supabase email rate limit; disable confirmation for testing or add custom SMTP |
| Reset / confirm links go to the wrong site | Fix Site URL and Redirect URLs (step 4) |
| No install pop-up | Needs HTTPS/localhost, not already installed, and not dismissed in the last 7 days |
| Realtime sync not working | Re-run section 7 of `schema.sql` (adds tables to the `supabase_realtime` publication) |
| Old version after deploy | The service worker auto-updates; close all tabs and reopen, or hard refresh once |

## Ideas for next steps
Image attachments (Supabase Storage), note reminders, Google sign-in (enable the provider in Supabase and call `supabase.auth.signInWithOAuth`), full-text search with a `tsvector` column, offline write queue.
