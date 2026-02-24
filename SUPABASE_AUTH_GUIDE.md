# Supabase Email/Password Auth (Client-Only) – Reuse Guide
One-sentence summary: How to implement login/register like Life OS for any React/Vite app using the same Supabase project, only with anon key (no service role on client).

## 1) Prereqs & Env
- Use ONLY anon/public key on client. Never expose service role.
- Env (Vite):
  - `VITE_SUPABASE_URL=https://<project>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=<anon-key>`
- If multiple apps share the same Supabase project, they all use these two values.

## 2) Supabase client singleton (`lib/supabaseClient.ts`)
```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
```

## 3) Auth context (React)
```ts
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

type AuthCtx = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

## 4) Login/Register UI (email/password)
- Form email + password, buttons “Đăng nhập”, “Tạo tài khoản”.
- Toggle login/signup; show loading state; display Supabase error message.
- If email confirmation enabled, show note: “Kiểm tra email để xác nhận”.
- Optional guest mode: keep local-only, not tied to Supabase.

## 5) Routing guard
- Wrap app with `<AuthProvider>`.
- If `loading`: show spinner; if `!user`: redirect to `/login`; else render app.

## 6) Email confirmation
- Supabase Dashboard → Auth → Settings → enable “Confirm email”.
- When enabled, signUp sends confirmation email; signIn will fail until confirmed (handle message gracefully).

## 7) RLS basics (example)
```sql
alter table profiles enable row level security;

create policy "select own profile" on profiles
for select using (auth.uid() = id);

create policy "upsert own profile" on profiles
for insert with check (auth.uid() = id);

create policy "update own profile" on profiles
for update using (auth.uid() = id);
```
- Apply similar policies to tables using `user_id`/`owner_id`.

## 8) What NOT to do
- Do NOT ship service role key to client.
- Do NOT bypass RLS; every table exposed to client must have policies using `auth.uid()`.
- Do NOT mix env keys between apps; ensure correct URL/key per project.

## 9) Common errors
- "Email not confirmed": user must click email (or disable confirm in dev).
- "Invalid login credentials": wrong email/pass or wrong project URL/key.
- Network/JWT errors: check CORS/redirect URLs in Supabase Dashboard, ensure VITE env loaded.

## 10) Reuse for another app (same Supabase project)
- Copy `supabaseClient.ts`, `AuthContext`, login/signup UI.
- Reuse the same `SUPABASE_URL` + `SUPABASE_ANON_KEY`.
- Ensure RLS for new tables; add metadata fields in signUp if needed (via `options.data`).
- Keep service role on server only (if backend jobs are needed).

## 11) Minimal folder layout (suggested)
```
src/
  lib/supabaseClient.ts
  contexts/AuthContext.tsx
  pages/Login.tsx
  App.tsx (routes + guard)
```
