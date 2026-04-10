# 🛡️ RateGuard — Distributed API Rate Limiter

A production-ready, scalable API rate limiting system with a real-time analytics dashboard. Built with Node.js, Express, Redis, MongoDB, React, and Tailwind CSS.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7+-DC382D?logo=redis&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7+-47A248?logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-06B6D4?logo=tailwindcss&logoColor=white)

---

## ✨ Features

### Rate Limiting
- **Token Bucket** algorithm — allows controlled bursts above the average rate
- **Sliding Window** algorithm — precise per-second granularity via Redis sorted sets
- **Per-IP and Per-User** rate limiting with automatic identifier detection
- **Redis-backed** counters with TTL for automatic expiration
- **In-memory fallback** when Redis is unavailable
- **Atomic Lua scripts** for race-condition-free operations

### API Protection
- Automatic **abuse detection** with escalating blocks
- **Manual block/unblock** from the dashboard
- Auto-block after 5 violations in 5 minutes
- Configurable block duration (default: 10 minutes)
- Standard `429 Too Many Requests` with `Retry-After` header

### API Key System
- **Tiered rate limits**: Free (30 req/min) and Pro (200 req/min)
- API key generation, listing, and revocation
- Request count tracking per key
- `x-api-key` header authentication

### Admin Authentication
- **JWT-based** admin authentication
- User registration and login
- Role-based access control (admin/viewer)
- Demo mode for trying the dashboard without auth

### Real-Time Dashboard
- Live request feed via **Socket.io**
- Request timeline chart (Recharts area chart)
- Status code breakdown (donut chart)
- Top users/IPs table with block/unblock actions
- System health monitoring
- Abuse alerts panel with severity levels

### Bonus Features
- **CSV log export** with configurable time ranges
- **Interactive rate tester** — fire burst requests to see limiting in action
- **Responsive design** — works on mobile and desktop
- **Glass morphism UI** with gradient accents and micro-animations

---

## 🏗️ Project Structure

```
RateGuard/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection with retry logic
│   ├── controllers/
│   │   ├── apiKeyController.js   # API key CRUD operations
│   │   ├── authController.js     # JWT auth (register/login)
│   │   └── statsController.js    # Dashboard stats, alerts, export
│   ├── middleware/
│   │   ├── apiKeyAuth.js         # API key resolution middleware
│   │   ├── auth.js               # JWT authentication + RBAC
│   │   └── rateLimiter.js        # Token Bucket + Sliding Window
│   ├── models/
│   │   ├── ApiKey.js             # Tiered API key schema
│   │   ├── RequestLog.js         # Request log with TTL index
│   │   └── User.js               # Admin user with bcrypt
│   ├── routes/
│   │   ├── apiKeys.js            # API key management routes
│   │   ├── auth.js               # Auth routes
│   │   ├── protected.js          # Sample rate-limited routes
│   │   └── stats.js              # Dashboard & admin routes
│   ├── services/
│   │   └── redisClient.js        # Redis singleton + reconnection
│   ├── .env.example
│   ├── index.js                  # Server entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── AlertsPanel.jsx       # Abuse alert cards
│   │   │   ├── ApiKeysPanel.jsx      # API key management UI
│   │   │   ├── BlockedUsersTable.jsx  # Blocked users with TTL
│   │   │   ├── Layout.jsx            # Sidebar + header shell
│   │   │   ├── LiveFeed.jsx          # Real-time request feed
│   │   │   ├── RateTester.jsx        # Interactive rate-limit tester
│   │   │   ├── RequestChart.jsx      # Recharts area chart
│   │   │   ├── SettingsPanel.jsx     # Health, export, config
│   │   │   ├── StatsCards.jsx        # Metric stat cards
│   │   │   ├── StatusBreakdown.jsx   # Donut chart
│   │   │   └── TopUsersTable.jsx     # Top users with actions
│   │   ├── hooks/
│   │   │   └── useDashboardData.js   # REST polling + Socket.io
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Main dashboard view
│   │   │   └── LoginPage.jsx         # JWT auth page
│   │   ├── services/
│   │   │   ├── api.js                # Axios client + all API calls
│   │   │   └── socket.js             # Socket.io client singleton
│   │   ├── App.jsx                   # Root app with routing
│   │   ├── index.css                 # Tailwind + custom theme
│   │   └── main.jsx                  # React entry point
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Redis** 7+ (running locally or via cloud)
- **MongoDB** 7+ (running locally or via MongoDB Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/1tsadityaraj/rateguard-api-rate-limiter.git
cd rateguard-api-rate-limiter
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your MongoDB and Redis connection details:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rateguard

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Rate Limiting
DEFAULT_RATE_LIMIT=100
DEFAULT_WINDOW_SECONDS=60
BLOCK_DURATION_MINUTES=10

# API Key Tiers
FREE_TIER_LIMIT=30
PRO_TIER_LIMIT=200

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev    # Development (with nodemon)
npm start      # Production
```

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

The frontend uses Vite's built-in proxy to forward `/api` and `/socket.io` requests to the backend in development. No additional configuration needed.

Start the frontend:

```bash
npm run dev
```

### 4. Open the dashboard

Visit **http://localhost:5173** in your browser.

- Click **"Skip login (demo mode)"** to explore the dashboard immediately
- Or register a new admin account to use JWT authentication

---

## 📡 API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | System health check |
| `POST` | `/api/auth/register` | Register admin user |
| `POST` | `/api/auth/login` | Login + get JWT |

### Dashboard (no auth required for demo)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stats` | Aggregate request metrics |
| `GET` | `/api/top-users` | Most active users/IPs |
| `GET` | `/api/blocked-users` | Currently blocked list |
| `GET` | `/api/alerts` | Abuse spike detection |
| `POST` | `/api/block` | Manually block user |
| `POST` | `/api/unblock` | Unblock user |
| `GET` | `/api/logs/export` | Export logs as CSV |

### Protected by JWT

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/me` | Current user info |
| `POST` | `/api/keys` | Create API key |
| `GET` | `/api/keys` | List API keys |
| `DELETE` | `/api/keys/:id` | Revoke API key |

### Rate-Limited Endpoints

| Method | Endpoint | Algorithm |
|--------|----------|-----------|
| `GET` | `/api/protected/data` | Sliding Window |
| `POST` | `/api/protected/data` | Sliding Window |
| `GET` | `/api/protected/users` | Sliding Window |
| `GET` | `/api/protected/products` | Sliding Window |
| `GET` | `/api/tb/data` | Token Bucket |
| `GET` | `/api/tb/users` | Token Bucket |

---

## ⚙️ Rate Limiting Algorithms

### Sliding Window (Redis Sorted Set)

```
Each request is scored by timestamp in a sorted set.
On each request:
  1. Remove entries outside the current window
  2. Count remaining entries
  3. If count < limit → allow + add entry
  4. If count >= limit → deny + return retry-after
```

Endpoint: `/api/protected/*`

### Token Bucket (Redis + Lua)

```
Tokens refill at a steady rate (limit / windowSec per second).
On each request:
  1. Calculate tokens refilled since last request
  2. If tokens >= 1 → consume 1 token + allow
  3. If tokens < 1 → deny + return retry-after
```

Endpoint: `/api/tb/*`

Both algorithms use **atomic Lua scripts** to prevent race conditions under concurrent load.

---

## 🔐 API Key Tiers

| Tier | Rate Limit | Key Prefix |
|------|-----------|------------|
| Free | 30 req/min | `rg_free_` |
| Pro | 200 req/min | `rg_pro_` |

Usage: Pass `x-api-key: rg_free_abc123...` in request headers.

---

## 🛡️ Abuse Detection

1. When a user exceeds the rate limit → **violation tracked** in Redis
2. After **5 violations** within 5 minutes → **auto-blocked** for 10 minutes
3. Blocked users receive `429` with block expiry information
4. Admins can **manually block/unblock** from the dashboard

---

## 📊 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `request-log` | Server → Client | Every API request |
| `user-blocked` | Server → Client | When a user is blocked |
| `user-unblocked` | Server → Client | When a user is unblocked |

---

## 🌐 Deployment

### Backend → Render

1. Create a new Web Service on [Render](https://render.com)
2. Set environment variables from `.env.example`
3. Build Command: `npm install`
4. Start Command: `node index.js`
5. Use a managed Redis (e.g., Render Redis, Upstash) and MongoDB Atlas

### Frontend → Vercel

1. Import the `frontend/` directory on [Vercel](https://vercel.com)
2. Set environment variables:
   - `VITE_API_URL=https://your-backend.onrender.com`
   - `VITE_SOCKET_URL=https://your-backend.onrender.com`
3. Build will run automatically with `npm run build`

---

## 🧪 Testing the Rate Limiter

Use the built-in **Rate Tester** tab in the dashboard, or test manually:

```bash
# Single request
curl http://localhost:5000/api/protected/data

# Burst test (50 rapid requests)
for i in $(seq 1 50); do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/protected/data &
done
wait

# With API key
curl -H "x-api-key: rg_pro_abc123" http://localhost:5000/api/protected/data
```

---

## 📄 License

MIT © [Aditya Raj](https://github.com/1tsadityaraj)
