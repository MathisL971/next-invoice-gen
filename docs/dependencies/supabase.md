# Supabase Documentation

## Overview

Supabase is an open-source backend platform providing a full Postgres database, authentication, storage, real-time, and edge functions.

## Authentication with Next.js

### SSR Authentication Middleware

Use `@supabase/ssr` package (NOT deprecated `@supabase/auth-helpers-nextjs`):

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  // Do not run code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Server Components

Create a server client utility:

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

### Client Components

Create a browser client utility:

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Email Magic Link Authentication

### Sign In with Magic Link

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://example.com/auth/callback'
  }
})
```

### Verify OTP in Callback

```typescript
// app/auth/callback/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: { token_hash?: string; type?: string }
}) {
  const supabase = createClient()

  if (searchParams.token_hash && searchParams.type) {
    const { error } = await supabase.auth.verifyOtp({
      type: searchParams.type as any,
      token_hash: searchParams.token_hash,
    })

    if (!error) {
      redirect('/dashboard')
    }
  }

  redirect('/login?error=auth_failed')
}
```

## Row Level Security (RLS)

### Enable RLS on a Table

```sql
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policy

```sql
-- Users can only view their own todos
CREATE POLICY "Individuals can view their own todos."
  ON public.todos
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);
```

### RLS with MFA

```sql
-- Enable RLS
ALTER TABLE public.private_posts ENABLE ROW LEVEL SECURITY;

-- Create a policy that only allows read if the user has signed in via MFA
CREATE POLICY "Users can view private_posts if they have signed in via MFA"
  ON public.private_posts
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'aal') = 'aal2');
```

## Database Queries with RLS

When RLS is enabled, queries automatically respect policies:

```javascript
// With RLS policy: (select auth.uid()) = user_id
let user = await supabase.from('users').select('user_id, name')
// Returns only rows where user_id matches the authenticated user
```

## Server Actions (Next.js)

Use server actions for form handling:

```typescript
// app/login/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
```

## Migration from Auth Helpers

### Replace createServerComponentClient

```typescript
// OLD (deprecated)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const cookieStore = cookies()
const supabase = createServerComponentClient<Database>({
  cookies: () => cookieStore
})

// NEW (use @supabase/ssr)
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()
```

### Replace createClientComponentClient

```typescript
// OLD (deprecated)
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient<Database>()

// NEW (use @supabase/ssr)
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
```

## Protected Pages

Check authentication in Server Components:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Run queries with RLS
  const { data } = await supabase.from('users').select('*')

  return <div>Protected content for {user.email}</div>
}
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Key Points

1. **Always use `@supabase/ssr`** - The auth-helpers packages are deprecated
2. **Cookie handling is critical** - Use `getAll()` and `setAll()` pattern in middleware
3. **Call `getUser()` immediately** - Don't run code between client creation and `getUser()`
4. **Return supabaseResponse as-is** - In middleware, return the response object directly
5. **RLS policies** - Always enable RLS and create appropriate policies for data security

