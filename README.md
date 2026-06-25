# Invoice Management Dashboard

A comprehensive invoice management system built with Next.js 16, Supabase, and TypeScript. Features include invoice CRUD operations, PDF generation, client management, invoice templates, and payment tracking.

## Features

- 🔐 **Authentication**: Email OTP (One-Time Password) authentication via Supabase
- 📄 **Invoice Management**: Create, edit, view, and delete invoices
- 👥 **Client Management**: Manage clients with auto-generated references
- 📋 **Invoice Templates**: Save and reuse invoice templates
- 💰 **Payment Tracking**: Track invoice status (draft, sent, paid, overdue)
- 📑 **PDF Generation**: Generate professional PDF invoices matching French format
- 🎨 **Modern UI**: Responsive design with dark mode support
- 💳 **Subscriptions**: Free tier with quotas; Pro via Stripe Checkout
- 🔒 **Row Level Security**: Multi-tenant data isolation

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **PDF Generation**: @react-pdf/renderer
- **Form Management**: react-hook-form, zod
- **Date Formatting**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Docker (for local Supabase development)
- Supabase CLI

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd next-invoice-gen
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Initialize Supabase**

   ```bash
   npx supabase init
   ```

4. **Start local Supabase**

   ```bash
   npx supabase start
   ```

   This project uses custom local ports (see `supabase/config.toml`) because the default Supabase ports are often already in use. Copy the credentials into `.env.local`:

   ```bash
   supabase status -o env
   ```

5. **Create `.env.local` file**

   Copy the example and fill in values from `supabase status -o env`:

   ```bash
   cp .env.local.example .env.local
   ```

   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55421
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
   SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   Auth emails are captured locally at [http://127.0.0.1:55424](http://127.0.0.1:55424) (Mailpit). Make sure your app URL matches this project's API port — emails go to the Mailpit instance paired with whichever Supabase stack you connect to.

   Stripe variables are optional for local development without billing. See [Stripe setup](#stripe-subscriptions) below.

6. **Apply database migrations**

   ```bash
   npx supabase migration up
   ```

7. **Start the development server**

   ```bash
   pnpm dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
  (auth)/              # Authentication routes
    login/             # Login page
    callback/          # Auth callback handler
  (dashboard)/         # Protected dashboard routes
    invoices/          # Invoice management
    clients/           # Client management
    templates/         # Template management
    settings/          # User settings
  api/                 # API routes
    invoices/[id]/
      pdf/             # PDF generation endpoint
components/
  ui/                  # Reusable UI components
  invoices/            # Invoice-specific components
  clients/             # Client-specific components
  layout/              # Layout components
lib/
  supabase/            # Supabase client utilities
  utils/               # Utility functions
  types/               # TypeScript type definitions
supabase/
  migrations/          # Database migrations
  config.toml          # Supabase configuration
```

## Database Schema

The application uses the following main tables:

- **profiles**: User profile information and company details
- **clients**: Client/customer information
- **invoices**: Main invoice records
- **invoice_items**: Line items for invoices
- **invoice_templates**: Reusable invoice templates
- **subscriptions**: Stripe subscription state (one row per user)

All tables have Row Level Security (RLS) enabled to ensure data isolation between users.

## Stripe subscriptions

Free tier limits: **1 client**, **3 invoices per calendar month**. Pro removes both limits.

### Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Public app URL for Stripe redirect URLs |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` or `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`) |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Price ID for the monthly Pro plan |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Price ID for the yearly Pro plan |

See `.env.local.example` for a full template.

### Stripe Dashboard setup

1. Create a **Product** with two recurring **Prices** (monthly and yearly).
2. Copy the price IDs into `STRIPE_PRO_MONTHLY_PRICE_ID` and `STRIPE_PRO_YEARLY_PRICE_ID`.
3. Enable the **Customer Portal** (Settings → Billing → Customer portal).
4. Add a webhook endpoint pointing to `https://<your-domain>/api/stripe/webhook` with these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid` (optional, no-op handler)
   - `invoice.payment_failed` (optional, no-op handler)

### Local webhook testing

With the dev server running on port 3000:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret printed by the CLI into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### Billing UI

Users manage subscriptions at `/settings/billing`: upgrade via Stripe Checkout, manage/cancel via the Stripe Customer Portal. Quota enforcement runs at both the application layer and via database triggers.

## Key Features

### Invoice Management

- Create invoices with multiple line items
- Auto-generate invoice references (F-000067 format)
- Support for VAT settings and exemptions
- French invoice format compliance
- PDF generation and download

### Client Management

- Create and manage clients
- Auto-generate client references (C-000001 format)
- View all invoices for a client

### Payment Tracking

- Track invoice status (draft, sent, paid, overdue)
- Automatic overdue detection
- Mark invoices as paid/unpaid
- Filter invoices by status

### Invoice Templates

- Save invoice configurations as templates
- Apply templates when creating new invoices
- Set default templates

## Development

### Running Migrations

```bash
# Create a new migration
npx supabase migration new migration_name

# Apply migrations locally
npx supabase migration up

# Push migrations to remote
npx supabase db push
```

### Database Reset

```bash
# Reset local database and reapply all migrations
npx supabase db reset
```

## Environment Variables

See `.env.local.example` for all required and optional variables (Supabase, app URL, Stripe).

## Documentation

Latest dependency documentation is available in `docs/dependencies/`:

- `nextjs.md` - Next.js App Router patterns
- `supabase.md` - Supabase authentication and database
- `supabase-js.md` - Supabase JavaScript client
- `supabase-cli.md` - Supabase CLI commands
- `react-pdf.md` - PDF generation with @react-pdf/renderer
- `tailwindcss.md` - Tailwind CSS v4 usage

## License

MIT
