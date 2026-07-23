# Smart Recommend AI

A full-stack AI-assisted recommendation platform. Users get personalized picks across **10 categories**
— travel destinations, movies, books, career paths, electronics, courses, fashion, restaurants, games,
and music — plus a dedicated **Kids mode** with age-appropriate content served from a completely
separate catalog.

Built as a production-style reference implementation: real JWT authentication, a PostgreSQL-backed data
layer, Stripe subscription billing (with a safe demo mode when no Stripe keys are configured), and a
credit-based usage system that gates free-tier recommendations.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
  - [1. Clone and configure](#1-clone-and-configure)
  - [2. Set up the database](#2-set-up-the-database)
  - [3. Start the backend](#3-start-the-backend)
  - [4. Start the frontend](#4-start-the-frontend)
  - [5. Log in](#5-log-in)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [API reference](#api-reference)
- [Database schema](#database-schema)
- [Billing and payments](#billing-and-payments)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)
- [License](#license)

---

## Features

- **AI-assisted recommendations** across 10 categories, with support for free-text interests, purpose,
  and budget-tier filtering.
- **Travel destination engine** — 271+ real destinations (India + international) with search, filters,
  reviews, and ratings.
- **Kids mode** — a fully separate, age-appropriate catalog (movies, books, courses, games, music,
  restaurants, fashion, electronics) and activity recommender, isolated from the adult catalog at the
  database level so kids content can never leak into adult results and vice versa.
- **Authentication** — email/password registration and login, bcrypt password hashing, short-lived
  JWT access tokens with rotating refresh tokens.
- **Credits system** — free users get a configurable number of sign-up credits; Pro users get unlimited
  recommendations.
- **Subscriptions & billing** — real Stripe Checkout integration, with a safe simulated checkout flow
  that activates automatically when Stripe isn't configured (no card data collected, no real payment
  network contacted). Includes plan cancellation (with a visible "cancelled, active until" state and a
  resume option) and downloadable invoices.
- **Wishlist, saved recommendations, reviews, and history** — users can save results, leave reviews on
  destinations, and revisit past searches.
- **Account management** — profile editing, theme preference (light/dark), and real account deletion.

## Tech stack

**Frontend**

- React 18 + TypeScript, built with Vite
- Tailwind CSS 4
- Radix UI primitives + Material UI components
- React Router

**Backend**

- Node.js + Express (MVC structure: routes → controllers → models)
- PostgreSQL via `pg` (node-postgres)
- JWT authentication (`jsonwebtoken`) with `bcryptjs` password hashing
- Stripe SDK for subscription billing
- `helmet`, `cors`, `morgan`, `express-validator` for security, logging, and input validation

**Database**

- PostgreSQL 14+ (Neon, Supabase, or local)

## Project structure

```
AI-Recommendation-Engine/
├── frontend/                    React + Vite + TypeScript client
│   ├── src/
│   │   ├── app/                 Application shell, pages, and components
│   │   ├── lib/                 API client
│   │   └── styles/              Tailwind + theme tokens
│   └── package.json
│
├── backend/                     Express API
│   ├── src/
│   │   ├── config/              DB connection pool (PostgreSQL)
│   │   ├── controllers/         Request handlers (one per domain)
│   │   ├── middleware/          Auth guard, error handler
│   │   ├── models/              Data-access layer
│   │   ├── routes/              Express routers, mounted under /api
│   │   ├── services/            Business logic (e.g. recommendation engine)
│   │   ├── utils/               Seed script, JWT helpers
│   │   └── server.js / app.js
│   └── package.json
│
├── api/
│   └── index.js                 Vercel serverless function entry point
│
├── database/
│   ├── schema.sql               Full PostgreSQL schema (14 tables)
│   ├── sample_data.sql          Demo seed data
│   └── migrate.js               Migration runner script
│
├── vercel.json                  Vercel deployment configuration
└── package.json                 Root: install + build scripts
```

## Prerequisites

- **Node.js** 18 or later
- **PostgreSQL** 14 or later (local, or a hosted Neon/Supabase instance)

## Getting started

### 1. Clone and configure

```bash
git clone https://github.com/your-org/AI-Recommendation-Engine.git
cd AI-Recommendation-Engine
cp backend/.env.example backend/.env
# Edit backend/.env — at minimum set DATABASE_URL
```

### 2. Set up the database

Create a PostgreSQL database, then apply the schema and (optionally) seed data:

```bash
# Apply schema
DATABASE_URL="postgresql://user:password@localhost:5432/smart_recommend_ai" node database/migrate.js

# Apply schema + seed data
DATABASE_URL="postgresql://user:password@localhost:5432/smart_recommend_ai" node database/migrate.js --seed
```

Or using Docker (starts a local PostgreSQL + seeds automatically):

```bash
cp .env.example .env   # adjust passwords if needed
docker compose up -d
```

### 3. Start the backend

```bash
npm install --prefix backend
npm run dev:backend
# → http://localhost:5000/api/health
```

### 4. Start the frontend

```bash
npm install --prefix frontend
npm run dev:frontend
# → http://localhost:5173
```

### 5. Log in

Use the demo account (requires sample data seeded):

| Field    | Value                      |
|----------|----------------------------|
| Email    | `demo@smartrecommend.ai`   |
| Password | `Passw0rd!`                |

## Environment variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (required) | — |
| `PORT` | API server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | — |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | — |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `SIGNUP_BONUS_CREDITS` | Credits given on registration | `5` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `FRONTEND_URL` | Used for Stripe redirect URLs | `http://localhost:5173` |
| `STRIPE_SECRET_KEY` | Stripe secret key (optional) | — |
| `STRIPE_PRICE_ID` | Stripe Price ID for Pro plan (optional) | — |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (optional) | — |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

## Available scripts

Run from the **project root**:

| Script | Description |
|---|---|
| `npm run install:all` | Install backend + frontend dependencies |
| `npm run build` | Build the frontend for production |
| `npm run dev:backend` | Start the backend in development mode |
| `npm run dev:frontend` | Start the frontend dev server |
| `npm run migrate` | Apply database schema |
| `npm run migrate:seed` | Apply schema + seed data |

## API reference

All routes are prefixed with `/api`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| POST | `/auth/register` | — | Register a new user |
| POST | `/auth/login` | — | Log in |
| POST | `/auth/logout` | — | Log out |
| POST | `/auth/refresh` | — | Refresh access token |
| GET | `/auth/me` | ✓ | Get current user |
| GET | `/users/profile` | ✓ | Get user profile |
| PUT | `/users/profile` | ✓ | Update profile |
| DELETE | `/users/account` | ✓ | Delete account |
| POST | `/recommendations/generate` | ✓ | Generate travel recommendations |
| GET | `/recommendations/history` | ✓ | Recommendation history |
| DELETE | `/recommendations/history/:requestId` | ✓ | Delete history item |
| POST | `/recommendations/save` | ✓ | Save a recommendation |
| GET | `/recommendations/saved` | ✓ | List saved recommendations |
| DELETE | `/recommendations/saved/:destinationId` | ✓ | Remove saved |
| GET | `/destinations` | — | List destinations |
| GET | `/destinations/:id` | — | Get destination |
| GET | `/destinations/search` | — | Search destinations |
| GET | `/destinations/categories` | — | List categories |
| GET | `/kids` | — | List kids activities |
| GET | `/kids/recommend` | — | Activities for age |
| GET | `/kids/catalog` | — | Kids catalog items |
| GET | `/kids/catalog/categories` | — | Kids catalog categories |
| GET | `/credits` | ✓ | Get credit balance |
| PUT | `/credits` | ✓ | Adjust credits |
| GET | `/credits/history` | ✓ | Credit transaction history |
| GET | `/wishlist` | ✓ | List wishlist |
| POST | `/wishlist` | ✓ | Add to wishlist |
| DELETE | `/wishlist/:destinationId` | ✓ | Remove from wishlist |
| GET | `/reviews/:destinationId` | — | List reviews |
| POST | `/reviews` | ✓ | Submit/update review |
| DELETE | `/reviews/:destinationId` | ✓ | Delete review |
| GET | `/history/travel` | ✓ | Travel history |
| POST | `/history/travel` | ✓ | Add travel history |
| GET | `/history/search` | ✓ | Search history |
| GET | `/payments/status` | — | Payment config status |
| POST | `/payments/create-checkout-session` | ✓ | Start Stripe checkout |
| POST | `/payments/confirm` | ✓ | Confirm checkout session |
| POST | `/payments/demo-upgrade` | ✓ | Demo upgrade (no real payment) |
| POST | `/payments/cancel` | ✓ | Cancel subscription |
| POST | `/payments/resume` | ✓ | Resume subscription |
| GET | `/payments/invoice` | ✓ | Get invoice |
| POST | `/payments/webhook` | — | Stripe webhook |
| GET | `/catalog/:category` | ✓ | Browse catalog category |
| POST | `/catalog/:category/generate` | ✓ | Generate catalog recommendations |
| GET | `/catalog/search` | ✓ | Search catalog |

## Database schema

14 tables in PostgreSQL:

- `users` — accounts, credits, plan status
- `sessions` — refresh token store
- `destinations` — 271+ travel destinations
- `kids_activities` — age-gated activity recommendations
- `recommendation_requests` — each generate call
- `recommendation_results` — scored destinations per request
- `saved_recommendations` — user-bookmarked results
- `wishlist` — destination wishlist
- `reviews` — user reviews and ratings
- `travel_history` — visited destinations log
- `search_history` — query audit log
- `credit_transactions` — credit ledger
- `catalog_items` — non-kids recommendation catalog
- `kids_catalog_items` — kids-only catalog (completely isolated)

## Billing and payments

When `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` are set, the upgrade flow uses real Stripe Checkout.
When they are not set, the app automatically falls back to a clearly-labelled **demo upgrade** that
updates the database without involving any payment network.

The Stripe webhook (`POST /api/payments/webhook`) listens for `checkout.session.completed` and upgrades
the user's plan in the database. To test locally, forward Stripe events with:

```bash
stripe listen --forward-to http://localhost:5000/api/payments/webhook
```

## Deployment

### Vercel (recommended)

1. Push the project to GitHub.
2. Import the repo in Vercel.
3. Set environment variables in the Vercel dashboard:
   - `DATABASE_URL` — your Neon PostgreSQL connection string
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
   - `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` (optional)
   - `FRONTEND_URL` — your Vercel deployment URL
   - `CORS_ORIGIN` — your Vercel deployment URL
4. Vercel will run `npm run install:all` and `npm run build` automatically.
5. Apply the schema to Neon once:
   ```bash
   DATABASE_URL="your-neon-url" node database/migrate.js --seed
   ```

### Docker Compose (local / self-hosted)

```bash
cp .env.example .env   # adjust passwords
docker compose up -d --build
```

This starts PostgreSQL (with schema + seed data auto-loaded), the backend, and the frontend (via Nginx).

## Troubleshooting

**`DATABASE_URL is required` error**
Make sure `backend/.env` has `DATABASE_URL` set to a valid PostgreSQL connection string.

**`Error: role "app_user" does not exist`**
The database user doesn't exist. Either create it or update `DATABASE_URL` to use an existing user.

**Build fails with TypeScript errors**
Run `npm run build --prefix frontend` to see the exact errors. The frontend requires Node 18+.

**Credits not deducting**
Ensure `DATABASE_URL` points to a seeded database. Credits are stored in the `users` table.

## Security notes

- Change all secret values before deploying to production.
- Never commit `.env` files (they are in `.gitignore`).
- The demo upgrade endpoint is intentionally unprotected by Stripe signature verification — it is clearly
  labelled as demo-only and should be disabled or removed if you configure real Stripe keys.

## License

MIT
