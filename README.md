# Pollaris - Live Polling Tool

A real-time polling platform where users create polls, share links, and audiences vote with live-updating results. Built with React, Go (Gin), MongoDB, and Redis.

## Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | React 18 + React Router | UI, voting, live results display |
| Backend | Go + Gin | REST API, WebSocket server, business logic |
| Database | MongoDB | Persistent poll storage, vote records |
| Realtime | Redis | Live vote counters, WebSocket pub/sub |

## Key Architecture Decisions

### 1. CORS-first architecture
The backend sends `Access-Control-Allow-Origin: *`, so the frontend calls the backend **directly** via absolute URLs baked in at build time. No nginx proxy layer is needed, eliminating a fragile link in the chain.

### 2. Absolute URLs via `import.meta.env`
`VITE_API_URL` is set during the Docker build (via `ARG` → `.env` in the image). This bakes the backend URL directly into the JavaScript bundle. When the backend redeploys with a new Cloud Run URL, we just update `.env.example` and rebuild.

### 3. Redis drives live updates
- `RecordVote()` uses `INCR` (atomic counter) per option — live vote counts
- `MarkVoted()` uses `SADD` — tracks who voted
- `GetPollResults()` reads from Redis in O(1) per option
- WebSocket broadcaster pushes updates to all connected clients
- `RebuildRedisFromMongo()` recovers vote counts on container restart

### 4. Results visibility
Results are hidden until the viewer has voted (privacy), or if the poll has zero votes (nothing to show). After voting, results appear with animated progress bars.

## Project Structure

```
Pollaris/
├── frontend/                    # React app
│   ├── public/
│   ├── src/
│   │   ├── components/          # Navbar, shared UI
│   │   ├── pages/               # Home, Login, Register, Dashboard, PollDetail
│   │   ├── context/             # AuthContext (JWT management)
│   │   ├── services/            # API client + WebSocket hook
│   │   ├── App.jsx              # Routing
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── .env.example             # Set VITE_API_URL for production
│   ├── Dockerfile               # Multi-stage: Node build → nginx serve
│   ├── vite.config.js           # Dev proxy to backend
│   └── package.json
├── backend/                     # Go service
│   ├── cmd/server/              # main.go (entry point)
│   ├── internal/
│   │   ├── handlers/            # HTTP + WebSocket handlers
│   │   ├── models/              # MongoDB models + DTOs
│   │   ├── services/            # Business logic (Redis, WebSocket)
│   │   ├── repository/          # MongoDB data access
│   │   └── middleware/           # CORS, Auth
│   ├── .env
│   └── Dockerfile
└── cloudbuild.yaml              # Cloud Build CI/CD
```

## Environment Variables

### Backend
```
MONGO_URI=<MongoDB connection string>
REDIS_ADDR=<Redis connection string>
JWT_SECRET=<JWT signing secret>
```

### Frontend
```
VITE_API_URL=https://pollaris-1061288659823.us-central1.run.app
```

## How to Run Locally

### Prerequisites
- Node.js 20+, Go 1.21+
- MongoDB Atlas (or local instance)
- Redis (local or cloud)

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB and Redis URIs
go mod download
go run cmd/server/main.go
```

### Frontend (development)
```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL to your local backend, e.g. http://localhost:8080
npm install
npm run dev
```

## Core API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login, get JWT |
| POST | `/api/auth/google` | No | Google Sign-In |
| GET | `/api/auth/me` | Yes | Current user info |
| GET | `/api/polls` | No | List all active polls |
| GET | `/api/polls/:id` | No | Single poll (hides results until you vote) |
| POST | `/api/polls` | Yes | Create a poll |
| POST | `/api/polls/vote` | Yes | Cast a vote |
| GET | `/api/polls/my` | Yes | Creator's polls |
| GET | `/api/polls/my-votes` | Yes | Polls user voted on |
| PUT | `/api/polls/:id/toggle` | Yes | Open/close a poll |
| DELETE | `/api/polls/:id` | Yes | Delete a poll |

## WebSocket

Connect to `/ws?pollId=<pollID>` to receive real-time updates:
```json
{ "type": "poll_update", "payload": { "totalVotes": 5, "options": [...] } }
```

## Deployment

Uses Google Cloud Build + Cloud Run. Single-container deployment:
the Go backend serves both the REST/WebSocket API and the React
frontend static files (no separate frontend service needed).

Push to `main` triggers a Cloud Build → Cloud Run deploy.

## Live App

**https://pollaris-1061288659823.us-central1.run.app**

## Author Notes

This project was built for the GUVI Developer Internship task.
