# Deivakaram Charitable Trust Platform

Production-ready enterprise platform for **Deivakaram Charitable Trust**, featuring real **Supabase PostgreSQL & Auth** backend integration and official **Razorpay Payment Gateway** lifecycle handling.

---

## 1. System Architecture

- **Frontend**: React 19 + TypeScript + Vite with custom design system and Vanilla CSS.
- **Backend**:
  - Express API server (`server/index.js`) mounted as dev middleware in Vite and deployable as a standalone Node.js production service.
  - Vercel Serverless Functions (`api/*.js`) for serverless deployments.
- **Database & Auth**: Supabase PostgreSQL with strict Row Level Security (RLS) policies, triggers for user synchronization, and Realtime channels.
- **Payment Processing**: Official server-side `razorpay` SDK with server-side price validation, timing-safe HMAC signature verification, order tracking, and idempotent webhook handlers.

---

## 2. Installation & Quick Start

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env and supply your Supabase and Razorpay credentials

# 3. Start development server (Frontend + Backend Middleware on Port 5173)
npm run dev

# 4. Or run standalone backend server (Port 5001)
npm run server
```

---

## 3. Database & Supabase Setup

### Step A: Create or Connect Supabase Project
1. Log in to [Supabase](https://supabase.com) and create a new project.
2. In the project dashboard, go to **Project Settings** -> **API**.
3. Copy the **Project URL**, the **anon public key**, and the **service_role key**.

### Step B: Run Database Migrations
1. Open the **SQL Editor** in your Supabase dashboard.
2. Run the main schema migration:
   - File: `supabase/schema.sql` (Creates all 22 core tables, default seeds, and triggers).
3. Run the payment and RLS enhancement migration:
   - File: `supabase/migrations/20261011_production_backend_and_payments.sql` (Adds `payment_orders`, `webhook_events`, indexes, and hardened RLS policies).

### Step C: Configure Supabase Auth
1. Go to **Authentication** -> **Providers** -> **Email**.
2. Ensure Email provider is enabled.
3. Configure your site URL and redirect URLs under **URL Configuration**:
   - `http://localhost:5173` (for local development)
   - `https://your-production-domain.com` (for production)

---

## 4. Environment Variables Configuration

Copy `.env.example` to `.env`. Ensure `.env` is never committed to Git (`.gitignore` protects this).

| Variable Name | Description | Environment |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL | Frontend & Backend |
| `VITE_SUPABASE_ANON_KEY` | Supabase Publishable / Anon Key | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret Key | Backend Only |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Key ID (`rzp_test_...` or `rzp_live_...`) | Frontend |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | Backend |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key | Backend Only |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured in Razorpay Webhooks dashboard | Backend Only |
| `VITE_TRUST_UPI_ID` | Direct Trust UPI ID (e.g. `ashwinop58@okicici`) | Frontend |
| `PORT` | Express Server Port (Default: 5001) | Backend |

---

## 5. Razorpay Payment Lifecycle & Live Mode Setup

### Razorpay Lifecycle Implementation
1. **Order Creation (`POST /api/create-razorpay-order`)**:
   - The frontend requests order creation with program or package details.
   - The backend validates prices from database records (packages + addons), computing the authoritative amount on the server.
   - Creates an order on Razorpay using the official SDK (`razorpay.orders.create`).
   - Persists the order in `payment_orders` with status `'pending'`.
2. **Checkout Launch (`src/utils/razorpay.ts`)**:
   - Launches Razorpay Checkout modal with the real `order_id` returned by the backend.
   - Handles dismissal (`ondismiss`), errors (`payment.failed`), and completions.
   - Never simulates or fakes payment completion.
3. **Signature Verification (`POST /api/verify-payment`)**:
   - Compares the received signature against `crypto.createHmac('sha256', secret).update(order_id + '|' + payment_id)` using `crypto.timingSafeEqual`.
   - Queries `razorpay.payments.fetch(payment_id)` to verify authoritative status is `captured` or `authorized`.
   - Atomically updates `payment_orders` to `'paid'`, records `donations` and `celebration_bookings`, and updates campaign totals.
4. **Webhook Processing (`POST /api/razorpay-webhook`)**:
   - Verifies raw request body with `Razorpay.validateWebhookSignature`.
   - Enforces idempotency via the `webhook_events` table to ignore duplicate deliveries.
   - Synchronizes order and donation statuses.

### Transitioning to Live Mode
1. Complete KYC verification on your [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Switch to **Live Mode** in the dashboard header.
3. Navigate to **Account & Settings** -> **API Keys** -> **Generate Live Key**.
4. Set the live keys in your production environment:
   ```bash
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
   VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_live_key_secret
   ```
5. Navigate to **Account & Settings** -> **Webhooks** -> **Add New Webhook**:
   - **Webhook URL**: `https://your-domain.com/api/razorpay-webhook`
   - **Secret**: Enter a strong secret and set `RAZORPAY_WEBHOOK_SECRET` in `.env`.
   - **Events to Select**:
     - `payment.captured`
     - `payment.failed`
     - `order.paid`
     - `refund.processed`

---

## 6. Verification & Automated Test Suite

Run the included verification scripts:

```bash
# Test Razorpay order creation, timing-safe verification & webhook validation
node scripts/test_backend_and_payments.js

# Test Express API routes (health, validation, order generation)
node scripts/test_express_endpoints.js

# Test Supabase connection
node scripts/test_supabase.js
```

---

## 7. Production Build & Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. In Project Settings -> Environment Variables, configure all variables from `.env.example`.
3. Framework Preset: **Vite**.
4. Output Directory: `dist`.
5. Deploy. The `/api/*` directory functions will automatically deploy as Vercel Serverless Functions.

### Node.js / Docker / VPS Deployment
```bash
# Build the production frontend bundle
npm run build

# Start the production Node server
NODE_ENV=production npm run start
```

---

## 8. Security Best Practices
- **No Card Storage**: Card details never touch your server; they are tokenized within Razorpay's PCI-DSS Level 1 compliant checkout modal.
- **Timing Attack Defense**: Signatures are compared using constant-time `crypto.timingSafeEqual`.
- **Row Level Security**: Access to all tables is governed by strict PostgreSQL RLS policies.
- **Secret Isolation**: `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` are strictly kept server-side.
