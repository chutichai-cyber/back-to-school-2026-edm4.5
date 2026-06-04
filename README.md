# Back to School Scoreboard

Real-time scoreboard system for school events. Built with Next.js, Elysia (Bun), Socket.IO, and PostgreSQL.

---

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14, Tailwind CSS, Socket.IO client |
| Backend | Elysia + Bun, Socket.IO server |
| Database | PostgreSQL + Prisma ORM |
| Realtime | Socket.IO (WebSocket + polling fallback) |

---

## Local Development (Docker)

### Prerequisites

- Docker Desktop

### Run

```bash
cp apps/backend/.env.example .env   # สร้าง .env จากตัวอย่าง
docker compose up --build
```

| Service | URL |
| --- | --- |
| Admin panel | http://localhost:3000/admin |
| Display (scoreboard) | http://localhost:3000/display |
| Backend API | http://localhost:4000 |

### Seed data (first run)

Seed รันอัตโนมัติตอน container start — สร้าง event, 6 ทีม, 4 เกมส์, และ admin accounts:

| Username | Password | Role |
| --- | --- | --- |
| `superadmin` | `Admin@1234` | SUPER_ADMIN |
| `admin` | `Admin@1234` | ADMIN |

### Reset database

```bash
docker compose down
rm -rf ./data/postgres
docker compose up
```

---

## Local Development (Without Docker)

### Prerequisites

- [Bun](https://bun.sh) — runtime สำหรับ backend
- Node.js 18+ — สำหรับ frontend (Next.js)
- PostgreSQL (local หรือ cloud เช่น Neon, Supabase)

ติดตั้ง Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

---

### 1. ติดตั้ง Dependencies

```bash
# ถ้ามี pnpm
pnpm install

# ถ้าไม่มี pnpm — ติดตั้งแยกแต่ละ app
cd apps/backend && bun install
cd ../frontend && npm install
```

---

### 2. ตั้งค่า Environment Variables

**Backend:**

```bash
cp apps/backend/.env.example apps/backend/.env
```

แก้ไข `apps/backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/scoreboard_db
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info

# Admin login (ไม่ใช้ database)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
JWT_SECRET=replace-with-a-long-random-secret
TOKEN_EXPIRY_HOURS=8
```

**Frontend:**

```bash
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

แก้ไข `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

---

### 3. Database Migration & Seed

```bash
cd apps/backend

# สร้าง table จาก schema
bunx prisma migrate deploy

# ใส่ข้อมูลเริ่มต้น (event, teams, games, admin accounts)
bun prisma/seed.js
```

> **ถ้าไม่มี bun** ใช้ npx แทน:
> ```bash
> npx prisma migrate deploy
> node prisma/seed.js
> ```

Seed จะสร้าง admin accounts:

| Username | Password | Role |
| --- | --- | --- |
| `superadmin` | `Admin@1234` | SUPER_ADMIN |
| `admin` | `Admin@1234` | ADMIN |

---

### 4. รัน Dev Server

```bash
# Terminal 1 — Backend
cd apps/backend
bun dev

# Terminal 2 — Frontend
cd apps/frontend
npm run dev
```

| Service | URL |
| --- | --- |
| Admin panel | http://localhost:3000/admin |
| Display (scoreboard) | http://localhost:3000/display |
| Backend API | http://localhost:4000 |

---

### Reset Database

```bash
cd apps/backend
bunx prisma migrate reset   # ลบทุกอย่างแล้ว migrate + seed ใหม่
```

---

## Production Deployment

### ภาพรวม

```
Vercel (Frontend)  ──WebSocket──►  Railway (Backend + PostgreSQL)
```

---

## Backend → Railway

### 1. สร้าง Project บน Railway

1. ไปที่ [railway.app](https://railway.app) → **New Project**
2. เลือก **Deploy from GitHub repo** → เลือก repo นี้
3. Railway จะ detect Dockerfile อัตโนมัติ

### 2. ตั้งค่า Build

ใน Railway service settings:

| Setting | Value |
| --- | --- |
| **Root Directory** | `/` (monorepo root) |
| **Dockerfile Path** | `apps/backend/Dockerfile` |
| **Watch Paths** | `apps/backend/**`, `packages/shared/**` |

### 3. เพิ่ม PostgreSQL

1. คลิก **+ New** → **Database** → **PostgreSQL**
2. Railway จะสร้าง `DATABASE_URL` ให้อัตโนมัติ
3. ใน backend service → **Variables** → เพิ่ม **Reference Variable** `DATABASE_URL` จาก PostgreSQL service

### 4. Environment Variables (Backend)

ไปที่ backend service → **Variables** → เพิ่ม:

```env
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-app.vercel.app
LOG_LEVEL=info
```

> **หมายเหตุ:** `DATABASE_URL` มาจาก Railway PostgreSQL service อัตโนมัติ ไม่ต้องใส่เอง

### 5. Deploy

Railway deploy อัตโนมัติทุกครั้งที่ push to main branch

หลัง deploy สำเร็จ copy URL ของ backend เช่น `https://scoreboard-backend.up.railway.app`

---

## Frontend → Vercel

### 1. สร้าง Project บน Vercel

1. ไปที่ [vercel.com](https://vercel.com) → **Add New Project** → import repo นี้
2. ตั้งค่า **Framework Preset**: Next.js

### 2. ตั้งค่า Monorepo

ใน Vercel project settings → **General**:

| Setting | Value |
| --- | --- |
| **Root Directory** | `apps/frontend` |
| **Build Command** | `next build` |
| **Output Directory** | `.next` |

> **สำคัญ:** ต้องตั้ง Root Directory เป็น `apps/frontend` เพื่อให้ Vercel build ถูก package

### 3. Environment Variables (Frontend)

ไปที่ **Settings → Environment Variables** → เพิ่ม:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend.up.railway.app
```

> แทนที่ URL ด้วย Railway backend URL จากขั้นตอนที่แล้ว

### 4. ปิด Standalone Output สำหรับ Vercel

`output: 'standalone'` ใน `next.config.js` ใช้สำหรับ Docker เท่านั้น Vercel ไม่ต้องการ

แก้ไข `apps/frontend/next.config.js` ให้ toggle ตาม environment:

```js
const nextConfig = {
  ...(process.env.DOCKER_BUILD === 'true' && {
    output: 'standalone',
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
  }),
}

module.exports = nextConfig
```

แล้วเพิ่ม build arg ใน `docker-compose.yml`:

```yaml
args:
  DOCKER_BUILD: 'true'
```

### 5. Deploy

Vercel deploy อัตโนมัติทุกครั้งที่ push to main branch

---

## Environment Variables Reference

### Backend (`.env` / Railway Variables)

| Variable | Required | Description | Example |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `PORT` | | Server port (default: 4000) | `4000` |
| `NODE_ENV` | | Environment | `production` |
| `FRONTEND_URL` | | Frontend origin สำหรับ CORS | `https://your-app.vercel.app` |
| `LOG_LEVEL` | | Log verbosity | `info` |

### Frontend (`.env.local` / Vercel Variables)

| Variable | Required | Description | Example |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_BACKEND_URL` | ✅ | Backend URL | `https://your-backend.up.railway.app` |

---

## Project Structure

```text
.
├── apps/
│   ├── backend/           # Elysia + Bun API server
│   │   ├── src/
│   │   │   ├── routes/    # REST API routes
│   │   │   ├── socket/    # Socket.IO handlers
│   │   │   └── lib/       # broadcaster, prisma, logger
│   │   └── prisma/        # schema, migrations, seed
│   └── frontend/          # Next.js app
│       ├── app/
│       │   ├── admin/     # Admin panel
│       │   └── display/   # Public scoreboard
│       ├── components/
│       └── lib/           # useScoreboard, socket, api
└── packages/
    └── shared/            # Shared constants (SOCKET_EVENTS, TEAM_COLORS)
```
