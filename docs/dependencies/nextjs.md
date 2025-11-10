# Next.js 16 Documentation

## App Router Overview

Next.js 16 uses the App Router, which is built on React Server Components. This provides a new way to build Next.js applications with improved data fetching, layouts, and routing.

## Server Components

Server Components are the default in the App Router. They run on the server and can directly fetch data.

### Creating a Server Component

```tsx
// Import your Client Component
import HomePage from './home-page'

async function getPosts() {
  const res = await fetch('https://...')
  const posts = await res.json()
  return posts
}

export default async function Page() {
  // Fetch data directly in a Server Component
  const recentPosts = await getPosts()
  // Forward fetched data to your Client Component
  return <HomePage recentPosts={recentPosts} />
}
```

### Client Components

Mark components that need client-side interactivity with `'use client'`:

```tsx
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

## Data Fetching

### Server-Side Rendering (getServerSideProps equivalent)

Use `fetch()` with `cache: 'no-store'` to fetch data on every request:

```tsx
async function getProjects() {
  const res = await fetch(`https://...`, { cache: 'no-store' })
  const projects = await res.json()
  return projects
}

export default async function Dashboard() {
  const projects = await getProjects()
  return (
    <ul>
      {projects.map((project) => (
        <li key={project.id}>{project.name}</li>
      ))}
    </ul>
  )
}
```

### Static Generation (getStaticProps equivalent)

Use `fetch()` with `cache: 'force-cache'` (default) for static data:

```tsx
export default async function Page() {
  // This request should be cached until manually invalidated.
  // Similar to `getStaticProps`.
  // `force-cache` is the default and can be omitted.
  const staticData = await fetch(`https://...`, { cache: 'force-cache' })

  // This request should be cached with a lifetime of 10 seconds.
  // Similar to `getStaticProps` with the `revalidate` option.
  const revalidatedData = await fetch(`https://...`, {
    next: { revalidate: 10 },
  })

  return <div>...</div>
}
```

## Dynamic Route Parameters

In Server Components, `params` is a Promise that must be awaited:

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <h1>Blog Post: {slug}</h1>
}
```

## API Routes (Route Handlers)

Create API routes using `route.ts` files with named exports:

```typescript
// app/api/set-token/route.ts
import { NextResponse } from 'next/server'

export function POST() {
  const res = NextResponse.json({ message: 'successful' })
  res.cookies.set('token', 'this is a token')
  return res
}
```

```typescript
// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const secret = requestHeaders.get("x-vercel-reval-key");

  if (secret !== process.env.CONTENTFUL_REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  revalidateTag("posts");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
```

### GET Route Handler

```ts
export async function GET(request: Request) {
  // Handle GET request
}
```

## Accessing Cookies and Headers

Use `cookies()` and `headers()` from `next/headers` in Server Components:

```tsx
import { cookies, headers } from 'next/headers'

async function getData() {
  const authHeader = (await headers()).get('authorization')
  return '...'
}

export default async function Page() {
  // You can use `cookies` or `headers` inside Server Components
  // directly or in your data fetching function
  const theme = (await cookies()).get('theme')
  const data = await getData()
  return '...'
}
```

## Route Segment Config

Control rendering behavior with `dynamic` export:

```tsx
export const dynamic = 'auto'
// 'auto' | 'force-dynamic' | 'error' | 'force-static'
```

## Layouts

Layouts wrap pages and can be nested:

```jsx
import DashboardLayout from './DashboardLayout'

// This is a Server Component
export default function Layout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
```

## Link Component

Use Next.js Link for client-side navigation:

```tsx
'use client'

import Link from 'next/link'

export default function Page() {
  return (
    <Link href="/dashboard">
      Dashboard
    </Link>
  )
}
```

## TypeScript Support

Server Components can return complex types without serialization:

```tsx
async function getData() {
  const res = await fetch('https://api.example.com/...')
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.
  return res.json()
}

export default async function Page() {
  const name = await getData()
  return '...'
}
```

## Fetching Data with Cookies

Include authentication tokens from cookies in fetch requests:

```tsx
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = cookies()
  const token = cookieStore.get('AUTH_TOKEN')?.value

  const res = await fetch('https://api.example.com/profile', {
    headers: {
      Cookie: `AUTH_TOKEN=${token}`,
      // Other headers
    },
  })

  // ....
}
```

## Caching GET Routes

Opt into caching for GET routes:

```typescript
export const dynamic = 'force-static'

export async function GET() {
  const res = await fetch('https://data.mongodb-api.com/...', {
    headers: {
      'Content-Type': 'application/json',
      'API-Key': process.env.DATA_API_KEY,
    },
  })
  const data = await res.json()

  return Response.json({ data })
}
```

