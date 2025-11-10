# Supabase CLI Documentation

## Installation

Install Supabase CLI globally:

```bash
npm install -g supabase
```

Or use with npx:

```bash
npx supabase <command>
```

## Project Initialization

### Initialize Local Project

```bash
supabase init
```

Creates:
- `supabase/config.toml` - Configuration file
- `supabase/migrations/` - Migration files directory
- `supabase/seed.sql` - Seed data file (optional)

### Initialize with IDE Settings

```bash
supabase init --with-vscode-settings
supabase init --with-intellij-settings
```

### Force Initialization

```bash
supabase init --force
```

## Local Development

### Start Local Supabase

```bash
supabase start
```

Starts all services:
- PostgreSQL database
- PostgREST API
- Auth service
- Storage service
- Studio (web UI)

Output includes connection details and API keys.

### Exclude Services

```bash
supabase start --exclude storage,imgproxy
```

### Ignore Health Checks

```bash
supabase start --ignore-health-check
```

### Stop Services

```bash
supabase stop
```

## Database Migrations

### Create New Migration

```bash
supabase migration new create_users_table
```

Creates: `supabase/migrations/YYYYMMDDHHMMSS_create_users_table.sql`

Edit the file:

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### Apply Migrations Locally

```bash
supabase migration up
```

Apply all pending migrations:

```bash
supabase migration up --include-all
```

### Revert Migrations

```bash
supabase migration down --last 1
supabase migration down --last 3
```

### List Migrations

```bash
# Local migrations
supabase migration list --local

# Remote migrations
supabase migration list --linked
```

### Reset Database

Reset local database and reapply all migrations:

```bash
supabase db reset
```

Reset to specific migration:

```bash
supabase db reset --version 20240115120000
```

Skip seed data:

```bash
supabase db reset --no-seed
```

## Linking to Remote Project

### Login

```bash
supabase login
```

### Link Project

```bash
supabase link --project-ref zeoxvqpvpyrxygmmatng
```

With password:

```bash
supabase link --project-ref zeoxvqpvpyrxygmmatng --password "your-db-password"
```

Skip connection pooler:

```bash
supabase link --project-ref zeoxvqpvpyrxygmmatng --skip-pooler
```

## Pushing Migrations

### Push to Remote (Dry Run)

```bash
supabase db push --dry-run
```

### Push Migrations

```bash
supabase db push
```

Include roles:

```bash
supabase db push --include-roles
```

Include seed data:

```bash
supabase db push --include-seed
```

## Schema Diff

### Generate Diff from Local

```bash
supabase db diff --local -f new_changes
```

### Generate Diff from Remote

```bash
supabase db diff --linked -f sync_remote
```

### Diff Specific Schemas

```bash
supabase db diff --local --schema public,auth -f schema_changes
```

### Use Different Diff Tools

```bash
# Use Migra
supabase db diff --use-migra --local -f changes

# Use pgAdmin
supabase db diff --use-pgadmin --linked -f remote_diff
```

## Pulling Schema

### Pull Auth Schema

```bash
supabase db pull --schema auth
```

## Configuration File (config.toml)

Example configuration:

```toml
# Project identifier
project_id = "my-project-123"

# API Configuration
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

# Database Configuration
[db]
port = 54322
major_version = 17

# Connection pooler
[db.pooler]
enabled = false
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

# Migration settings
[db.migrations]
enabled = true
schema_paths = []

# Seed data
[db.seed]
enabled = true
sql_paths = ["./seed.sql"]

# Realtime Configuration
[realtime]
enabled = true
ip_version = "IPv4"

# Studio Configuration
[studio]
enabled = true
port = 54323
api_url = "http://localhost"
openai_api_key = "env(OPENAI_API_KEY)"

# Storage Configuration
[storage]
enabled = true
file_size_limit = "50MiB"
image_transformation_enabled = true

# Storage buckets
[storage.buckets.avatars]
public = true
file_size_limit = "5MiB"
allowed_mime_types = ["image/png", "image/jpeg", "image/gif", "image/webp"]

[storage.buckets.documents]
public = false
file_size_limit = "100MiB"
allowed_mime_types = ["application/pdf", "text/plain", "application/msword"]

# Auth Configuration
[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = true
enable_anonymous_sign_ins = false

# External OAuth providers
[auth.external.github]
enabled = true
client_id = "env(GITHUB_CLIENT_ID)"
secret = "env(GITHUB_SECRET)"
redirect_uri = "http://localhost:54321/auth/v1/callback"

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_SECRET)"

# Email auth
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
secure_password_change = false
```

## Common Workflows

### Initial Setup

```bash
# 1. Initialize project
supabase init

# 2. Start local services
supabase start

# 3. Create first migration
supabase migration new initial_schema

# 4. Edit migration file
# ... edit supabase/migrations/YYYYMMDDHHMMSS_initial_schema.sql

# 5. Apply migration
supabase migration up
```

### Development Workflow

```bash
# 1. Make schema changes locally
# ... edit database via Studio or SQL

# 2. Generate migration from changes
supabase db diff --local -f my_changes

# 3. Review generated migration
# ... edit supabase/migrations/YYYYMMDDHHMMSS_my_changes.sql

# 4. Apply migration
supabase migration up

# 5. Test locally
# ... run your application

# 6. Push to remote when ready
supabase db push
```

### Reset and Start Fresh

```bash
# Reset local database
supabase db reset

# This will:
# - Drop all tables
# - Reapply all migrations from scratch
# - Run seed.sql if enabled
```

## Key Commands Summary

- `supabase init` - Initialize project
- `supabase start` - Start local services
- `supabase stop` - Stop local services
- `supabase migration new <name>` - Create new migration
- `supabase migration up` - Apply pending migrations
- `supabase migration down --last N` - Revert migrations
- `supabase migration list` - List migrations
- `supabase db reset` - Reset local database
- `supabase db push` - Push migrations to remote
- `supabase db pull` - Pull schema from remote
- `supabase db diff` - Generate schema diff
- `supabase link` - Link to remote project
- `supabase login` - Authenticate with Supabase

