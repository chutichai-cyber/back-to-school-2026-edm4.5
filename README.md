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

## Local Development

### วิธีที่ 1 — Docker (Full Stack)

รัน frontend + backend + postgres ด้วย Docker ทั้งหมด

**Prerequisites:** Docker Desktop

```bash
cp .env.example .env
docker compose up --build
```

| Service | URL |
| --- | --- |
| Admin panel | <http://localhost:3000/admin> |
| Scoreboard display | <http://localhost:3000/display> |
| Backend API | <http://localhost:4000> |

**Seed ข้อมูลเริ่มต้น** (รันหลัง `docker compose up` แล้ว backend พร้อม):

```bash
docker exec scoreboard-backend bun prisma/seed.js
# หรือ
pnpm docker:seed
```

Seed จะสร้าง: event, ทีม ป. 3/1–3/8, เกมส์ "กีฬาสี", และ admin accounts:

| Username | Password | Role |
| --- | --- | --- |
| `superadmin` | `Admin@1234` | SUPER_ADMIN |
| `admin` | `Admin@1234` | ADMIN |

> **หมายเหตุ:** seed รีเซ็ตข้อมูลทั้งหมด (ทีม, เกมส์, scores) แล้วสร้างใหม่ — admin accounts จะไม่ถูกแตะ

**Reset ฐานข้อมูลทั้งหมด** (ลบ volume ด้วย):

```bash
docker compose down -v
docker compose up --build
docker exec scoreboard-backend bun prisma/seed.js
```

---

### วิธีที่ 2 — Hot-reload (แนะนำสำหรับ development)

รัน postgres ใน Docker แต่รัน backend/frontend โดยตรงเพื่อรับ hot-reload

**Prerequisites:**

- Docker Desktop
- [Bun](https://bun.sh) — `curl -fsSL https://bun.sh/install | bash`
- Node.js 18+
- pnpm — `npm install -g pnpm`

```bash
# 1. ติดตั้ง dependencies
pnpm install

# 2. ตั้งค่า environment
cp .env.example .env
# แก้ไข .env ตามต้องการ

# 3. สร้าง .env สำหรับ backend (Prisma อ่านจาก apps/backend/.env)
cp .env apps/backend/.env

# 4. เปิด PostgreSQL
pnpm dev:db

# 5. Push schema และ seed ข้อมูล (ครั้งแรก)
pnpm --filter @scoreboard/backend db:push
pnpm db:seed

# 6. รัน backend + frontend พร้อมกัน
pnpm dev
```

| Service | URL |
| --- | --- |
| Admin panel | <http://localhost:3000/admin> |
| Scoreboard display | <http://localhost:3000/display> |
| Backend API | <http://localhost:4000> |

```bash
# ปิด postgres เมื่อเลิกทำงาน
pnpm dev:db:down
```

---

## Scripts Reference

```bash
pnpm dev              # รัน backend + frontend พร้อมกัน (hot-reload)
pnpm dev:backend      # รันเฉพาะ backend
pnpm dev:frontend     # รันเฉพาะ frontend
pnpm dev:db           # เปิด PostgreSQL ใน Docker (background)
pnpm dev:db:down      # ปิด PostgreSQL

pnpm docker:up        # build + รัน full stack ด้วย Docker
pnpm docker:seed      # seed ข้อมูล (reset + สร้างใหม่)
pnpm docker:down      # หยุด containers
pnpm docker:clean     # หยุด + ลบ volumes ทั้งหมด

pnpm db:seed          # seed ข้อมูล (สำหรับ local dev ไม่ใช้ Docker)
```

---

## Production Deployment (Railway)

ทั้ง frontend และ backend deploy บน Railway โดยใช้ `railway.toml` ที่อยู่ใน directory ของแต่ละ service

### 1. สร้าง Project บน Railway

ไปที่ [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**

### 2. เพิ่ม PostgreSQL

คลิก **+ New** → **Database** → **Add PostgreSQL**

Railway จะสร้าง `DATABASE_URL` ให้อัตโนมัติ

### 3. สร้าง Backend Service

1. **+ New** → **GitHub Repo** → เลือก repo นี้
1. ตั้งค่าใน service **Settings**:

| Setting | Value |
| --- | --- |
| **Root Directory** | `apps/backend` |

Railway จะอ่าน `apps/backend/railway.toml` และใช้ `apps/backend/Dockerfile` อัตโนมัติ

1. ตั้ง **Environment Variables**:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Reference จาก PostgreSQL service |
| `FRONTEND_URL` | URL ของ frontend service (ตั้งทีหลังได้) |

### 4. สร้าง Frontend Service

1. **+ New** → **GitHub Repo** → เลือก repo นี้ (service ใหม่ในโปรเจคเดียวกัน)
1. ตั้งค่าใน service **Settings**:

| Setting | Value |
| --- | --- |
| **Root Directory** | `apps/frontend` |

Railway จะอ่าน `apps/frontend/railway.toml` และใช้ `apps/frontend/Dockerfile` อัตโนมัติ

1. ตั้ง **Environment Variables**:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_BACKEND_URL` | URL ของ backend service เช่น `https://xxx.up.railway.app` |

> **สำคัญ:** `NEXT_PUBLIC_BACKEND_URL` ถูก bake เข้าไปใน Next.js build ดังนั้น railway.toml จะส่งเป็น Docker build argument อัตโนมัติ — ต้องตั้งค่าก่อน deploy

### 5. Seed ข้อมูลบน Railway

หลัง deploy backend สำเร็จแล้ว ให้ใช้ Railway CLI:

```bash
railway run --service <backend-service-name> bun prisma/seed.js
```

หรือเปิด **Shell** ใน Railway dashboard แล้วรัน:

```bash
bun prisma/seed.js
```

### 6. อัปเดต FRONTEND_URL ในตัวแปร Backend

หลังจากได้ URL ของ frontend แล้ว กลับมาแก้ `FRONTEND_URL` ใน backend service ให้ตรงกัน

---

## Environment Variables Reference

### `.env` (root — สำหรับ Docker Compose)

| Variable | Default | Description |
| --- | --- | --- |
| `POSTGRES_USER` | `scoreboard` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `scoreboard_pass` | PostgreSQL password |
| `POSTGRES_DB` | `scoreboard_db` | PostgreSQL database name |
| `DATABASE_URL` | `postgresql://...@localhost:5432/scoreboard_db` | Connection string สำหรับ local dev |
| `FRONTEND_URL` | `http://localhost:3000` | Origin สำหรับ CORS |
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:4000` | Backend URL (baked ตอน build) |
| `LOG_LEVEL` | `info` | Log verbosity |

### Railway Variables

| Service | Variable | Description |
| --- | --- | --- |
| Backend | `DATABASE_URL` | Reference จาก PostgreSQL plugin |
| Backend | `FRONTEND_URL` | URL ของ frontend service |
| Frontend | `NEXT_PUBLIC_BACKEND_URL` | URL ของ backend service |

---

## Project Structure

```text
.
├── apps/
│   ├── backend/                # Elysia + Bun API server
│   │   ├── src/
│   │   │   ├── routes/         # REST API routes
│   │   │   ├── socket/         # Socket.IO handlers
│   │   │   └── lib/            # broadcaster, prisma, logger
│   │   ├── prisma/             # schema, seed
│   │   ├── Dockerfile
│   │   └── railway.toml        # Railway deployment config
│   └── frontend/               # Next.js app
│       ├── app/
│       │   ├── admin/          # Admin panel
│       │   └── display/        # Public scoreboard
│       ├── components/
│       ├── lib/                # useScoreboard, socket, api
│       ├── Dockerfile
│       └── railway.toml        # Railway deployment config
├── packages/
│   └── shared/                 # Shared constants (SOCKET_EVENTS)
├── docker-compose.yml          # Full stack + seed service
├── docker-compose.dev.yml      # PostgreSQL only (สำหรับ hot-reload dev)
└── .env.example
```
