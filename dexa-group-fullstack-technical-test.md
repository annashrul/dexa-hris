# Dexa Group — Fullstack Developer Skill Test

> Converted from the provided technical test PDF into structured Markdown for easier analysis by AI agents.

## 1. Mandatory Skills for Fullstack Developer

### Backend

- **Programming Language:** JavaScript / TypeScript
- **Framework:** NestJS
- **Database:** Choose one:
  - MySQL
  - Oracle
  - MongoDB
  - SQL Server
  - PostgreSQL

### Frontend

#### Web

- **Framework:** React.js

---

## 2. Objectives

### Backend

The candidate should be able to:

1. Create a proper database structure.
2. Connect to a database.
3. Create APIs using a **microservices concept**.
4. Manipulate data through APIs:
   - Create
   - Read
   - Update
   - Delete

### Frontend

The candidate should be able to:

1. Create pages / screens.
2. Implement a CSS framework.
3. Call APIs from / to the backend.
4. Create custom components.

---

# 3. Use Cases

## 3.1 Employee WFH Attendance Application

Build a **responsive web application** that can be accessed through browsers on both:

- Laptop / desktop
- Mobile devices

### Authentication

Employees must be able to log in using:

- Company email
- Password

### Employee Menus

The employee application contains **3 menus**:

1. Employee Profile
2. Attendance
3. Attendance Summary

---

## 3.1.1 Employee Profile

Display the profile of the currently logged-in employee.

### Information Displayed

- Name
- Company email
- Employee photo
- Position
- Phone number

### Editable Information

Employees can update:

- Employee photo
- Phone number
- Account password

### Requirements When Employee Data Changes

When employee data is changed, implement the following features.

#### A. Admin Notification

There must be a **popup / alert notification on the admin page**.

The technology is flexible.

Example mentioned in the test:

- Firebase
- Or another suitable technology

#### B. Data Stream / Message Queue Logging

Changes must also generate a **data stream / message queue** for logging into a **separate database**.

The technology is flexible.

Examples mentioned in the test:

- Kafka
- RabbitMQ
- AWS SQS
- GCP Pub/Sub
- Other suitable message queue / streaming technology

---

## 3.1.2 Attendance

Employees can submit attendance for:

- **Check-in / Masuk**
- **Check-out / Pulang**

### Data Captured

Each attendance record captures:

- Date
- Time
- Status:
  - `masuk`
  - `pulang`

---

## 3.1.3 Attendance Summary

Employees can view their attendance summary.

### Default Date Range

By default, attendance data should be displayed from:

**Beginning of the current month → Today**

### Date Filter

Employees can filter attendance using a custom date range.

Example:

```text
Filter Tanggal (From - To)

From: 2022-11-22
To:   2022-11-22

[Cari]
```

### Example Attendance Result

| Date | Masuk | Date | Pulang |
|---|---|---|---|
| 2022-11-22 | 08:00 | 2022-11-22 | 17:00 |

---

# 3.2 Employee Monitoring Application

Create a **dedicated web application for HRD administrators**.

## Admin / HRD Features

### Employee Management

Provide a menu that allows HRD administrators to:

- Add employee data
- Update employee data

### Attendance Monitoring

Provide a menu that allows HRD administrators to view attendance submitted by **all employees**.

Attendance information in this menu is:

> **Read Only**

---

# 4. Architecture Requirement

The applications must use a **microservices architecture** with **REST APIs**.

The APIs must be consumable by both applications:

1. Employee WFH Attendance Application
2. HRD Employee Monitoring Application

## High-Level Architecture

```text
┌──────────────────────────────┐
│ Employee Attendance Web App  │
│ React.js                     │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────┐
│ Backend Microservices        │
│ NestJS / TypeScript          │
└──────────────┬───────────────┘
               │
               ├──────────────► Main Database
               │
               └──────────────► Message Queue / Stream
                                      │
                                      ▼
                               Logging Database


┌──────────────────────────────┐
│ HRD Monitoring Web App       │
│ React.js                     │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
        Backend Microservices
```

---

# 5. Functional Requirements Summary

## Employee Application

- [ ] Employee login using company email and password
- [ ] Responsive web interface
- [ ] Employee profile page
- [ ] Display employee name
- [ ] Display company email
- [ ] Display employee photo
- [ ] Display position
- [ ] Display phone number
- [ ] Update employee photo
- [ ] Update phone number
- [ ] Change password
- [ ] Trigger admin notification when employee data changes
- [ ] Send employee-data changes through message queue / data stream
- [ ] Store logs in a separate database
- [ ] Employee check-in
- [ ] Employee check-out
- [ ] Capture attendance date
- [ ] Capture attendance time
- [ ] Capture attendance status
- [ ] Display attendance summary
- [ ] Default attendance range from beginning of month until today
- [ ] Filter attendance by date range

## HRD Admin Application

- [ ] Dedicated HRD web interface
- [ ] Add employee
- [ ] Update employee
- [ ] View attendance from all employees
- [ ] Attendance view is read-only
- [ ] Receive popup / alert when employee data changes

## Backend

- [ ] JavaScript / TypeScript
- [ ] NestJS
- [ ] Proper database structure
- [ ] Database integration
- [ ] REST API
- [ ] Microservices concept
- [ ] CRUD operations
- [ ] Message queue / streaming integration
- [ ] Separate logging database

## Frontend

- [ ] React.js
- [ ] Responsive UI
- [ ] CSS framework
- [ ] Backend API integration
- [ ] Custom components

---

# 6. Allowed / Mentioned Technology

## Required

| Layer | Technology |
|---|---|
| Backend Language | JavaScript / TypeScript |
| Backend Framework | NestJS |
| Frontend Framework | React.js |
| API | REST API |
| Architecture | Microservices |

## Database — Choose One

- MySQL
- Oracle
- MongoDB
- SQL Server
- PostgreSQL

## Message Queue / Streaming — Flexible

Examples provided:

- Kafka
- RabbitMQ
- AWS SQS
- GCP Pub/Sub

## Notification Technology — Flexible

Example provided:

- Firebase

Other technologies may be used.

---

# 7. Deliverables Implied by the Test

The source requires implementation of:

### Application 1 — Employee Attendance

Responsive React.js web application for employees.

### Application 2 — HRD Monitoring

React.js web application specifically for HRD administrators.

### Backend

NestJS-based backend using REST APIs and a microservices concept, consumable by both applications.

### Data Layer

A selected supported database plus a separate logging database connected through a message queue / data stream.

---

# 8. Development Time

Expected completion time:

- **Target:** 3–4 days
- **Maximum:** 5 days

---

# 9. AI Agent Task Context

When implementing this technical test, the AI agent should treat the following as core requirements:

```yaml
project:
  name: Employee WFH Attendance & Monitoring System
  type: Fullstack Technical Test

frontend:
  framework: React.js
  responsive: true
  applications:
    - employee-attendance
    - hrd-monitoring

backend:
  language:
    - JavaScript
    - TypeScript
  framework: NestJS
  architecture: microservices
  api: REST

database:
  choose_one:
    - MySQL
    - Oracle
    - MongoDB
    - SQL Server
    - PostgreSQL

employee_features:
  authentication:
    - company_email
    - password

  profile:
    display:
      - name
      - company_email
      - photo
      - position
      - phone_number
    editable:
      - photo
      - phone_number
      - password

  attendance:
    actions:
      - check_in
      - check_out
    capture:
      - date
      - time
      - status

  attendance_summary:
    default_range: beginning_of_month_to_today
    custom_date_filter: true

admin_features:
  employee:
    - create
    - update

  attendance:
    all_employees: true
    read_only: true

employee_change_event:
  admin_notification: true
  message_queue_logging: true
  separate_logging_database: true

message_queue_options:
  - Kafka
  - RabbitMQ
  - AWS SQS
  - GCP Pub/Sub

notification_example:
  - Firebase

deadline:
  expected_days: "3-4"
  maximum_days: 5
```

---

# 10. Important Constraints

1. Do not replace **React.js** with another frontend framework unless explicitly permitted.
2. Use **NestJS** for the backend.
3. Use a **microservices concept** and REST APIs.
4. Both employee and HRD applications must consume the backend APIs.
5. Employee profile changes must trigger:
   - an admin notification, and
   - message queue / data stream logging.
6. Message queue logs must be stored in a **separate database**.
7. HRD can view attendance from all employees, but the attendance data is **read-only** from the HRD monitoring menu.
8. The application must be responsive for laptop and mobile browsers.

---

> **Source note:** This Markdown restructures the supplied Dexa Group Fullstack Developer Skill Test for machine readability. The functional requirements and named technology options are derived from the supplied document. Architectural diagrams, checklists, YAML structure, and grouping are organizational representations of those requirements rather than additional requirements from the source.
