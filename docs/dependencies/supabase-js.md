# Supabase JS Client Documentation

## Client Initialization

### Basic Client Creation

```javascript
import { createClient } from '@supabase/supabase-js'

// Initialize client with project URL and anonymous key
const supabase = createClient(
  'https://xyzcompany.supabase.co',
  'your-anon-key'
)
```

### Advanced Configuration

```javascript
const supabase = createClient(
  'https://xyzcompany.supabase.co',
  'your-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage, // Custom storage implementation
      flowType: 'pkce' // Use PKCE flow for enhanced security
    },
    db: {
      schema: 'public' // Database schema to use
    },
    global: {
      headers: { 'x-application-name': 'my-app' },
      fetch: customFetch // Custom fetch implementation for Cloudflare Workers
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)
```

## Service Clients

Access individual service clients:

```javascript
const auth = supabase.auth
const database = supabase // Database queries directly on client
const storage = supabase.storage
const functions = supabase.functions
const realtime = supabase.realtime
```

## Authentication

### Sign Up

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password-123',
  options: {
    data: { // Custom user metadata
      full_name: 'John Doe',
      age: 25
    },
    emailRedirectTo: 'https://example.com/welcome'
  }
})
```

### Sign In with Password

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password-123'
})
```

### Sign In with OAuth

```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: 'https://example.com/auth/callback',
    scopes: 'repo user'
  }
})
```

### Sign In with Magic Link (OTP)

```javascript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://example.com/auth/callback'
  }
})
```

### Get Current Session

```javascript
const { data: { session }, error } = await supabase.auth.getSession()
if (session) {
  console.log('Access token:', session.access_token)
  console.log('User:', session.user.email)
  console.log('Expires at:', new Date(session.expires_at! * 1000))
}
```

### Get Current User

```javascript
const { data: { user }, error } = await supabase.auth.getUser()
```

### Listen to Auth State Changes

```javascript
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event) // 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', etc.
  if (session) {
    console.log('User ID:', session.user.id)
  }
})

// Unsubscribe later
subscription.unsubscribe()
```

### Update User

```javascript
const { data, error } = await supabase.auth.updateUser({
  data: { full_name: 'Jane Doe' }
})
```

### Sign Out

```javascript
const { error } = await supabase.auth.signOut()
```

## Database Queries

### Select

```javascript
const { data, error } = await supabase
  .from('todos')
  .select('*')
```

### Insert

```javascript
const { data, error } = await supabase
  .from('todos')
  .insert([
    { title: 'Buy milk', completed: false }
  ])
```

### Update

```javascript
const { data, error } = await supabase
  .from('todos')
  .update({ completed: true })
  .eq('id', 1)
```

### Delete

```javascript
const { error } = await supabase
  .from('todos')
  .delete()
  .eq('id', 1)
```

### Filtering

```javascript
// Equal
.eq('status', 'active')

// Not equal
.neq('status', 'inactive')

// Greater than
.gt('age', 18)

// Less than
.lt('age', 65)

// Greater than or equal
.gte('age', 18)

// Less than or equal
.lte('age', 65)

// Like (pattern matching)
.like('name', '%John%')

// In array
.in('status', ['active', 'pending'])

// Is null
.is('deleted_at', null)

// Is not null
.not('deleted_at', 'is', null)
```

### Ordering

```javascript
.order('created_at', { ascending: false })
```

### Limiting

```javascript
.limit(10)
```

### Pagination

```javascript
const { data, error } = await supabase
  .from('todos')
  .select('*')
  .range(0, 9) // First 10 items
```

## Storage

### Access Storage

```javascript
const storage = supabase.storage

// Regular bucket
const bucket = storage.from('my-bucket')

// Vector bucket
const vectorBucket = storage.vectors.from('embeddings-bucket')

// Analytics
const analytics = storage.analytics
```

### Upload File

```javascript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file)
```

### Download File

```javascript
const { data, error } = await supabase.storage
  .from('avatars')
  .download('public/avatar1.png')
```

### Get Public URL

```javascript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar1.png')
```

## Realtime

### Subscribe to Changes

```javascript
const channel = supabase
  .channel('todos')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'todos'
  }, (payload) => {
    console.log('New todo:', payload.new)
  })
  .subscribe()
```

### Unsubscribe

```javascript
await supabase.removeChannel(channel)
```

## Functions

### Invoke Edge Function

```javascript
const { data, error } = await supabase.functions.invoke('my-function', {
  body: { name: 'John' }
})
```

## Error Handling

Always check for errors:

```javascript
const { data, error } = await supabase.from('todos').select('*')

if (error) {
  console.error('Error:', error.message)
  return
}

// Use data
console.log('Todos:', data)
```

