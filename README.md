# 🚀 HRIS Dexa Group - Employee WFH Attendance & HRD Monitoring System

> Technical Test Fullstack Developer @ Dexa Group (AGENT.md compliant v2)

✅ **Prisma ORM + Docker (PostgreSQL + PostgreSQL Audit + RabbitMQ)** ✅

***

## 🎯 Arsitektur (sesuai requirement)

```
📦 Project Monorepo
├── 🐳 docker-compose.yml            : Postgres Main + Postgres Audit + RabbitMQ
├── backend/                          NestJS + Prisma + Socket.io + RabbitMQ
│   └── prisma/
│       ├── schema.prisma             Main datasource PostgreSQL 5432  (hris_main)
│       └── audit-schema.prisma       SEPARATE Audit DB  PostgreSQL 5433 (hris_audit)
├── frontend/employee-web/            React 18 + Vite + MUI Material UI (Dexa Red #B71C1C)
└── frontend/admin-web/               React 18 + Vite + MUI Material UI (HRD / Admin portal)
```

### Separate Concerns (AGENT §18):

### Event Bus Flow:

```
Employee PUT /employees/me (update profile)
    → MessageQueueService.publish(employee.profile.updated)
      → EventEmitter (Socket.io admin notif realtime)
      → PrismaAuditService direct write → ChangeLog hris_audit DB
      → RabbitMQ publish topic exchange → queue hris.events durable → consumer audit process (backup/async) → ChangeLog insert
```

***

## 🚀 Quickstart: 1 command run docker + backend

### Step 1: Jalankan semua database + message queue via Docker

```bash
cd hris/
cp .env.example .env        # (optional - backend/.env sudah include default)
docker compose up -d        # wait until all containers healthy (~30s)
```

Container Health: `postgres main ✔ | postgres audit ✔ | rabbitmq ✔`

### Step 2: Prisma generate + DB push + Seed (hanya sekali)

```bash
cd backend/
cp ../.env.example .env     # (jika belum ada)
npm run prisma:generate     # generate 2 Prisma clients (main + audit)
npm run prisma:push         # push schemas ke 2 Postgres databases
npm run seed                # 1 HRD + 5 Employees + 100 Attendance rows + audit seed row
```

### Step 3: Start backend

```bash
cd backend/
npm run start:prod          # NestJS Production build (http://localhost:3000)
# Dev: npm run start:dev
```

### Step 4: Start frontends (2 terminal)

```bash
# Employee Portal (Material UI Blue/Red theme)
cd frontend/employee-web
npm install
npm run dev                 # http://localhost:5173
```

```bash
# HRD Admin Portal
cd frontend/admin-web
npm install
npm run dev                 # http://localhost:5174
```

***

## 🌐 Akses Aplikasi (lokal)

| Komponen                 | URL                           | Catatan                                           |
| ------------------------ | ----------------------------- | ------------------------------------------------- |
| **Employee WFH Portal**  | <http://localhost:5173>       | Material UI Bottom Navigation mobile-first        |
| **HRD Admin Monitoring** | <http://localhost:5174>       | Material UI permanent/temporary drawer responsive |
| **NestJS Backend API**   | <http://localhost:3000>       | JWT Bearer Auth                                   |
| **Swagger API Docs**     | <http://localhost:3000/api>   | Try-It interactive endpoint tester                |
| **RabbitMQ Management**  | <http://localhost:15672>      | user: `hris` / pass: `hris-dev-password-2026`     |
| **Postgres Main**        | localhost:5432 db:hris\_main  | user `dexa` pass `dexa-dev-password-2026`         |
| **Postgres Audit**       | localhost:5433 db:hris\_audit | user `dexa_audit` pass `dexa-audit-password-2026` |

***

## 🔑 Demo Credentials (Seed Data)

| Role                 | Email                          | Password    |
| -------------------- | ------------------------------ | ----------- |
| 👔 **HRD / Admin**   | <admin@dexa-group.com>         | admin123    |
| 👨‍💻 Employee Budi  | <budi.santoso@dexa-group.com>  | employee123 |
| 👩‍💼 Employee Siti  | <siti.rahayu@dexa-group.com>   | employee123 |
| 👨‍💻 Employee Ahmad | <ahmad.fauzi@dexa-group.com>   | employee123 |
| 👩‍🔬 Employee Dewi  | <dewi.lestari@dexa-group.com>  | employee123 |
| 👨‍💻 Employee Rizki | <rizki.pratama@dexa-group.com> | employee123 |

***

## 📋 API Endpoints (sesuai AGENT §14)

### 🔐 Auth

| Method | Path          | Access | Keterangan                           |
| ------ | ------------- | ------ | ------------------------------------ |
| POST   | `/auth/login` | Public | return `access_token` + user profile |
| GET    | `/auth/me`    | All    | return current user dari JWT         |

### 🧑 Employee — Employee Portal

| Method | Path                       | Access                                                             |
| ------ | -------------------------- | ------------------------------------------------------------------ |
| GET    | `/employees/me`            | Current                                                            |
| PUT    | `/employees/me`            | Current → Mengirim notifikasi Socket + Audit log + Rabbit event 🔥 |
| POST   | `/attendance/me/check-in`  | Current → Audit + Rabbit notif 🔥                                  |
| POST   | `/attendance/me/check-out` | Current                                                            |
| GET    | `/attendance/me/today`     | Current                                                            |
| GET    | `/attendance/me?from=&to=` | Current → default awal bulan s/d hari ini                          |

### 💼 HRD — Admin Portal (role `HRD`)

| Method | Path                                      | Access                               |
| ------ | ----------------------------------------- | ------------------------------------ |
| GET    | `/admin/employees`                        | HRD only                             |
| POST   | `/admin/employees`                        | HRD only                             |
| GET    | `/admin/employees/:id`                    | HRD only                             |
| PUT    | `/admin/employees/:id`                    | HRD only → Trigger audit & notif HRD |
| GET    | `/admin/attendance?from=&to=&employeeId=` | HRD only READ-ONLY                   |

***

## 🧰 Tech Stack Detail

### Backend

### Frontend (dua aplikasi terpisah)

***

## 🧪 E2E Smoke Test Passed (✅ semua verified)

| #  | Test                                                                  | Status                       |
| -- | --------------------------------------------------------------------- | ---------------------------- |
| 1  | Docker compose up: Postgres Main 5432 Healthy                         | ✅                            |
| 2  | Docker compose up: Postgres Audit 5433 Healthy                        | ✅                            |
| 3  | Docker compose up: RabbitMQ 5672 + 15672 Healthy                      | ✅                            |
| 4  | Prisma db push main schema `schema.prisma`                            | ✅ sync with Postgres         |
| 5  | Prisma db push audit schema `audit-schema.prisma`                     | ✅ separate DB                |
| 6  | Seed: 1 HRD + 5 Employee + 100 Attendance rows + 1 audit seed         | ✅                            |
| 7  | NestJS build `nest build` (no TS error)                               | ✅ exit 0                     |
| 8  | Backend bootstrap, RabbitMQService connect log OK                     | ✅                            |
| 9  | POST `/auth/login` EMPLOYEE JWT role `EMPLOYEE`                       | ✅                            |
| 10 | POST `/auth/login` HRD JWT role `HRD`                                 | ✅                            |
| 11 | GET `/admin/employees` → 6 rows                                       | ✅                            |
| 12 | GET `/admin/attendance` → total rows 10, masuk/pulang 10/10           | ✅                            |
| 13 | PUT `/employees/me` change phone                                      | ✅ phone di-update            |
| 14 | **Audit DB** ChangeLog new row event=`employee.profile.updated`       | ✅                            |
| 15 | **RabbitMQ** queue `hris.events` new 1+ messages after profile update | ✅                            |
| 16 | Attendance check-in / prevent duplicate check-in                      | ✅ "already checked in today" |
| 17 | Attendance `/me` default awal bulan → 2+ rows history                 | ✅                            |
| 18 | Socket.io NotificationGateway subscribe ping/pong                     | ✅                            |

***

## 📂 File References (Source Code)

### Backend Core

### Employee Frontend (material UI, port 5173)

### HRD Admin Frontend (port 5174)

***

## 🎨 Design System (Dexa Corporate Red)

**Brand Color Primary:**

```
Dexa Deep Corporate Red  #B71C1C  (main/buttons)
Dexa Red 50              #FFEBEE
Dexa Red 100             #FFCDD2
Dexa Red 300             #E57373
Dexa Red 700             #C62828
Dexa Red 900             #861313
Neutral background       #F7F7F8, Paper: #FFFFFF
```

Button: `textTransform: none, fontWeight: 600, borderRadius: 12px` — bukan uppercase default MUI.

***

## 🐳 Docker Ports Summary

| Container Name        | Internal     | Host         | User / Pass                                               |
| --------------------- | ------------ | ------------ | --------------------------------------------------------- |
| `hris-postgres-main`  | 5432         | 5432         | `dexa` / `dexa-dev-password-2026` db `hris_main`          |
| `hris-postgres-audit` | 5432         | 5433         | `dexa_audit` / `dexa-audit-password-2026` db `hris_audit` |
| `hris-rabbitmq`       | 5672 + 15672 | 5672 + 15672 | `hris` / `hris-dev-password-2026`                         |

RabbitMQ Management UI: <http://localhost:15672> → lihat exchanges / queues / messages / consumers.

***

## ♻️ Clean / Reset total environment

```bash
cd hris/
docker compose down -v               # HAPUS semua container DAN VOLUME DATA
# ulangi step 1-4 di atas untuk setup fresh dari awal
cd backend && rm -rf dist && npm run build && npm run prisma:push && npm run seed
```

***

