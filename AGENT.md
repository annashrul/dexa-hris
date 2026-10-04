# AGENT.md

# Dexa Group Fullstack Technical Test — AI Agent Rules

This file defines the working rules for any AI coding agent contributing to this repository.

The agent MUST follow this file before making architectural, implementation, dependency, database, API, or UI decisions.

---

# 1. Primary Goal

Build the **Dexa Group Fullstack Developer Skill Test** application completely, cleanly, and within the intended scope.

The system consists of:

1. **Employee WFH Attendance Web Application**
2. **HRD / Admin Employee Monitoring Web Application**
3. **NestJS backend using REST APIs and a microservices concept**
4. **Main application database**
5. **Message queue / event stream**
6. **Separate logging database**
7. **Admin notification mechanism**

Priority:

> Correctness → Architecture → Maintainability → Completeness → UI polish

Do NOT prioritize visual complexity over required functionality.

---

# 2. Source of Truth

The original Dexa Group technical-test document is the highest-priority source of truth.

If this file conflicts with the original technical-test document:

> FOLLOW THE ORIGINAL TECHNICAL-TEST DOCUMENT.

Do not silently modify, reinterpret, or remove explicit test requirements.

The agent MUST distinguish between:

- `SOURCE REQUIREMENT` — explicitly required by the technical test.
- `ENGINEERING ASSUMPTION` — a reasonable project decision added to make implementation complete.

Never present an engineering assumption as an official Dexa requirement.

---

# 3. Required Technology Stack

## Backend — SOURCE REQUIREMENT

Required:

- JavaScript or TypeScript
- NestJS
- REST API
- Microservices concept

### Project default

Use:

- **TypeScript**
- **NestJS**

Do NOT replace NestJS with another backend framework unless explicitly instructed by the developer.

---

## Frontend — SOURCE REQUIREMENT

Required:

- React.js

### Project default

Use:

- React
- TypeScript
- Vite

Do NOT replace React with Vue, Angular, Svelte, or another frontend framework unless explicitly instructed.

### UI framework default — ENGINEERING ASSUMPTION

Use:

> **Material UI (MUI)**

MUI is the default UI framework for both Employee and HRD applications because this test is an internal/enterprise-style application dominated by forms, tables, dialogs, navigation, alerts, and responsive screens.

Use MUI components before building custom equivalents, especially:

- `AppBar` / `Toolbar`
- `Drawer`
- `Card`
- `TextField`
- `Button`
- `Table`
- `Dialog`
- `Snackbar` / `Alert`
- `Avatar`
- `Menu`
- `CircularProgress` / `Skeleton`

For date-range filtering, `@mui/x-date-pickers` MAY be used if needed. Do not introduce a second general-purpose UI framework.

Do NOT combine MUI with Tailwind as two competing styling systems unless there is an explicit, justified reason. Prefer MUI + `sx` / theme styling for consistency and development speed.

---

# 3A. Required Repository and Project Structure

## Architecture Decision — ENGINEERING ASSUMPTION

Use a **single Git repository** containing:

- one NestJS backend workspace
- two React frontend applications
- local infrastructure configuration

The repository SHOULD follow this high-level structure:

```text
dexa-fullstack-test/
├── AGENTS.md
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
│
├── backend/
│   ├── package.json
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── apps/
│   │   ├── core-api/
│   │   │   └── src/
│   │   │       ├── main.ts
│   │   │       └── app.module.ts
│   │   │
│   │   └── audit-service/
│   │       └── src/
│   │           ├── main.ts
│   │           └── app.module.ts
│   │
│   ├── libs/
│   │   ├── auth/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── messaging/
│   │   ├── notifications/
│   │   ├── database/
│   │   └── common/
│   │
│   └── test/
│
├── frontend/
│   ├── employee-web/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── app/
│   │       ├── api/
│   │       ├── components/
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   ├── profile/
│   │       │   └── attendance/
│   │       ├── layouts/
│   │       ├── pages/
│   │       ├── routes/
│   │       ├── hooks/
│   │       ├── types/
│   │       ├── utils/
│   │       ├── theme/
│   │       ├── main.tsx
│   │       └── App.tsx
│   │
│   └── admin-web/
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
│           ├── app/
│           ├── api/
│           ├── components/
│           ├── features/
│           │   ├── auth/
│           │   ├── employees/
│           │   ├── attendance/
│           │   └── notifications/
│           ├── layouts/
│           ├── pages/
│           ├── routes/
│           ├── hooks/
│           ├── types/
│           ├── utils/
│           ├── theme/
│           ├── main.tsx
│           └── App.tsx
│
└── infrastructure/
    ├── postgres/
    └── rabbitmq/
```

The exact filenames may evolve, but the domain boundaries MUST remain clear.

## Backend Deployable Apps

Use two backend deployable applications by default.

### `core-api`

Responsibilities:

- expose REST APIs consumed by both frontends
- authentication and authorization
- employee profile and HRD employee management
- attendance commands and queries
- publish employee-profile-change events to RabbitMQ
- expose WebSocket notifications to the HRD application
- persist transactional application data to the primary PostgreSQL database

### `audit-service`

Responsibilities:

- run as a separate NestJS process/application
- consume profile-change events from RabbitMQ
- validate/normalize audit events
- persist audit events into the separate audit PostgreSQL database

This is the minimum recommended microservice boundary for this test.

Do NOT split Auth, Employee, and Attendance into independent network services unless the developer explicitly requests that complexity. For a 3–5 day test, clear NestJS library/module boundaries inside `core-api` plus a genuinely separate asynchronous `audit-service` provide a better tradeoff between architectural demonstration and completion risk.

## Backend Library Structure

### `libs/auth`

Contains:

- login use case
- JWT strategy/guard
- role guard/decorator
- password hashing helpers
- authentication DTOs

### `libs/employees`

Contains:

- employee entity/model
- profile queries
- employee create/update logic
- profile update logic
- employee DTOs
- employee repository/service

### `libs/attendance`

Contains:

- check-in/check-out business logic
- attendance summary queries
- date-range filtering
- attendance DTOs
- attendance repository/service

### `libs/messaging`

Contains:

- RabbitMQ configuration
- event contracts
- event publisher
- queue names/routing keys

### `libs/notifications`

Contains:

- WebSocket gateway
- HRD notification payloads
- notification service

### `libs/database`

Contains:

- primary database configuration
- audit database configuration where shared setup is appropriate
- TypeORM datasource/module configuration
- migrations configuration

### `libs/common`

Contains only cross-domain utilities such as:

- base exceptions
- request user types
- decorators
- constants
- shared guards/interceptors

Do NOT turn `common` into a dumping ground for domain business logic.

## ORM Default — ENGINEERING ASSUMPTION

Use:

> **TypeORM + PostgreSQL**

Reason:

- integrates directly with NestJS
- supports migrations and relational constraints
- suitable for Employee ↔ Attendance relationships
- makes separate primary/audit database connections straightforward

If the repository already uses Prisma or another appropriate ORM, do not rewrite it solely to comply with this default.

## Frontend Application Decision

Use **two separate Vite React applications** by default:

```text
frontend/employee-web
frontend/admin-web
```

This makes the two application contexts required by the test obvious to the reviewer and prevents HRD navigation/components from becoming mixed with the employee experience.

Both applications consume the same `core-api` REST backend.

### `employee-web` responsibility

Routes should approximately be:

```text
/login
/profile
/attendance
/attendance-summary
```

Suggested page ownership:

```text
pages/
├── LoginPage.tsx
├── ProfilePage.tsx
├── AttendancePage.tsx
└── AttendanceSummaryPage.tsx
```

### `admin-web` responsibility

Routes should approximately be:

```text
/login
/dashboard
/employees
/employees/new
/employees/:id/edit
/attendance
```

Suggested page ownership:

```text
pages/
├── LoginPage.tsx
├── DashboardPage.tsx
├── EmployeesPage.tsx
├── EmployeeFormPage.tsx
└── AttendanceMonitoringPage.tsx
```

## Frontend Feature Structure

Do not build pages as giant files. Group domain-specific logic in `features`.

Example:

```text
features/profile/
├── api/
│   └── profile.api.ts
├── components/
│   ├── ProfileCard.tsx
│   └── ProfileEditDialog.tsx
├── hooks/
│   └── useProfile.ts
├── types.ts
└── validation.ts
```

Use the same pattern for attendance and employee management when the feature becomes large enough to justify it.

## Frontend Supporting Libraries

Default choices:

```yaml
routing: React Router
ui: Material UI (MUI)
server_state: TanStack Query
forms: React Hook Form
validation: Zod or simple typed validation
http: Axios or Fetch wrapper
```

Do not add libraries merely because they appear in this list. Use them when they reduce implementation complexity.

## MUI Layout Rules

### Employee Web

Prefer a lightweight responsive application shell:

```text
Mobile:   top AppBar + bottom navigation or compact menu
Desktop:  AppBar + optional small navigation drawer
```

Employee pages should feel simple and task-focused.

### HRD Web

Prefer an admin shell:

```text
AppBar
+
responsive Drawer / sidebar
+
main content area
```

Use MUI `Table` for employee and attendance lists. Use `Dialog` for confirmations and `Snackbar` / `Alert` for profile-change notifications and operation feedback.

Do not build a chart-heavy dashboard unless all mandatory features are already complete.

## Project Dependency Direction

Keep dependency flow simple:

```text
Employee Web ───────┐
                    ├──REST──> Core API ─────> Primary PostgreSQL
Admin Web ──────────┘              │
                                   ├──WebSocket──> Admin Web
                                   │
                                   └──RabbitMQ──> Audit Service ──> Audit PostgreSQL
```

Frontends must never connect directly to PostgreSQL or RabbitMQ.

The audit service must not become the primary source for employee or attendance data.

---

## Database — SOURCE REQUIREMENT

Choose ONE supported primary database:

- MySQL
- Oracle
- MongoDB
- SQL Server
- PostgreSQL

### Project default — ENGINEERING ASSUMPTION

Unless the repository already uses another allowed database:

> Use **PostgreSQL**.

Do not introduce multiple primary data stores without a clear need.

---

# 4. Messaging and Notifications

## Message Queue / Data Stream — SOURCE REQUIREMENT

Employee-data changes must generate a data stream/message-queue event for logging into a separate database.

The source mentions examples such as:

- Kafka
- RabbitMQ
- AWS SQS
- GCP Pub/Sub

### Project default — ENGINEERING ASSUMPTION

Use:

> **RabbitMQ**

unless the existing repository already uses another allowed technology.

Do NOT add Kafka only to make the architecture look more complex.

---

## Admin Notification — SOURCE REQUIREMENT

When employee data changes, the admin page must receive a popup/alert notification.

The source mentions Firebase as an example, but technology choice is flexible.

### Project default — ENGINEERING ASSUMPTION

Prefer:

> **NestJS WebSocket / Socket.IO**

unless Firebase is already configured.

The notification must actually work. Do not fake it with static UI data.

---

# 5. Application Contexts

The system contains two user-facing contexts.

## Employee Application — SOURCE REQUIREMENT

Required menus/features:

1. Employee Profile
2. Attendance
3. Attendance Summary

## HRD / Admin Application — SOURCE REQUIREMENT

Required features:

1. Add employee
2. Update employee
3. View attendance submitted by all employees
4. Attendance monitoring is read-only

The implementation MAY use:

- two separate React apps, or
- one React app with clearly separated role-based routes.

Do not create unnecessary frontend applications if a single clean React app can satisfy the requirements.

---

# 6. Authentication Rules

## SOURCE REQUIREMENT

Employees log in using:

- company email
- password

## ENGINEERING RULES

- Never store plaintext passwords.
- Hash passwords securely.
- Use JWT or another reasonable stateless authentication method.
- Authentication logic belongs in the backend.
- Protect authenticated endpoints.
- Protect HRD-only endpoints with role-based authorization.

Minimum roles:

```text
EMPLOYEE
HRD
```

Never trust authorization data supplied only by the frontend.

---

# 7. Employee Profile Requirements

## SOURCE REQUIREMENT

Display:

- Name
- Company email
- Employee photo
- Position
- Phone number

Employee may update:

- Photo
- Phone number
- Password

Do not allow employee self-service editing of the following unless explicitly instructed:

- Name
- Company email
- Position

---

# 8. Employee Profile Change Flow

This is a **high-priority requirement**.

Whenever an employee updates editable profile data:

1. Validate the request.
2. Persist the valid change to the main application database.
3. Publish a profile-change event.
4. Send/expose an admin notification.
5. Send the event through the selected message queue/data stream.
6. Consume it using an audit/logging consumer.
7. Persist the event into a separate logging database.

Expected conceptual flow:

```text
Employee React App
        |
        | PUT /employees/me
        v
Employee Service
        |
        +------> Main Database
        |
        +------> EmployeeProfileUpdated event
                        |
                        v
                    RabbitMQ
                     /     \
                    /       \
                   v         v
          Audit Consumer   Notification Flow
               |                |
               v                v
        Logging Database     HRD Admin UI
```

Do NOT fake the queue by directly writing the audit record from the profile update controller.

The asynchronous event must genuinely pass through the configured message broker.

---

# 9. Profile Event Contract

Use a structured event.

Suggested shape:

```json
{
  "eventName": "employee.profile.updated",
  "employeeId": "uuid",
  "changedFields": ["phoneNumber"],
  "occurredAt": "ISO-8601 timestamp"
}
```

Never publish or log:

- plaintext passwords
- password hashes
- JWT/access tokens
- secrets

If a password changes, record only that the password field changed.

---

# 10. Attendance Requirements

## SOURCE REQUIREMENT

Employees can submit:

- `MASUK`
- `PULANG`

Each attendance record must capture:

- date
- time
- status

Suggested model:

```text
Attendance
- id
- employeeId
- date
- time
- status
- createdAt
```

Prefer an enum/constraint for status values.

---

# 11. Attendance Business Rules

The source does NOT explicitly define duplicate-attendance behavior.

Therefore, the following are **ENGINEERING ASSUMPTIONS**:

- prevent duplicate `MASUK` for the same employee on the same day
- prevent duplicate `PULANG` for the same employee on the same day
- optionally reject `PULANG` when no `MASUK` exists for that day

If implemented, document these assumptions in `README.md`.

Do not describe them as original Dexa requirements.

---

# 12. Attendance Summary

## SOURCE REQUIREMENT

Employees can view attendance summary.

Default range:

> Beginning of current month → today

Employee can filter by date range:

```text
From Date
To Date
```

Backend should support date filtering, for example:

```http
GET /attendance/me?from=2026-10-01&to=2026-10-31
```

Do not retrieve all attendance history and perform all filtering only in the browser.

---

# 13. HRD Rules

## Employee Management — SOURCE REQUIREMENT

HRD can:

- add employee
- update employee

## Attendance Monitoring — SOURCE REQUIREMENT

HRD can:

- view attendance from all employees

Attendance monitoring must be:

> **READ ONLY**

Do NOT add HRD attendance edit/delete actions unless explicitly requested.

---

# 14. API Design Rules

Use RESTful conventions.

Recommended endpoints:

```text
POST /auth/login

GET  /employees/me
PUT  /employees/me

GET  /admin/employees
POST /admin/employees
GET  /admin/employees/:id
PUT  /admin/employees/:id

POST /attendance/me/check-in
POST /attendance/me/check-out
GET  /attendance/me

GET  /admin/attendance
```

Exact naming may differ if the repository already has a consistent convention.

Rules:

- Controllers stay thin.
- Business logic belongs in services/use-cases.
- Database access should not be scattered through controllers.
- Validate request payloads.
- Use appropriate HTTP status codes.
- Return useful but safe error messages.
- Centralize common exception handling where practical.

---

# 15. Validation

All external input must be validated.

Examples:

- email
- password
- phone number
- date range
- employee ID
- attendance action
- uploaded image type and size

For NestJS, prefer:

> DTOs + `class-validator`

or an equivalent consistent approach.

Never rely on frontend validation alone.

---

# 16. Suggested Backend Boundaries

Recommended module structure:

```text
src/
  auth/
  employees/
  attendance/
  notifications/
  messaging/
  audit/
  common/
```

If multiple NestJS apps/services are used, conceptual responsibilities may include:

```text
Main API / API Gateway
Auth Service
Employee Service
Attendance Service
Audit / Logging Service
```

Do NOT create extra network services purely to increase the number of microservices.

The project must remain understandable and runnable within the technical-test time window.

---

# 17. Microservices Rule

## SOURCE REQUIREMENT

The original test explicitly requires a **microservices concept** and REST APIs that can be consumed by both applications.

Therefore:

- do not build an unstructured monolith
- separate domain responsibilities
- demonstrate asynchronous message-driven logging
- document service/module boundaries

At minimum, the solution should clearly demonstrate:

```text
REST application API
+
asynchronous message-queue logging flow
```

If multiple deployable services are used, keep local startup simple.

---

# 18. Main Database vs Logging Database

## SOURCE REQUIREMENT

Logging generated by the message queue must go to a **separate database**.

Do not treat an `audit_logs` table in the exact same logical application database as sufficient unless the developer explicitly approves that interpretation.

Preferred local design:

```text
PostgreSQL
├── application database
└── audit/logging database
```

or separate PostgreSQL instances.

Document the chosen separation in `README.md`.

---

# 19. Suggested Data Model

Possible entities:

```text
User
Employee
Attendance
AuditLog
```

Possible relationship:

```text
User 1 -------- 1 Employee
Employee 1 ---- N Attendance
```

`AuditLog` belongs in the separate logging database.

Use where appropriate:

- primary keys
- foreign keys
- unique constraints
- indexes
- timestamps

At minimum:

```text
users.email UNIQUE
```

---

# 20. File Upload Rules

For employee photo updates:

- validate MIME type
- enforce a reasonable size limit
- never trust original file name blindly
- store a file reference/path/URL in the employee record

Local file storage is acceptable for this technical test if documented.

Cloud object storage is not required by the source.

---

# 21. Frontend Architecture Rules

Use reusable components.

Suggested organization:

```text
src/
  components/
  pages/
  layouts/
  services/
  hooks/
  contexts/
  routes/
  types/
```

Keep API access in a dedicated layer.

Example:

```text
services/auth.ts
services/employees.ts
services/attendance.ts
```

Do not put all screens, state, and HTTP logic into one large component.

---

# 22. Required Frontend Screens

## Employee

Minimum:

```text
Login
Profile
Attendance
Attendance Summary
```

## HRD

Minimum:

```text
Login
Admin Home / Dashboard
Employee List
Employee Create/Edit
Attendance Monitoring
```

Optional pages must not delay mandatory features.

---

# 23. Responsive Design

## SOURCE REQUIREMENT

The employee application must work in both laptop and mobile browsers.

Therefore:

- required employee screens must be responsive
- HRD screens should remain usable on common viewport sizes
- avoid fixed-width layouts that break on mobile
- tables should become scrollable or adapt gracefully

### Project default — ENGINEERING ASSUMPTION

Use:

> **Material UI (MUI)**

MUI is the single general-purpose UI framework for this project. Use the shared MUI theme in each frontend for spacing, typography, breakpoints, component variants, and consistent feedback states.

Do not add Tailwind, Bootstrap, Ant Design, or another competing general-purpose UI framework unless explicitly requested.

---

# 24. UI Priority

UI should be:

- clean
- readable
- consistent
- responsive
- recruiter-friendly

UI does NOT need:

- heavy animation
- elaborate effects
- excessive charts
- unnecessary landing pages
- decorative features that delay core implementation

Mandatory functionality comes before polish.

---

# 25. State Management

Do not add Redux automatically.

Use the simplest appropriate option:

- React state
- Context
- TanStack Query

Redux is allowed only when application complexity genuinely justifies it.

---

# 26. Error Handling

Frontend must handle:

- loading states
- empty states
- validation errors
- unauthorized access
- backend failures

Backend must handle:

- invalid credentials
- validation failures
- missing resources
- duplicate data
- unauthorized access
- forbidden operations
- message-broker failure where relevant

Never expose stack traces or sensitive internal values to end users.

---

# 27. Security Rules

Never:

- commit `.env`
- hardcode real secrets
- store plaintext passwords
- log passwords
- log access tokens
- expose DB credentials to the browser
- trust frontend authorization

Use environment variables.

Provide:

```text
.env.example
```

with placeholders only.

---

# 28. Recommended Environment Variables

```text
DATABASE_URL=
AUDIT_DATABASE_URL=

JWT_SECRET=
JWT_EXPIRES_IN=

RABBITMQ_URL=

FRONTEND_URL=
ADMIN_FRONTEND_URL=

PORT=
```

Document additional variables when introduced.

---

# 29. Local Development

The project must be easy for a reviewer to start.

### Preferred infrastructure — ENGINEERING ASSUMPTION

Use Docker Compose for infrastructure such as:

```text
postgres
postgres-audit
rabbitmq
```

Backend/frontends may also be containerized if doing so simplifies startup.

Do not make local development harder just to containerize everything.

---

# 30. Docker Rules

If Docker is added:

- provide working Dockerfiles where needed
- provide `docker-compose.yml`
- expose clear ports
- use health checks where useful
- avoid machine-specific paths

A reviewer should be able to understand startup steps quickly.

---

# 31. Code Quality

Write code as if it will be reviewed in a technical interview.

Required principles:

- clear naming
- small focused functions
- no duplicated business logic
- predictable folder structure
- separation of concerns
- typed interfaces where practical
- consistent formatting
- no large commented-out code blocks

Do not generate code merely to increase line count.

---

# 32. TypeScript Rules

Prefer strict typing.

Avoid `any` unless unavoidable.

Define types/interfaces for:

- request payloads
- responses
- database entities/models
- events
- authentication claims

Do not suppress TypeScript errors without a clear reason.

---

# 33. Testing

Testing is not explicitly required by the source document.

However, meaningful tests are encouraged for critical logic.

Prioritize:

1. authentication
2. attendance validation
3. profile update
4. message publishing/consumption
5. date-range filtering

Do not delay mandatory functionality solely to maximize test coverage.

---

# 34. Documentation

Final repository should contain:

```text
README.md
.env.example
AGENTS.md
```

`README.md` should explain:

- project overview
- architecture
- technology stack
- setup
- environment variables
- database setup
- RabbitMQ setup
- backend startup
- frontend startup
- HRD interface startup/access
- API overview
- assumptions
- known limitations

Include a simple architecture diagram when useful.

---

# 35. API Documentation

### Preferred enhancement — ENGINEERING ASSUMPTION

Use Swagger/OpenAPI through NestJS.

Suggested route:

```text
/api/docs
```

Do not manually maintain duplicated API documentation if Swagger is accurate.

---

# 36. Git Rules

Do NOT commit:

```text
node_modules/
dist/
.env
coverage/
real secrets
IDE temp files
```

Use `.gitignore`.

Prefer meaningful commits such as:

```text
feat: add employee profile update flow
feat: add RabbitMQ audit logging
feat: implement attendance summary filter
fix: prevent duplicate daily check-in
docs: add local setup instructions
```

---

# 37. AI Agent Behavior

Every AI agent working on this repository MUST:

1. Read this `AGENTS.md` before coding.
2. Inspect the existing project before changing architecture.
3. Preserve existing working functionality.
4. Modify existing implementations instead of creating duplicate versions.
5. Avoid changing required technology choices.
6. Avoid unrelated dependencies.
7. Keep changes scoped to the current task.
8. Run relevant build/tests/type checks after meaningful changes.
9. Fix errors introduced by its own changes.
10. Update documentation when setup or architecture changes.
11. Never delete working code merely because rewriting it is easier.
12. Never silently relax a source requirement.
13. Never claim a feature is complete without verifying the end-to-end flow.

---

# 38. Do Not Invent Requirements

When the source is ambiguous:

1. choose the simplest reasonable implementation
2. mark it as an engineering assumption
3. document important assumptions
4. avoid expanding scope unnecessarily

If an implementation decision can materially change the test outcome, prefer preserving the literal source requirement.

---

# 39. Do Not Over-Engineer

Do NOT add technologies merely because they are popular.

Avoid unnecessary:

- Kubernetes
- GraphQL
- Redis
- Elasticsearch
- CQRS
- full event sourcing
- service mesh
- complex API gateway products
- multiple message brokers
- multiple state-management libraries
- cloud infrastructure that is not needed for demonstration

unless explicitly required or already necessary in the repository.

The source expects completion in approximately 3–4 days, with 5 days maximum.

---

# 40. Implementation Priority

Unless the current repository state requires another order, implement in this sequence.

## P0 — Mandatory

```text
1. Project structure
2. Main database
3. Authentication + authorization
4. Employee profile
5. HRD employee management
6. Employee attendance
7. Attendance summary + date filtering
8. HRD attendance monitoring
9. Message queue
10. Audit consumer + separate logging database
11. HRD notification
12. Responsive UI
13. Documentation
```

## P1 — Strong Enhancements

```text
Swagger
Docker Compose
Seed data
Meaningful automated tests
Improved loading/error/empty states
```

## P2 — Optional

```text
Charts
Advanced animations
Complex dashboard analytics
Cloud deployment
Advanced observability
```

Never begin P2 while P0 remains incomplete.

---

# 41. Definition of Done

A feature is NOT complete just because its UI exists.

Where applicable, completion means:

```text
UI
+
API
+
validation
+
business logic
+
database persistence
+
authorization
+
error handling
```

For profile update specifically, completion means:

```text
Employee UI
+
REST API
+
main database update
+
message publication
+
message consumption
+
separate audit database
+
HRD notification
```

---

# 42. Acceptance Checklist

## Authentication

- [ ] Employee can log in using company email + password.
- [ ] Invalid credentials are rejected.
- [ ] HRD-only endpoints/routes are protected.

## Employee Profile

- [ ] Name is displayed.
- [ ] Company email is displayed.
- [ ] Photo is displayed.
- [ ] Position is displayed.
- [ ] Phone number is displayed.
- [ ] Employee can update photo.
- [ ] Employee can update phone number.
- [ ] Employee can change password.

## Profile Change Flow

- [ ] Main database is updated.
- [ ] Profile-change event is published.
- [ ] Event passes through RabbitMQ or selected broker.
- [ ] Audit consumer receives the event.
- [ ] Audit event is persisted to a separate logging database.
- [ ] HRD sees a notification.

## Attendance

- [ ] Employee can submit `MASUK`.
- [ ] Employee can submit `PULANG`.
- [ ] Date is recorded.
- [ ] Time is recorded.
- [ ] Status is recorded.
- [ ] Default summary range is start of month through today.
- [ ] Custom date range works.

## HRD

- [ ] HRD can add employees.
- [ ] HRD can update employees.
- [ ] HRD can view attendance from all employees.
- [ ] HRD attendance screen is read-only.

## Architecture

- [ ] Backend uses NestJS.
- [ ] APIs use REST.
- [ ] Microservices concept is demonstrated.
- [ ] Message queue is functional.
- [ ] Logging database is separate.

## Frontend

- [ ] Uses React.js.
- [ ] Required employee pages are responsive.
- [ ] HRD interface is usable.
- [ ] Loading/error/empty states are handled where relevant.

## Repository

- [ ] `.env` is not committed.
- [ ] `.env.example` exists.
- [ ] `README.md` is complete.
- [ ] Setup instructions work.
- [ ] Project build succeeds.
- [ ] No obvious TypeScript errors remain.

---

# 43. Default Implementation Target

Unless existing project code dictates another compatible choice, target:

```yaml
frontend:
  applications:
    - employee-web
    - admin-web
  framework: React
  language: TypeScript
  build_tool: Vite
  ui_framework: Material UI (MUI)
  routing: React Router
  server_state: TanStack Query
  forms: React Hook Form

backend:
  framework: NestJS
  language: TypeScript
  api: REST
  apps:
    - core-api
    - audit-service
  orm: TypeORM

database:
  primary: PostgreSQL
  audit: PostgreSQL

messaging:
  broker: RabbitMQ

notification:
  transport: WebSocket / Socket.IO

authentication:
  strategy: JWT

api_documentation:
  tool: Swagger

infrastructure:
  local: Docker Compose
```

These values are project defaults. They are NOT all explicit requirements from the original test.

---

# 44. Final Rule for AI Agents

Before making a major implementation decision, evaluate:

```text
1. Is this explicitly required by the technical test?
2. Does it help demonstrate the required fullstack skills?
3. Is there a simpler solution that still satisfies the source?
4. Will this make the project harder for a reviewer to run?
```

Prefer:

> simple, complete, demonstrable architecture

instead of:

> complicated, partially working architecture.

The final repository must make it easy for a reviewer to understand the complete flow:

```text
React Employee App
        |
        v
NestJS REST API
        |
        +------> Main PostgreSQL DB
        |
        +------> RabbitMQ
                    |
                    +------> Audit Consumer ------> Audit DB
                    |
                    +------> Notification -------> HRD React UI
```

That end-to-end path is one of the most important engineering stories this technical test should demonstrate.

---

# 44. Mobile-First Native-App-Like UI — MANDATORY

This project MUST be designed **mobile-first**.

Mobile-first in this project does NOT mean:

> "Make the desktop website responsive later."

It means:

> Design the primary employee experience as if it were a native mobile application, then progressively adapt it to tablet and desktop.

The employee application should feel natural when opened from a mobile browser and should visually resemble a modern Android/iOS business application.

Desktop support remains required, but the UI decision process MUST start from the mobile viewport first.

## 44.1 Design Priority

Use this priority:

```text
1. Mobile phone
2. Tablet
3. Laptop / Desktop
```

Do NOT design the desktop UI first and simply stack columns on mobile.

For every employee-facing screen, the agent must first consider:

```text
How would this screen look and behave if this were a native mobile app?
```

Then adapt it upward for larger viewports.

## 44.2 Mobile Layout Target

Primary mobile target width:

```text
360px – 430px
```

The UI should remain usable from approximately:

```text
320px
```

and progressively adapt to:

```text
tablet: 768px+
desktop: 1024px+
```

Avoid hardcoded widths that break at smaller screens.

## 44.3 Employee App Must Feel Like a Native App

The employee app should use a native-app-like shell.

Recommended conceptual layout:

```text
┌─────────────────────────┐
│ Status / Safe Area      │
├─────────────────────────┤
│ App Header              │
│ Hello, Employee         │
├─────────────────────────┤
│                         │
│ Main Screen Content     │
│                         │
│                         │
├─────────────────────────┤
│ Home Attendance History │
│      Bottom Nav         │
└─────────────────────────┘
```

For mobile employee screens, prefer:

- compact top app bar
- bottom navigation
- card-based information
- full-width actions
- mobile-friendly forms
- touch-friendly controls
- native-style dialogs / bottom sheets where appropriate
- sticky primary actions where useful

Avoid desktop-style sidebars in the employee mobile experience.

---

# 45. Mobile Navigation Rules

For the EMPLOYEE application on mobile, prefer bottom navigation.

Recommended tabs:

```text
Home
Attendance
History
Profile
```

Example:

```text
┌───────────────────────────────┐
│                               │
│           Screen              │
│                               │
├───────────────────────────────┤
│  🏠       ✓       📋      👤 │
│ Home   Attendance History Profile
└───────────────────────────────┘
```

Maximum recommended bottom-navigation items:

```text
5
```

Secondary actions should live inside screens rather than the main navigation.

---

# 46. HRD Mobile vs Desktop Navigation

The HRD application should also remain responsive, but it may use a more desktop-oriented layout on larger screens.

Desktop:

```text
Sidebar
+
Top Bar
+
Content Area
```

Mobile:

```text
Top App Bar
+
Drawer / Temporary Navigation
+
Mobile Content
```

Do NOT force a permanent desktop sidebar into a narrow mobile viewport.

---

# 47. Touch Target Rules

All major interactive controls should be touch-friendly.

Recommended minimum touch target:

```text
44px × 44px
```

Prefer approximately:

```text
48px
```

for important actions.

Examples:

- icon buttons
- check-in button
- check-out button
- profile action
- date picker trigger
- navigation item

Avoid tiny clickable text.

---

# 48. Attendance Screen — Mobile-First Design

Attendance is one of the most important employee screens.

The mobile UI should make the primary action obvious.

Recommended structure:

```text
┌──────────────────────────────┐
│ Good Morning                │
│ Thursday, 1 October 2026    │
├──────────────────────────────┤
│                              │
│          08:02               │
│      Current Time            │
│                              │
│   ┌──────────────────────┐   │
│   │      CHECK IN        │   │
│   └──────────────────────┘   │
│                              │
│ Today                        │
│ Check In        --:--        │
│ Check Out       --:--        │
│                              │
└──────────────────────────────┘
```

After check-in:

```text
CHECK IN
    ↓
completed / disabled state

CHECK OUT
    ↓
becomes the primary action
```

The employee should immediately understand:

- current date
- current time
- attendance status
- whether check-in already happened
- whether check-out is available

Do not bury attendance actions inside menus.

---

# 49. Profile Screen — Mobile-First Design

Recommended mobile hierarchy:

```text
Employee Photo

Employee Name
Position

Company Email
Phone Number

[ Edit Profile ]

Account
[ Change Password ]
```

Editable profile forms should use full-width fields on mobile.

Prefer one field per row over multi-column forms.

---

# 50. Attendance History — Mobile-First Design

Do NOT rely only on a wide desktop table for employee attendance history.

On mobile, attendance should be presented using cards or compact list rows.

Example:

```text
┌─────────────────────────────┐
│ 01 Oct 2026                 │
│                             │
│ Check In       08:03        │
│ Check Out      17:12        │
│                  Complete   │
└─────────────────────────────┘
```

Desktop may use a normal table.

Therefore:

```text
Mobile  → Cards / compact list
Desktop → Table
```

when appropriate.

---

# 51. Date Filter Mobile UX

Avoid placing wide date filters in one row on narrow screens.

Mobile:

```text
From Date
[ 01/10/2026 ]

To Date
[ 31/10/2026 ]

[ Apply Filter ]
```

Desktop may display:

```text
From | To | Search
```

Use responsive composition rather than shrinking desktop controls.

---

# 52. Mobile Form Rules

Mobile forms should:

- use full-width inputs
- use clear labels
- use appropriate keyboard/input types
- avoid unnecessary horizontal layouts
- keep the submit action easy to reach
- surface validation close to the relevant field

Examples:

```text
email      → type=email
phone      → type=tel
password   → password input
date       → appropriate date picker
```

---

# 53. Safe Area Support

The employee app should account for mobile safe areas.

Use CSS where appropriate:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
env(safe-area-inset-right)
```

This is especially important for:

- bottom navigation
- sticky bottom buttons
- fullscreen/mobile layouts

---

# 54. Mobile Viewport Height

Avoid blindly using:

```css
height: 100vh;
```

for core mobile shells when it causes mobile-browser viewport issues.

Prefer modern viewport units where supported:

```css
min-height: 100dvh;
```

with reasonable fallback behavior.

---

# 55. Mobile Scrolling Rules

Avoid:

- nested vertical scrolling
- fixed containers that trap page scrolling
- unintended horizontal overflow
- desktop tables breaking mobile width

Prefer one primary page scroll whenever possible.

---

# 56. Mobile Dialog Behavior

For mobile-heavy interactions, prefer patterns that feel native:

- full-screen dialog
- bottom sheet
- swipeable drawer
- mobile modal

Examples:

```text
Edit Profile
Select Photo
Attendance Confirmation
Filter Attendance
```

Do not force a tiny desktop-style centered modal on mobile when a sheet or full-screen flow is more natural.

---

# 57. Feedback and Notifications

Use mobile-friendly feedback after actions.

Examples:

```text
✓ Attendance successfully recorded
✓ Profile updated
✓ Password changed
```

Preferred:

```text
MUI Snackbar
+
MUI Alert
```

Do not use browser `alert()` for normal application feedback.

---

# 58. Loading Experience

Avoid blank screens during API calls.

Use:

- Skeleton
- CircularProgress
- button loading state

Prefer skeletons for screen-level content where appropriate.

---

# 59. Empty States

Provide useful empty states.

Example:

```text
No attendance yet

Your attendance history for this period
will appear here.
```

Do not render an empty table with no explanation.

---

# 60. Error States

Preferred:

```text
Inline Alert
Snackbar
Field validation
Retry button
```

Avoid raw backend error messages or stack traces.

---

# 61. PWA-Like Feel

A true PWA is NOT an original requirement.

However, the application SHOULD visually feel like an installable/mobile application.

The agent MAY add lightweight PWA support only after all P0 requirements are complete.

Optional:

```text
manifest.json
app icons
theme-color
standalone display metadata
```

Do NOT spend significant time implementing advanced offline behavior unless explicitly requested.

---

# 62. Material UI Mobile Usage

Material UI remains the default UI framework.

Recommended components:

```text
AppBar
BottomNavigation
BottomNavigationAction
Card
CardContent
Avatar
Button
IconButton
TextField
List
ListItem
ListItemButton
Dialog
Drawer
SwipeableDrawer
Snackbar
Alert
Skeleton
Chip
Stack
Box
Container
```

For date selection:

```text
@mui/x-date-pickers
```

Do NOT mix multiple major UI frameworks.

---

# 63. MUI Theme Rules

Create one centralized MUI theme.

Suggested location:

```text
src/theme/
  theme.ts
```

Centralize:

- typography
- spacing
- border radius
- breakpoints
- component defaults
- visual tokens

Avoid random per-page styling decisions.

---

# 64. Native-Like Visual Language

The employee application should favor:

```text
rounded cards
clear hierarchy
generous touch spacing
prominent primary actions
compact app bar
bottom navigation
simple iconography
short labels
```

Avoid on mobile:

```text
dense admin layouts
tiny text
wide data grids
permanent sidebars
hover-only interactions
small buttons
complex multi-column forms
```

---

# 65. Hover Must Not Be Required

Any essential interaction must work without hover.

Hover may be used only as an enhancement for desktop.

---

# 66. Responsive Breakpoint Behavior

Recommended conceptual behavior:

```text
xs / sm
→ native-app-like mobile UI

md
→ tablet hybrid layout

lg / xl
→ desktop layout
```

Examples:

```text
Employee navigation:
mobile  → bottom navigation
desktop → top navigation or compact side navigation

Attendance history:
mobile  → cards/list
desktop → table

Profile:
mobile  → vertical
desktop → wider layout if useful

HRD:
mobile  → temporary drawer
desktop → permanent sidebar
```

---

# 67. Mobile-First Styling Rule

Base styles must represent the mobile layout.

Then progressively enhance larger screens.

Preferred MUI example:

```tsx
sx={{
  px: { xs: 2, md: 3 },
  display: { xs: 'block', md: 'flex' }
}}
```

Do not build a desktop layout first and then patch mobile with many overrides.

---

# 68. Responsive Testing Requirement

Before declaring a screen complete, test at least:

```text
Mobile Small  ~360px
Mobile Large  ~430px
Tablet        ~768px
Desktop       ~1366px
```

The goal is layout correctness and usability, not pixel-perfect device emulation.

---

# 69. Mobile UI Definition of Done

An employee-facing screen is NOT done unless:

- [ ] It works around 360px width.
- [ ] Primary actions are easy to reach.
- [ ] Text remains readable.
- [ ] No accidental horizontal overflow exists.
- [ ] Forms remain usable with a virtual keyboard.
- [ ] No critical interaction depends on hover.
- [ ] Touch targets are large enough.
- [ ] Navigation feels natural on mobile.
- [ ] Loading state exists.
- [ ] Empty state exists when applicable.
- [ ] Error state exists when applicable.
- [ ] Desktop adaptation still works.

---

# 70. Employee App Mobile Acceptance Criteria

The completed employee application should feel visually similar to a modern native application when opened on Android or iPhone.

The reviewer should NOT feel that they are viewing:

> a desktop admin website squeezed into a phone.

Instead, the expected experience is:

> a mobile attendance application implemented using responsive web technology.

This applies especially to:

```text
Login
Home
Attendance
Attendance History
Profile
```

The mobile experience is a first-class product surface, not a fallback layout.

---

# 71. Dexa Group Brand-Inspired Visual Theme — MANDATORY

The visual design MUST feel aligned with **Dexa Group's public corporate identity**.

Public-facing Dexa Group materials prominently use a **deep corporate red wordmark**, combined with clean white space and dark neutral typography.

IMPORTANT:

> The hexadecimal values below are PROJECT DESIGN TOKENS inspired by Dexa Group's public visual identity. They must NOT be described as official Dexa Group brand-guideline values unless official brand guidelines are provided.

The goal is not to copy Dexa's corporate website pixel-for-pixel.

The goal is to create a modern employee application that immediately feels compatible with the Dexa Group visual identity.

---

## 71.1 Core Visual Direction

The application should feel:

```text
Professional
Healthcare-oriented
Clean
Trustworthy
Modern
Corporate
Minimal
Mobile-native
```

Avoid visual styles that feel:

```text
Gaming
Fintech neon
Playful startup
Overly colorful
Glassmorphism-heavy
Gradient-heavy
Dark-first
```

Primary visual ingredients:

```text
Dexa-inspired deep red
White
Warm/light neutral backgrounds
Dark graphite text
Subtle red-tinted surfaces
Minimal borders and shadows
```

---

# 72. Project Color Palette

Use the following palette as the default project theme.

## Primary — Dexa-Inspired Red

```text
Primary 50   #FFF5F5
Primary 100  #FFE3E3
Primary 200  #FFC9C9
Primary 300  #FFA8A8
Primary 400  #FF7B7B
Primary 500  #C62828
Primary 600  #B71C1C
Primary 700  #9F1717
Primary 800  #861313
Primary 900  #6F1010
```

Main application brand color:

```text
#B71C1C
```

Use `#B71C1C` as the main working Dexa-inspired red unless the developer later provides an official brand token.

Do NOT randomly choose different reds on different pages.

---

## Neutral / Graphite

```text
Text Primary      #252525
Text Secondary    #666666
Text Muted        #8A8A8A

Background        #F7F7F8
Surface           #FFFFFF
Surface Secondary #FAFAFA

Border            #E6E6E8
Divider           #ECECEE
```

---

## Semantic Colors

Semantic colors must retain their conventional meaning.

```text
Success     #2E7D32
Warning     #ED6C02
Error       #D32F2F
Info        #1976D2
```

Do NOT turn every semantic state red merely to match the corporate identity.

Example:

```text
Attendance completed → success green
Validation error      → error red
Information           → blue/info
Pending                → neutral/warning
```

Brand color and semantic meaning are separate concerns.

---

# 73. Color Usage Hierarchy

Use the Dexa-inspired red primarily for:

```text
Primary CTA
Active navigation state
Selected tabs
Important icons
App header accents
Attendance primary action
Links where appropriate
Focus accents
Small branding details
```

Do NOT make the entire screen red.

Preferred visual ratio:

```text
~70% white / light neutral
~20% graphite / neutral content
~10% Dexa-inspired red accents
```

This ratio is guidance, not a strict mathematical requirement.

The result should feel clean and premium rather than visually aggressive.

---

# 74. Employee Mobile App Visual Example

Preferred appearance:

```text
┌──────────────────────────────┐
│ Dexa                         │
│ Good Morning                 │
│ Thursday, 1 October          │
│                              │
│ ┌──────────────────────────┐ │
│ │        08:02             │ │
│ │      Current Time        │ │
│ │                          │ │
│ │  [      CHECK IN      ]  │ │  ← Dexa red
│ └──────────────────────────┘ │
│                              │
│ Today                        │
│ ┌──────────────────────────┐ │
│ │ Check In          --:--  │ │
│ │ Check Out         --:--  │ │
│ └──────────────────────────┘ │
│                              │
├──────────────────────────────┤
│  Home   Attend. History  Me  │
└──────────────────────────────┘
```

Visual behavior:

```text
Page background → very light neutral
Cards           → white
Primary CTA     → Dexa-inspired red
Main text       → graphite
Secondary text  → gray
Selected nav    → Dexa-inspired red
Unselected nav  → muted gray
```

---

# 75. Mobile Header Style

Employee mobile screens should use a clean header rather than a large corporate website navigation bar.

Preferred:

```text
White / light surface
+
small Dexa branding
+
dark text
+
optional subtle red accent
```

Avoid:

```text
large solid-red header occupying excessive vertical space
```

A solid-red app bar may be used selectively, but should not dominate every screen.

---

# 76. Primary Button Rules

Primary buttons should use:

```text
background: #B71C1C
text: #FFFFFF
```

Recommended:

```text
min-height: 48px
border-radius: 12px
font-weight: 600
```

Hover for pointer devices:

```text
#9F1717
```

Active/pressed:

```text
#861313
```

Disabled:

```text
neutral background
neutral text
```

Do NOT use opacity-only disabled states if text contrast becomes poor.

---

# 77. Secondary Button Rules

Secondary actions should preferably use:

```text
white background
Dexa-inspired red text
subtle red/neutral border
```

or a text-button treatment.

Example:

```text
Cancel       → neutral/text
Edit Profile → outlined red
Check In     → primary red
```

Do not give every action equal visual weight.

---

# 78. Attendance Action Color Rules

Attendance is a critical business action.

Before check-in:

```text
CHECK IN
→ primary Dexa-inspired red
```

After successful check-in:

```text
Checked In
→ completed/success visual
```

When check-out becomes available:

```text
CHECK OUT
→ primary CTA
```

Do not show two equally dominant red buttons simultaneously if only one action is currently expected.

The state hierarchy must be immediately understandable.

---

# 79. Bottom Navigation Color Rules

Mobile employee navigation:

```text
Background       #FFFFFF
Selected item    #B71C1C
Unselected item  #8A8A8A
Top divider      #ECECEE
```

Avoid a heavy solid-red bottom navigation bar unless explicitly approved.

A white native-style navigation surface with red selected state is preferred.

---

# 80. Card Styling

Cards should be clean and lightweight.

Recommended:

```text
background: #FFFFFF
border-radius: 16px
border: subtle neutral
shadow: very subtle
```

Avoid large dramatic shadows.

The application should feel closer to a polished healthcare/enterprise native app than an ecommerce landing page.

---

# 81. Border Radius System

Use a consistent radius scale.

Recommended:

```text
Small controls      8px
Inputs              10–12px
Buttons             12px
Cards               14–16px
Bottom sheets       20–24px top corners
Avatar              circular
```

Do not assign arbitrary radii to every component.

---

# 82. Typography

Use a highly readable modern sans-serif.

Preferred:

```text
Inter
```

Fallback:

```text
Roboto
system-ui
sans-serif
```

Because MUI defaults to Roboto, either:

1. use Roboto consistently, or
2. intentionally configure Inter globally.

Do NOT mix multiple body-font families.

Recommended hierarchy:

```text
Page title       22–24px / 700
Section title    18–20px / 600–700
Card title       16px / 600
Body             14–16px / 400
Caption          12–13px / 400–500
Button           14–16px / 600
```

On mobile, prioritize readability over decorative typography.

---

# 83. MUI Theme Implementation

Create the theme in one central location:

```text
src/theme/theme.ts
```

Recommended implementation:

```ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',

    primary: {
      light: '#C62828',
      main: '#B71C1C',
      dark: '#861313',
      contrastText: '#FFFFFF',
    },

    background: {
      default: '#F7F7F8',
      paper: '#FFFFFF',
    },

    text: {
      primary: '#252525',
      secondary: '#666666',
    },

    divider: '#ECECEE',

    success: {
      main: '#2E7D32',
    },

    warning: {
      main: '#ED6C02',
    },

    error: {
      main: '#D32F2F',
    },

    info: {
      main: '#1976D2',
    },
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      'system-ui',
      'sans-serif',
    ].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },

  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 12,
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        fullWidth: true,
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        },
      },
    },

    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
        },
      },
    },
  },
});
```

The agent MAY refine this implementation while preserving the design-token intent.

---

# 84. CSS Design Tokens

If CSS variables are used, define tokens centrally.

Example:

```css
:root {
  --dexa-red-50: #fff5f5;
  --dexa-red-100: #ffe3e3;
  --dexa-red-500: #c62828;
  --dexa-red-600: #b71c1c;
  --dexa-red-700: #9f1717;
  --dexa-red-800: #861313;

  --surface-page: #f7f7f8;
  --surface-card: #ffffff;

  --text-primary: #252525;
  --text-secondary: #666666;
  --text-muted: #8a8a8a;

  --border-default: #e6e6e8;
  --divider-default: #ececee;
}
```

Do NOT hardcode slightly different reds repeatedly throughout components.

---

# 85. Login Screen Branding

The login screen is the first visual impression.

Mobile-first recommended structure:

```text
┌──────────────────────────────┐
│                              │
│          Dexa                │
│                              │
│     Employee Attendance      │
│                              │
│ Company Email                │
│ [________________________]   │
│                              │
│ Password                     │
│ [________________________]   │
│                              │
│ [        Sign In         ]   │ ← Dexa red
│                              │
│ Secure employee access       │
│                              │
└──────────────────────────────┘
```

Prefer:

```text
white/light background
clean form
red primary CTA
subtle branding
```

Avoid:

```text
huge hero images
marketing carousel
large gradients
excessive decorative graphics
```

This is an internal employee tool, not a marketing website.

---

# 86. HRD Dashboard Branding

The HRD interface may be denser than the employee app.

Desktop:

```text
white / neutral workspace
dark graphite typography
Dexa red selected navigation
Dexa red primary CTA
subtle red badges/accent
```

Example:

```text
┌──────────────┬──────────────────────────────────────┐
│ Dexa         │ Employee Management                 │
│              │                                      │
│ Dashboard    │ Search                 + Add Employee│
│ Employees ●  │                                      │
│ Attendance   │ ┌──────────────────────────────────┐ │
│              │ │ Employee table                   │ │
│              │ └──────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────┘
```

Do not make the entire HRD sidebar bright red unless visual testing shows it remains balanced.

Preferred sidebar:

```text
white / near-white
+
red selected state
```

or:

```text
dark graphite
+
red accent
```

---

# 87. Logo Usage Rule

If an official Dexa Group logo asset is legally and appropriately provided for the technical test:

- preserve its proportions
- do not recolor it arbitrarily
- do not distort it
- provide sufficient clear space
- keep it legible

If no official logo asset is provided:

> Do NOT recreate the Dexa logo from memory.

Use a simple textual project identity such as:

```text
Dexa
Employee Attendance
```

and preserve the Dexa-inspired palette.

An AI agent must not invent a fake corporate logo.

---

# 88. No Brand Overuse

The app should look associated with Dexa Group, but it should still be usable.

Do NOT:

- paint every card red
- use red backgrounds behind large bodies of text
- make all icons red
- make success states red
- use a red gradient on every screen
- add decorative pharmaceutical imagery to every page

Branding should support the product, not overwhelm it.

---

# 89. Accessibility and Contrast

Brand resemblance must never override readability.

The agent must verify reasonable contrast for:

- text
- buttons
- navigation
- form labels
- disabled states
- error messages

White text on the chosen dark primary red is preferred for primary CTA.

Do not use light red text on white for essential content if contrast is insufficient.

---

# 90. Theme Acceptance Criteria

Before declaring the UI complete:

- [ ] The application uses one centralized theme.
- [ ] Primary actions consistently use the Dexa-inspired red.
- [ ] Backgrounds remain mostly white/light neutral.
- [ ] Dark graphite is used for primary text.
- [ ] Red is not overused.
- [ ] Semantic success/warning/info colors retain meaning.
- [ ] Mobile bottom navigation uses a clear red selected state.
- [ ] Employee UI still feels native-app-like.
- [ ] HRD UI feels professional and enterprise-oriented.
- [ ] No arbitrary one-off color values are scattered through components.
- [ ] The app does not claim the project HEX values are official Dexa brand guidelines.

---

# 91. Final Visual Principle

The final visual target is:

> **Dexa-inspired corporate healthcare identity + modern native-mobile employee experience.**

A reviewer should see the application and feel that:

```text
This could plausibly be an internal Dexa Group employee application.
```

without the interface becoming a direct copy of the public Dexa Group website.
