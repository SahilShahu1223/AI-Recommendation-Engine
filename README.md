# Smart Recommend AI

A full-stack AI-assisted recommendation platform. Users get personalized picks across **10 categories**
— travel destinations, movies, books, career paths, electronics, courses, fashion, restaurants, games,
and music — plus a dedicated **Kids mode** with age-appropriate content served from a completely
separate catalog.

Built as a production-style reference implementation: real JWT authentication, a MySQL-backed data
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
- MySQL via `mysql2`
- JWT authentication (`jsonwebtoken`) with `bcryptjs` password hashing
- Stripe SDK for subscription billing
- `helmet`, `cors`, `morgan`, `express-validator` for security, logging, and input validation

**Database**

- MySQL 8.0+

## Project structure

```
AI-Recommendation-Engine/
├── frontend/                    React + Vite + TypeScript client
│   ├── src/
│   │   ├── app/                 Application shell, pages, and components
│   │   ├── lib/                 API client
│   │   └── styles/               Tailwind + theme tokens
│   └── package.json
│
├── backend/                      Express API
│   ├── src/
│   │   ├── config/               DB connection pool
│   │   ├── controllers/          Request handlers (one per domain)
│   │   ├── middleware/           Auth guard, error handler
│   │   ├── models/                Data-access layer
│   │   ├── routes/                Express routers, mounted under /api
│   │   ├── services/              Business logic (e.g. recommendation engine)
│   │   ├── utils/                 Seed script, health check, JWT helpers
│   │   └── server.js / app.js
│   └── package.json
│
├── database/
│   ├── schema.sql                 Full MySQL schema (14 tables)
│   ├── sample_data.sql            271 destinations + catalog items across
│   │                              9 adult categories + a separate kids
│   │                              catalog + kids activities + demo user
│   └── migrations/                Incremental schema migrations for
│                                  upgrading an existing database in place
│
├── package.json                   Convenience scripts for the whole repo
├── docker-compose.yml              Orchestrates mysql + backend + frontend containers
├── AWS_DEPLOYMENT.md               Step-by-step AWS deployment guide (EC2+RDS or Docker)
└── README.md
```

Each of `backend/` and `frontend/` also has its own `Dockerfile` and `.dockerignore`, used by
`docker-compose.yml` and referenced in `AWS_DEPLOYMENT.md`.

## Prerequisites

- **Node.js** 18 or later
- **MySQL** 8.0 or later, running locally or accessible over the network
- A terminal — examples below are shown for both bash and Windows PowerShell where they differ

## Getting started

### 1. Clone and configure

```bash
git clone <your-fork-or-zip-source> AI-Recommendation-Engine
cd AI-Recommendation-Engine
```

### 2. Set up the database

Create the schema (this creates the `smart_recommend_ai` database and all tables):

```bash
# bash / macOS / Linux
mysql -u root -p < database/schema.sql

# Windows PowerShell
Get-Content database/schema.sql | mysql -u root -p
```

Load the sample dataset (destinations, catalog items, kids catalog, and the demo account).
**Important:** the dataset contains emoji, so the client connection must use `utf8mb4` or the import
will fail with a "Data too long for column" error.

```bash
# bash / macOS / Linux
mysql -u root -p --default-character-set=utf8mb4 smart_recommend_ai < database/sample_data.sql

# Windows PowerShell
Get-Content database/sample_data.sql | mysql -u root -p --default-character-set=utf8mb4 smart_recommend_ai
```

Create a dedicated application user rather than running the app as `root` in production:

```sql
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON smart_recommend_ai.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
```

> If you're upgrading an **existing** database created by an earlier version of this project rather
> than importing the schema fresh, run the scripts in `database/migrations/` in order instead of
> re-running `schema.sql` (which would drop and recreate tables and lose your data).

### 3. Start the backend

```bash
cd backend
cp .env.example .env      # Windows: copy .env.example .env
```

Edit `.env` with your database credentials and JWT secrets (see
[Environment variables](#environment-variables) below), then:

```bash
npm install
npm run seed     # sets a verified password hash for the demo account
npm run dev       # starts the API on http://localhost:5000
```

### 4. Start the frontend

In a new terminal:

```bash
cd frontend
cp .env.example .env      # Windows: copy .env.example .env
npm install
npm run dev       # starts the app on http://localhost:5173
```

### 5. Log in

Open `http://localhost:5173` and either register a new account or use the seeded demo account:

```
Email:    demo@smartrecommend.ai
Password: Passw0rd!
```

## Environment variables

### `backend/.env`

| Variable                 | Description                                           | Example                 |
| ------------------------ | ----------------------------------------------------- | ----------------------- |
| `PORT`                   | Port the API listens on                               | `5000`                  |
| `NODE_ENV`               | Runtime environment                                   | `development`           |
| `DB_HOST`                | MySQL host                                            | `localhost`             |
| `DB_PORT`                | MySQL port                                            | `3306`                  |
| `DB_USER`                | MySQL user                                            | `app_user`              |
| `DB_PASSWORD`            | MySQL password                                        | —                       |
| `DB_NAME`                | Database name                                         | `smart_recommend_ai`    |
| `JWT_ACCESS_SECRET`      | Secret for signing access tokens                      | long random string      |
| `JWT_REFRESH_SECRET`     | Secret for signing refresh tokens                     | long random string      |
| `JWT_ACCESS_EXPIRES_IN`  | Access token lifetime                                 | `15m`                   |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime                                | `7d`                    |
| `SIGNUP_BONUS_CREDITS`   | Free credits granted on registration                  | `5`                     |
| `CORS_ORIGIN`            | Allowed frontend origin                               | `http://localhost:5173` |
| `FRONTEND_URL`           | Used to build absolute links (e.g. Stripe redirect)   | `http://localhost:5173` |
| `STRIPE_SECRET_KEY`      | Stripe secret key (test mode) — optional              | —                       |
| `STRIPE_PRICE_ID`        | Stripe recurring Price ID for the Pro plan — optional | —                       |
| `STRIPE_WEBHOOK_SECRET`  | Stripe webhook signing secret — optional              | —                       |

Leave the three `STRIPE_*` variables blank to use the built-in simulated checkout flow — no Stripe
account is required to run or demo the app.

### `frontend/.env`

| Variable       | Description                 | Example                     |
| -------------- | --------------------------- | --------------------------- |
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:5000/api` |

## Available scripts

From the repository root (`package.json`):

| Script                   | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| `npm run install:all`    | Installs dependencies in both `backend/` and `frontend/` |
| `npm run dev:backend`    | Starts the backend in watch mode                         |
| `npm run dev:frontend`   | Starts the frontend dev server                           |
| `npm run build:frontend` | Type-checks and builds the frontend for production       |
| `npm run seed:backend`   | Runs the backend seed script                             |

From `backend/package.json`:

| Script                | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `npm run dev`         | Starts the API with `nodemon` (auto-restart on change) |
| `npm start`           | Starts the API with plain `node`                       |
| `npm run seed`        | Sets a verified bcrypt hash for the demo account       |
| `npm run test:health` | Runs a basic health check against the running API      |

From `frontend/package.json`:

| Script            | Description                                      |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Starts the Vite dev server                       |
| `npm run build`   | Type-checks (`tsc -b`) and builds for production |
| `npm run preview` | Serves the production build locally              |

## API reference

All routes are mounted under `/api`. Routes marked 🔒 require a valid `Authorization: Bearer <token>`
header.

| Resource            | Method & path                                     | Description                                            |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| **Auth**            | `POST /auth/register`                             | Create an account                                      |
|                     | `POST /auth/login`                                | Log in, receive access + refresh tokens                |
|                     | `POST /auth/refresh`                              | Exchange a refresh token for a new access token        |
|                     | `POST /auth/logout`                               | Invalidate the current session                         |
|                     | 🔒 `GET /auth/me`                                 | Get the current user                                   |
| **Users**           | 🔒 `GET /users/profile`                           | Get profile                                            |
|                     | 🔒 `PUT /users/profile`                           | Update profile                                         |
|                     | 🔒 `DELETE /users/account`                        | Permanently delete the account                         |
| **Destinations**    | `GET /destinations`                               | List destinations                                      |
|                     | `GET /destinations/search`                        | Search destinations                                    |
|                     | `GET /destinations/categories`                    | List destination categories                            |
|                     | `GET /destinations/:id`                           | Get one destination                                    |
| **Recommendations** | 🔒 `POST /recommendations/generate`               | Generate recommendations                               |
|                     | 🔒 `GET /recommendations/history`                 | List past recommendation requests                      |
|                     | 🔒 `DELETE /recommendations/history/:requestId`   | Delete a history entry                                 |
|                     | 🔒 `POST /recommendations/save`                   | Save a recommendation                                  |
|                     | 🔒 `GET /recommendations/saved`                   | List saved recommendations                             |
|                     | 🔒 `DELETE /recommendations/saved/:destinationId` | Unsave a recommendation                                |
| **Catalog**         | `GET /catalog/search`                             | Search the general catalog                             |
|                     | `GET /catalog/:category`                          | Browse a category                                      |
|                     | 🔒 `POST /catalog/:category/generate`             | Generate category recommendations                      |
| **Kids**            | `GET /kids`                                       | List kids activities                                   |
|                     | `GET /kids/recommend`                             | Recommend for a child                                  |
|                     | `GET /kids/family`                                | Recommend for a family                                 |
|                     | `GET /kids/catalog`                               | Browse the kids catalog                                |
|                     | `GET /kids/catalog/categories`                    | List kids catalog categories                           |
| **Credits**         | 🔒 `GET /credits`                                 | Get current credit balance                             |
|                     | 🔒 `PUT /credits`                                 | Adjust credits                                         |
|                     | 🔒 `GET /credits/history`                         | List credit transactions                               |
| **Wishlist**        | 🔒 `GET /wishlist`                                | List wishlist items                                    |
|                     | 🔒 `POST /wishlist`                               | Add to wishlist                                        |
|                     | 🔒 `DELETE /wishlist/:destinationId`              | Remove from wishlist                                   |
| **Reviews**         | `GET /reviews/:destinationId`                     | List reviews for a destination                         |
|                     | 🔒 `POST /reviews`                                | Create or update a review                              |
|                     | 🔒 `DELETE /reviews/:destinationId`               | Delete a review                                        |
| **History**         | 🔒 `POST /history/travel`                         | Log a travel history entry                             |
|                     | 🔒 `GET /history/travel`                          | List travel history                                    |
|                     | 🔒 `GET /history/search`                          | List search history                                    |
| **Payments**        | 🔒 `POST /payments/create-checkout-session`       | Start a Stripe Checkout session                        |
|                     | 🔒 `POST /payments/confirm`                       | Confirm a completed checkout                           |
|                     | `GET /payments/status`                            | Get current billing status                             |
|                     | 🔒 `POST /payments/demo-upgrade`                  | Upgrade to Pro without Stripe (demo mode)              |
|                     | 🔒 `POST /payments/cancel`                        | Cancel the Pro subscription                            |
|                     | 🔒 `POST /payments/resume`                        | Resume a cancelled subscription                        |
|                     | 🔒 `GET /payments/invoice`                        | Download the latest invoice as a PDF                   |
|                     | `POST /payments/webhook`                          | Stripe webhook endpoint (raw body, signature-verified) |

## Database schema

Fourteen tables, defined in `database/schema.sql`:

`users`, `sessions`, `destinations`, `kids_activities`, `travel_history`,
`recommendation_requests`, `recommendation_results`, `wishlist`, `saved_recommendations`,
`reviews`, `search_history`, `credit_transactions`, `kids_catalog_items`, `catalog_items`

Two catalogs are intentionally kept separate: `catalog_items` (adult recommendations across 9
categories) and `kids_catalog_items` (age-appropriate content for the Kids page), so the two audiences
never share query paths or results.

`database/sample_data.sql` seeds:

- 271 destinations (India + international)
- ~2,500 catalog items across 9 adult categories
- A separate kids catalog and kids activity set
- One demo user account

## Billing and payments

Pro subscriptions are handled through Stripe Checkout when `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID`
are configured. If they're left blank, the app automatically falls back to a **simulated checkout**:
users see a realistic card-entry screen, but no card data is transmitted or stored and no real payment
network is contacted — it exists purely to demonstrate the full upgrade flow end to end.

Cancelling a plan sets a visible "cancelled" state showing the date access remains active until, with
an option to resume before that date. Invoices are generated as real PDF files on demand via
`GET /payments/invoice`.

## Deployment

For running this in production on AWS, see **[`AWS_DEPLOYMENT.md`](./AWS_DEPLOYMENT.md)**, which
covers two paths in detail:

- **EC2 + RDS** — a small EC2 instance running the backend under PM2 and Nginx serving the built
  frontend, with MySQL on a managed RDS instance.
- **Docker on EC2** — using the `Dockerfile`s and `docker-compose.yml` included in this repo, which
  bring up MySQL, the backend, and the frontend as three containers with one command:

  ```bash
  cp .env.example .env    # fill in real secrets first
  docker compose up -d --build
  ```

Both paths include HTTPS setup with Certbot and notes on scaling further (RDS, ECR/ECS, S3+CloudFront,
Secrets Manager).

## Troubleshooting

**`ERROR 1406: Data too long for column 'emoji'` when importing `sample_data.sql`**
Your MySQL client is connecting with a non-UTF-8 charset. Re-run the import with
`--default-character-set=utf8mb4` as shown in [Set up the database](#2-set-up-the-database).

**`ERROR 1045: Access denied` when connecting to MySQL**
Double-check the username/password in `backend/.env` match a user that actually exists — run
`SELECT user, host FROM mysql.user;` as root to confirm — and that you're not mixing up a `-p` flag
with no space before the password (e.g. `-pMyPassword`, not `-p MyPassword`).

**Login fails for `demo@smartrecommend.ai`**
Run `npm run seed` from `backend/` — this sets a verified bcrypt hash for the demo account after
`sample_data.sql` has been imported.

**`'<' operator is reserved for future use` in PowerShell**
PowerShell doesn't support bash-style `<` redirection. Use `Get-Content file.sql | mysql ...` instead,
as shown throughout this README.

## Security notes

- Passwords are hashed with `bcryptjs`; plaintext passwords are never stored.
- Access tokens are short-lived; refresh tokens are used to obtain new ones without re-authenticating.
- `helmet` sets sensible security-related HTTP headers by default.
- Do not commit `.env` files. Use strong, unique values for `JWT_ACCESS_SECRET` and
  `JWT_REFRESH_SECRET` in any deployed environment.
- The Stripe webhook route verifies signatures against `STRIPE_WEBHOOK_SECRET` and reads the raw
  request body, per Stripe's requirements — do not add body-parsing middleware ahead of it.

## License

This project is provided as-is for educational and demonstration purposes. Add a license of your
choice here before distributing or deploying it publicly.
