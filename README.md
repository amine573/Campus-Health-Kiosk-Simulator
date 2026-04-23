# 🏥 Campus Health Kiosk Simulator

> **Capstone Design Project** — Al Akhawayn University in Ifrane  
> Secure SSO and One-Time Token Dispensing for Non-Medicine Health Products  
> Author: Amine Moubarak · Supervisor: Dr. Ibtissam Latachi

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [URL Routes](#url-routes)
4. [Tech Stack](#tech-stack)
5. [Prerequisites](#prerequisites)
6. [Local Development Setup](#local-development-setup)
7. [Environment Variables](#environment-variables)
8. [Seeding Initial Data](#seeding-initial-data)
9. [Deployment to Vercel](#deployment-to-vercel)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Feature Overview](#feature-overview)

---

## Overview

The Campus Health Kiosk Simulator is a full-stack web application that models controlled access to non-medicine health products within university campuses. The system uses:

- **Simulated Microsoft SSO** for student/staff authentication (FR-01)
- **One-time QR tokens** with configurable expiry for product dispensing (FR-11–FR-15)
- **Policy enforcement** to limit dispensing frequency per user/item (FR-09)
- **Inventory management** with real-time stock tracking (FR-25–FR-28)
- **Append-only audit logging** for full traceability (FR-29–FR-31)
- **Email confirmation** sent after successful dispensing

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        PRESENTATION TIER                         │
│  /login (Student SSO)  /portal (Catalog)  /kiosk  /admin        │
│                    React + Vite + Tailwind CSS                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │ REST API (JSON)
┌────────────────────────────▼─────────────────────────────────────┐
│                      APPLICATION LOGIC TIER                       │
│             Node.js + Express — MVC Architecture                 │
│  Controllers: auth · token · product · inventory · audit         │
└────────────────────────────┬─────────────────────────────────────┘
                             │ Mongoose ODM
┌────────────────────────────▼─────────────────────────────────────┐
│                       DATA MANAGEMENT TIER                        │
│    MongoDB Atlas — 8 Collections per data model specification    │
│  User · Session · Product · InventoryItem · DispensingPolicy     │
│  Token (TTL) · RedemptionEvent · AuditLogEntry                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## URL Routes

| URL              | Description                                      | Auth Required |
|------------------|--------------------------------------------------|---------------|
| `/login`         | Student / Staff login — Microsoft SSO            | No            |
| `/admin/login`   | Administrator credentials login                  | No            |
| `/portal`        | Student product catalog + token request          | Student/Staff |
| `/portal/tokens` | Student's issued token history + QR display      | Student/Staff |
| `/kiosk`         | Kiosk QR scanner / manual token redemption       | No (token validates itself) |
| `/admin`         | Admin dashboard — inventory, logs, policy        | Administrator |

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS        |
| Backend    | Node.js 20, Express 4               |
| Database   | MongoDB (Atlas) via Mongoose        |
| Auth       | JWT + simulated Microsoft SSO       |
| QR         | qrcode.react (generate) · html5-qrcode (scan) |
| Email      | Nodemailer (SMTP)                   |
| Deployment | Vercel (frontend) + Railway/Render (backend) |
| CI/CD      | GitHub Actions                      |

---

## Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **MongoDB Atlas** account (free tier works) OR local MongoDB instance
- **Git**

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/campus-health-kiosk.git
cd campus-health-kiosk
```

### 2. Set up the Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and other values (see below)
```

Start the backend dev server:

```bash
npm run dev
# Server starts at http://localhost:5000
```

### 3. Set up the Frontend

Open a new terminal:

```bash
cd frontend
npm install
cp .env.example .env
# Edit VITE_API_URL if backend is not at localhost:5000
```

Start the frontend dev server:

```bash
npm run dev
# App starts at http://localhost:5173
```

### 4. Access the Application

| Interface      | URL                             |
|----------------|---------------------------------|
| Student Portal | http://localhost:5173/login     |
| Kiosk          | http://localhost:5173/kiosk     |
| Admin          | http://localhost:5173/admin/login |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable             | Required | Description                                          |
|----------------------|----------|------------------------------------------------------|
| `MONGODB_URI`        | ✅       | MongoDB connection string (Atlas URI)                |
| `JWT_SECRET`         | ✅       | Random secret for signing JWTs (min 32 chars)        |
| `JWT_EXPIRES_IN`     | –        | JWT expiry (default: `24h`)                          |
| `TOKEN_EXPIRY_MINUTES` | –      | Dispensing token expiry (default: `30`)              |
| `CLIENT_URL`         | –        | Frontend URL for CORS (default: `*`)                 |
| `PORT`               | –        | Backend port (default: `5000`)                       |
| `SMTP_HOST`          | –        | SMTP host for emails (e.g. `smtp.gmail.com`)         |
| `SMTP_PORT`          | –        | SMTP port (default: `587`)                           |
| `SMTP_USER`          | –        | SMTP username / sender email                         |
| `SMTP_PASS`          | –        | SMTP password or App Password                        |

### Frontend (`frontend/.env`)

| Variable        | Required | Description                        |
|-----------------|----------|------------------------------------|
| `VITE_API_URL`  | ✅       | Backend API URL (e.g. `/api` or `https://your-backend.com/api`) |

---

## Seeding Initial Data

Run the seed script to populate the database with:
- Admin user (`ADMIN001` / `Admin@12345`)
- 10 sample health products with inventory
- Default dispensing policy (3 items/week, max 1 of same item)

```bash
cd backend
node scripts/seed.js
```

> ⚠️ Change the admin password immediately after first login in production.

---

## Deployment to Vercel

### Frontend (Vercel)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Set **Root Directory** to `frontend`
4. Set **Framework Preset** to `Vite`
5. Add environment variable: `VITE_API_URL` → your backend URL
6. Click **Deploy**

### Backend (Railway or Render — recommended)

**Railway:**
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select the `backend` folder as the root
3. Add all environment variables from `backend/.env.example`
4. Railway auto-detects Node.js and runs `npm start`

**Render:**
1. New Web Service → Connect GitHub repo
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables

After deploying the backend, update `VITE_API_URL` in your Vercel frontend settings to point to the backend URL.

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push to `main` or `develop`:

| Step                  | Trigger          | Action                                  |
|-----------------------|------------------|-----------------------------------------|
| Backend lint          | All pushes       | ESLint on backend JS                    |
| Frontend build + lint | All pushes       | Vite build + ESLint                     |
| Deploy to Vercel      | Push to `main`   | `vercel deploy --prod`                  |

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret Name       | Value                                    |
|-------------------|------------------------------------------|
| `VERCEL_TOKEN`    | Your Vercel personal access token        |
| `VITE_API_URL`    | Backend API URL used in production build |

---

## Feature Overview

### Student Portal (`/portal`)
- Microsoft SSO authentication (simulated; MSAL-ready)
- Browsable product catalog with category filters and search
- Token request with live policy enforcement feedback
- QR code token display with countdown timer
- Sticky navbar with avatar popup (Profile / Settings / Logout)
- Scroll-to-top button on catalog page

### Kiosk Interface (`/kiosk`)
- QR camera scanner with corner guide overlay
- Manual token ID entry fallback
- Real-time token validation (expiry, reuse, inventory)
- Dispensing confirmation screen with auto-reset (10s)
- Email confirmation sent to user after dispensing

### Admin Dashboard (`/admin`)
- **Dashboard**: Key metrics (issued, redeemed, failed) + recent activity feed
- **Inventory**: Full product table with inline quantity editing, add/disable product, 2-step delete wizard with typed verification, undo toast (6s)
- **Audit Logs**: Filterable log table (by event type, outcome) with CSV export per-student or all-students
- **Policy**: Dispensing policy editor (scope, time window, per-user/item limits)

---

## Database Collections

| Collection        | Purpose                                              |
|-------------------|------------------------------------------------------|
| `users`           | Campus identities (Student / Staff / Administrator)  |
| `sessions`        | Active session tracking with TTL auto-expiry         |
| `products`        | Health product catalog                               |
| `inventoryitems`  | Stock levels per product                             |
| `dispensingpolicies` | Campus governance rules                           |
| `tokens`          | One-time dispensing tokens with TTL expiry           |
| `redemptionevents`| Every kiosk redemption attempt (success + failure)   |
| `auditlogentries` | Immutable, append-only system event log              |

---

*Campus Health Kiosk Simulator · School of Science and Engineering · Al Akhawayn University in Ifrane*
