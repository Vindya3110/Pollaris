# Pollaris - Live Polling Tool

A real-time polling application where creators make polls, share links, and audiences vote — with results updating live for everyone watching.

## Tech Stack

| Layer   | Technology |
|---------|------------|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend  | Go 1.23 + Gin framework |
| Database | MongoDB (poll/poll data persistence) |
| Realtime | Redis (live vote counters + WebSocket broadcast) |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                    │
│  Port 3000                                            │
│  - Auth pages (Login/Register)                        │
│  - Poll creation form                                 │
│  - Live poll view with real-time bar charts           │
│  - WebSocket client for live updates                  │
└──────────────────────┬────────────────────────────────┘
                       │ HTTP/WS
┌──────────────────────▼────────────────────────────────┐
│                   Backend (Go/Gin)                     │
│  Port 8080                                            │
│  - JWT authentication middleware                      │
│  - REST API: CRUD polls, cast votes                   │
│  - WebSocket hub: broadcast live updates              │
│  - Input validation on every request                  │
└──────┬──────────────────────┬──────────────────────────┘
       │                      │
┌──────▼──────────┐   ┌───────▼─────────────────────────┐
│   MongoDB       │   │   Redis                          │
│  Port 27017     │   │   Port 6379                      │
│  - Users        │   │   - Vote counters (INCR)         │
│  - Polls        │   │   - Voter dedup (SADD/SISMEMBER) │
│  - Votes        │   │   - Pub/Sub for WebSocket relay  │
└─────────────────┘   └──────────────────────────────────┘
```

## Data Flow

1. **Create Poll**: Authenticated user sends POST /api/polls → saved to MongoDB, Redis keys initialized
2. **Share Link**: Creator shares `/poll/:id` URL
3. **Audience Votes**: Visitor opens poll page → votes via POST /api/polls/vote → vote recorded in both MongoDB AND Redis atomically
4. **Live Results**: Every vote triggers WebSocket broadcast → all connected clients receive update instantly via Recharts

Redis is the **single source of truth for live counts** — every API response reads from Redis, not MongoDB.

## Project Structure

```
Pollaris/
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Login, Register, CreatePoll, PollView
│   │   ├── context/          # AuthContext for JWT management
│   │   ├── hooks/            # useWebSocket for live updates
│   │   ├── services/         # API client + WebSocket client
│   │   ├── App.jsx           # Router setup
│   │   └── main.jsx          # Entry point
│   ├── index.html
│   ├── vite.config.js        # Dev server + API proxy
│   ├── tailwind.config.js
│   ├── nginx.conf            # Production reverse proxy
│   └── Dockerfile            # Multi-stage build → nginx:alpine
│
├── backend/
│   ├── cmd/server/
│   │   └── main.go           # Entry point, routing, env config
│   ├── internal/
│   │   ├── database/
│   │   │   ├── mongo.go      # MongoDB connection (singleton)
│   │   │   └── redis.go      # Redis connection (singleton)
│   │   ├── handlers/
│   │   │   └── handlers.go   # All HTTP + WebSocket handlers
│   │   ├── middleware/
│   │   │   └── auth.go       # JWT validation middleware
│   │   ├── models/
│   │   │   ├── models.go     # Domain models (User, Poll, Vote)
│   │   │   └── dto.go        # Request/Response DTOs
│   │   ├── repository/
│   │   │   └── repo.go       # MongoDB data access layer
│   │   ├── services/
│   │   │   └── poll.go       # Redis operations + WebSocket hub
│   │   └── utils/
│   │       └── jwt.go        # JWT generate/verify + password hash
│   ├── Dockerfile            # Multi-stage Go build
│   ├── go.mod
│   └── .env.example
│
└── docker-compose.yml        # Orchestration for all 4 services
```

## Prerequisites

- Node.js >= 18
- Go >= 1.23
- MongoDB >= 7.0
- Redis >= 7.0
- Docker & Docker Compose (optional, for containerized deployment)

## Quick Start (Local Development)

### Option A: Docker Compose (Recommended)

```bash
# 1. Clone the repo
cd Pollaris

# 2. Start all services
docker compose up --build

# 3. Access the app
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
```

### Option B: Local Development

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start MongoDB
mongod --dbpath /tmp/mongodb

# Terminal 3: Start Backend
cd backend
go build -o server ./cmd/server/
PORT=8080 \
MONGO_URI=mongodb://localhost:27017/pollaris \
REDIS_ADDR=localhost:6379 \
REDIS_PASSWORD="" \
JWT_SECRET=pollaris-dev-secret-key-2024 \
./server

# Terminal 4: Start Frontend
cd frontend
npm install
npm run dev
```

## API Endpoints

### Authentication
| Method | Endpoint           | Auth | Description         |
|--------|-------------------|------|---------------------|
| POST   | /api/auth/register | No   | Create account      |
| POST   | /api/auth/login    | No   | Login, get JWT      |
| GET    | /api/auth/me       | Yes  | Get current user    |

### Polls
| Method | Endpoint           | Auth | Description          |
|--------|-------------------|------|----------------------|
| GET    | /api/polls         | No   | List all active polls|
| GET    | /api/polls/:id     | No   | Get poll with results|
| POST   | /api/polls         | Yes  | Create new poll      |
| POST   | /api/polls/vote    | No   | Cast a vote          |
| GET    | /api/polls/my      | Yes  | Get my polls         |
| PUT    | /api/polls/:id/toggle | Yes | Toggle poll active  |

### WebSocket
| Endpoint | Description                    |
|----------|--------------------------------|
| GET /ws?pollId=<id>&username=<name> | Live poll updates |

## Key Design Decisions

1. **Redis as live count source**: Every `GetPoll` and `GetAllPolls` reads vote counts from Redis (`INCR` counters), not MongoDB. This makes the API itself fast and always returns live numbers.

2. **Atomic writes**: Each vote writes to MongoDB (permanent record) AND Redis (live counter) in a single handler. No eventual consistency issues.

3. **Voter deduplication**: Uses IP + User-Agent hash stored in a Redis Set (`SADD`/`SISMEMBER`) — fast, no extra DB queries.

4. **WebSocket broadcast**: On every vote, `BroadcastUpdate` pushes the new totals to all connected clients watching that poll. Frontend uses `useWebSocket` hook to auto-update Recharts.

5. **Separation of concerns**: Each backend layer (handlers → services → repository) is in its own file/package. Frontend has dedicated `services/`, `hooks/`, `context/` directories.

6. **Backend validation**: Every input is validated server-side via Gin's binding (`binding:"required,min=..."`) AND manual checks. Frontend validation is UX-only; backend is the authority.

## Environment Variables

| Variable        | Default                              | Description           |
|-----------------|--------------------------------------|-----------------------|
| PORT            | 8080                                 | Backend port          |
| MONGO_URI       | mongodb://localhost:27017/pollaris   | MongoDB connection    |
| REDIS_ADDR      | localhost:6379                       | Redis address         |
| REDIS_PASSWORD  | (empty)                              | Redis password        |
| JWT_SECRET      | (required)                           | JWT signing key       |

## License

MIT
