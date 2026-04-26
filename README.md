# 🛡️ RateGuard — Distributed API Rate Limiter

> Control API traffic. Prevent abuse. Scale with confidence.

A production-ready, distributed API rate limiting system with a real-time analytics dashboard. Features dual rate-limiting algorithms (Token Bucket + Sliding Window), tiered API keys, abuse detection with auto-blocking, and a premium React dashboard with live monitoring.

---

## ✨ Features

- **Dual Rate Limiting Algorithms** — Token Bucket and Sliding Window, switchable per-route
- **Plan-Based Limits** — Free (100 req/min), Pro (1,000 req/min), Enterprise (unlimited)
- **Abuse Detection** — Auto-blocks IPs after repeated violations with configurable TTL
- **Real-Time Dashboard** — Live request feed, charts, and status breakdowns via Socket.io
- **API Key Management** — Generate, list, and revoke API keys with tier-based rate limits
- **Redis + MongoDB** — Redis for rate counters, MongoDB for request log persistence
- **Graceful Fallback** — In-memory mode when Redis/MongoDB are unavailable
- **CSV Export** — Export request logs for offline analysis
- **Security** — Helmet.js, CORS, JWT auth with 24h expiry, input validation

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express |
| **Cache** | Redis (ioredis) |
| **Database** | MongoDB (Mongoose) |
| **Frontend** | React + Tailwind CSS v4 |
| **Charts** | Recharts |
| **Real-time** | Socket.io |
| **Auth** | JWT (jsonwebtoken) |
| **Security** | Helmet.js |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Redis (optional — falls back to in-memory)
- MongoDB (optional — falls back to in-memory)

### Quick Start (Memory Mode)

```bash
# Clone the repo
git clone https://github.com/1tsadityaraj/rateguard-api-rate-limiter.git
cd rateguard-api-rate-limiter

# Backend
cd backend
cp .env.example .env   # NO_DB=true for memory mode
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 to access the dashboard.

### Production Mode (with Redis + MongoDB)

```bash
# Start Redis
redis-server

# Start MongoDB
mongod --dbpath /data/db

# Backend
cd backend
# Edit .env: set NO_DB=false, REDIS_URL, MONGO_URI
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  Dashboard │ Blocked Users │ Alerts │ API Keys │ Rate Tester│
└───────────────────────┬─────────────────────────────────────┘
                        │ REST + Socket.io
┌───────────────────────┴─────────────────────────────────────┐
│                  Backend (Express + Node.js)                 │
│                                                             │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │ Rate Limiter │  │  API Routes │  │  Socket.io Server │  │
│  │  Middleware   │  │  /api/*     │  │  Real-time events │  │
│  └──────┬───────┘  └──────┬──────┘  └────────┬──────────┘  │
│         │                 │                   │             │
│  ┌──────┴─────────────────┴───────────────────┴──────────┐  │
│  │              Services Layer                           │  │
│  │  Redis Client  │  Memory Store  │  Request Logger     │  │
│  └──────┬─────────────────┬───────────────────┬──────────┘  │
│         │                 │                   │             │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
    ┌─────┴─────┐    ┌─────┴─────┐       ┌─────┴─────┐
    │   Redis   │    │ In-Memory │       │  MongoDB  │
    │  (cache)  │    │ (fallback)│       │  (logs)   │
    └───────────┘    └───────────┘       └───────────┘
```

---

## 📡 API Reference

### Dashboard & Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Dashboard metrics (rpm, rph, blocked, activeUsers, avgLatency) |
| GET | `/api/top-users` | Top 10 IPs by request count |
| GET | `/api/blocked-users` | Currently blocked IPs with TTLs |
| GET | `/api/alerts` | Abuse spike alerts |
| GET | `/api/logs` | Paginated request logs |
| GET | `/api/logs/export` | Export logs as CSV |
| GET | `/api/health` | System health (Redis, MongoDB, uptime) |

### Admin Actions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/block` | Manually block an IP |
| POST | `/api/unblock` | Unblock an IP |

### API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/keys/generate` | Generate a new API key |
| GET | `/api/keys` | List all API keys |
| DELETE | `/api/keys/:id` | Revoke an API key |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register admin user |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current user |

### Rate-Limited Test Endpoints
| Method | Endpoint | Algorithm |
|--------|----------|-----------|
| GET | `/api/protected/data` | Sliding Window |
| GET | `/api/tb/data` | Token Bucket |

---

## ☁️ Deployment

### Backend → Render

1. Create a new Web Service on Render
2. Set root directory to `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables from `.env.example`

### Frontend → Vercel

1. Import the repo on Vercel
2. Set root directory to `frontend`
3. Framework: Vite
4. Add `VITE_API_URL` pointing to your Render backend URL

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NO_DB` | `true` | Run without Redis/MongoDB |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `MONGO_URI` | `mongodb://localhost:27017/rateguard` | MongoDB connection URI |
| `JWT_SECRET` | — | Secret for JWT signing |
| `ALGORITHM` | `sliding-window` | Default rate limit algorithm |
| `DEFAULT_RATE_LIMIT` | `100` | Default requests per window |
| `DEFAULT_WINDOW_SECONDS` | `60` | Window size in seconds |
| `BLOCK_DURATION_MINUTES` | `10` | Auto-block duration |

---

## 📄 License

MIT © Aditya Raj
