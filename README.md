# Nexora ERP

Operations • CRM • Inventory • Sales

A full-stack ERP application built to connect customers, products, inventory, and sales operations into one unified system.

I wanted Nexora to be more than a collection of CRUD screens. The goal was to understand how a real business application connects authentication, user roles, customer management, inventory control, sales workflows, database transactions, and audit history into one system.

![Nexora ERP System Flowchart](docs/nexora-erp-flowchart.png)

---

## What Nexora Does

Nexora ERP is designed around four main operational areas:

1. Customer CRM

   Manage business customers, contacts, customer types, account status, follow-ups, and customer history.

2. Products & Inventory

   Maintain the product catalog, SKU information, pricing, warehouse locations, current stock, and low-stock alerts.

3. Stock Movement Tracking

   Maintain an audit history of inventory entering and leaving the system, including quantity, reason, reference, user, and timestamp.

4. Sales Challans

   Create draft challans, add multiple products, calculate order valuation, confirm dispatches, and automatically deduct inventory.

The system also includes authentication, role-based access control, validation, centralized error handling, database transactions, and audit tracking.

---

## Key Features

### Authentication & Role-Based Access Control

JWT-based authentication with password hashing using bcryptjs.

Four operational roles are supported:

| Role | Purpose |
|------|---------|
| ADMIN | Full system access |
| SALES | Customer management and sales challans |
| WAREHOUSE | Product and inventory operations |
| ACCOUNTS | Read-only financial and operational visibility |

Permissions are enforced at both levels:

Frontend UI controls

Backend API authorization middleware

This means hiding a button in the frontend is not treated as a security mechanism. The backend independently validates every protected operation.

---

### Customer CRM

The CRM module manages complete customer account information.

Customer information includes:

Name

Mobile

Email

Business name

Customer type

Account status

GST number

Address

Notes

Follow-up information

Supported customer types:

RETAIL

WHOLESALE

DISTRIBUTOR

Supported account statuses:

LEAD

ACTIVE

INACTIVE

The system also maintains a follow-up timeline and automatically tracks the next scheduled follow-up date.

---

### Products Catalog & Inventory

The product catalog maintains:

SKU

Product name

Category

Unit price

Current stock

Minimum stock alert level

Warehouse location

A major inventory rule is enforced at the backend level:

Current stock cannot simply be overwritten through product metadata editing.

Stock changes must happen through controlled inventory operations such as stock IN movements or confirmed sales challans.

This keeps the inventory history reliable.

---

### Stock Movement Audit Log

Every important inventory movement is recorded.

Movement types include:

IN — Stock entering the system

OUT — Stock leaving the system

Each movement can contain:

Product reference

Quantity

Movement type

Reason

Reference

User who performed the action

Timestamp

This creates an immutable operational history that can be used for auditing and troubleshooting.

---

### Sales Challan Workflow

The sales process follows a controlled lifecycle:

DRAFT → CONFIRMED

DRAFT → CANCELLED

A draft challan does not immediately reduce inventory.

When a challan is confirmed, the backend performs the complete operation inside a single Prisma transaction.

The transaction:

1. Validates the customer.
2. Validates every product.
3. Checks available inventory.
4. Calculates the required stock deduction.
5. Deducts inventory.
6. Creates OUT stock movement records.
7. Stores product and pricing snapshots.
8. Changes the challan status to CONFIRMED.

If anything fails, the transaction rolls back.

For example, if a customer orders more stock than available, the system returns:

`HTTP 422 INSUFFICIENT_STOCK`

and does not partially modify the database.

This was one of the core business rules of Nexora.

---

## Technology Stack

Frontend

React 19
TypeScript
Vite
Vanilla CSS
Custom responsive UI design system

Backend

Node.js
Express.js
TypeScript
Prisma ORM
PostgreSQL
Neon PostgreSQL

Security & Validation

JWT
bcryptjs
Zod
RBAC middleware
CORS
Centralized error handling

Testing & Tooling

TypeScript Compiler
tsx
Custom API smoke tests
E2E integration tests
Frontend verification tests

---

## Repository Structure

```text
nexora-erp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma PostgreSQL data schema
│   │   └── seed.ts             # Database user seeding script
│   │
│   ├── src/
│   │   ├── config/             # Environment configuration & Zod parsing
│   │   ├── controllers/        # Express route handlers
│   │   ├── errors/             # Centralized AppError hierarchy
│   │   ├── middleware/         # Auth, RBAC, validation & error handlers
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic & Prisma transactions
│   │   ├── validators/         # Zod input validation schemas
│   │   └── app.ts              # Express application setup
│   │
│   ├── test-e2e.ts             # Master E2E integration test suite
│   ├── test-smoke.ts           # Focused API smoke verification
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # AppLayout, Sidebar & route guards
│   │   ├── context/            # AuthContext session provider
│   │   ├── pages/              # Dashboard, CRM, Products, Stock, Challans
│   │   ├── services/           # API client with JWT handling
│   │   └── types/              # Shared TypeScript interfaces
│   │
│   ├── index.html
│   └── package.json
│
├── docs/
│   └── nexora-erp-flowchart.png
│
└── README.md
```

---

## Role Permissions

| Feature | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---------|-------|-------|-----------|----------|
| Authentication | Full | Full | Full | Full |
| Customer CRM | CRUD | Create / Edit / Follow-Up | Blocked | Read Only |
| Products | Create / Edit | Read Only | Create / Edit | Read Only |
| Stock Movements | View / Manual IN | Blocked | View / Manual IN | Read Only |
| Sales Challans | Draft / Confirm | Draft / Confirm | View / Confirm | Read Only |

The UI reflects these permissions, but the backend independently enforces them through role authorization middleware.

---

## Environment Variables

### Backend

Create:

`backend/.env`

```env
PORT=5001
NODE_ENV=development

DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

JWT_SECRET="your-secure-development-jwt-secret"
JWT_EXPIRES_IN="10h"

# Single origin or comma-separated origins
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"
```

### Frontend

Create:

`frontend/.env`

```env
VITE_API_URL="http://localhost:5001/api/v1"
```

For production, replace the local API URL with the deployed backend URL.

---

## Quickstart

### Prerequisites

Node.js `v18+`

PostgreSQL database or Neon PostgreSQL

Git

### Backend Setup

```bash
cd backend

npm install

npm run prisma:generate

npm run seed

npm run dev
```

Backend API:

```text
http://localhost:5001/api/v1
```

Health check:

```text
http://localhost:5001/api/v1/health
```

### Frontend Setup

Open another terminal:

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```text
http://localhost:3000
```

If port 3000 is already being used, Vite may start on:

```text
http://localhost:3001
```

The backend supports both configured local origins.

---

## Demo Accounts

Development and testing only.

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@nexora.com` | `Admin@123456` |
| Sales Executive | `sales@nexora.com` | `Sales@123456` |
| Warehouse Manager | `warehouse@nexora.com` | `Warehouse@123456` |
| Financial Auditor | `accounts@nexora.com` | `Accounts@123456` |

---

## API Structure

Base URL:

```text
/api/v1
```

Authentication

```text
POST /auth/login
GET  /auth/me
```

Customers

```text
GET  /customers
POST /customers
GET  /customers/:id
PUT  /customers/:id
POST /customers/:id/follow-ups
```

Products

```text
GET  /products
POST /products
PUT  /products/:id
```

Stock Movements

```text
GET  /products/:id/stock-movements
POST /products/:id/stock-movements
```

Sales Challans

```text
GET  /challans
POST /challans
GET  /challans/:id
POST /challans/:id/confirm
POST /challans/:id/cancel
```

---

## Security & Reliability

Nexora includes several controls intended to make the system behave like a real business application rather than a basic CRUD project.

JWT authentication protects private API routes.

Role-based middleware prevents unauthorized operations.

Passwords are stored using secure password hashing.

User password hashes are never returned through API responses.

Zod validates incoming request data.

CORS is controlled through environment configuration.

Wildcard CORS is not used with credentialed requests.

Express server identification headers are disabled.

Request body limits are configured.

Internal server errors are sanitized before being returned to clients.

Database-changing business operations use Prisma transactions.

Insufficient inventory cannot create partial stock deductions.

---

## Testing & Verification

The project was tested across the frontend, backend, authentication layer, RBAC layer, database operations, inventory workflows, and sales challan lifecycle.

Backend smoke verification:

```text
7 / 7 checks passed
```

End-to-end integration verification:

```text
19 / 19 checks passed
```

Frontend verification:

```text
2 / 2 checks passed
```

Production builds:

```text
Backend   → 0 compilation errors
Frontend  → 0 compilation errors
```

Verified workflows include:

Authentication

JWT session handling

Customer creation and editing

Customer follow-ups

Product creation and editing

Inventory movements

Low-stock detection

Sales challan creation

Draft validation

Challan confirmation

Inventory deduction

Stock movement generation

Challan cancellation

Transaction rollback

RBAC restrictions

401 Unauthorized handling

403 Forbidden handling

Frontend navigation

Responsive sidebar behavior

Modal interactions

Form validation

---

## Production Build

### Backend

```bash
cd backend

npm run build

npm run start
```

Build output:

```text
dist/
```

The backend also runs:

```text
prisma generate
```

through the deployment `postinstall` script.

### Frontend

```bash
cd frontend

npm run build
```

Build output:

```text
dist/
```

The frontend can be deployed to a static hosting platform or CDN.

---

## Deployment Requirements

Backend

```text
Node.js 18+ / 20 LTS
PostgreSQL / Neon PostgreSQL
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
CORS_ORIGIN
PORT
```

Frontend

```text
Vite-compatible static hosting
VITE_API_URL
```

For production:

```env
NODE_ENV=production
DATABASE_URL="production-postgresql-url"
JWT_SECRET="strong-production-secret"
JWT_EXPIRES_IN="10h"
CORS_ORIGIN="https://your-frontend-domain.com"
```

Frontend:

```env
VITE_API_URL="https://your-backend-domain.com/api/v1"
```

---

## Current Project Status

Backend foundation complete.

Authentication complete.

RBAC complete.

Customer CRM complete.

Products and inventory complete.

Stock movement audit system complete.

Sales challan workflow complete.

Frontend application complete.

E2E integration verified.

Production builds verified.

UI quality and responsive behavior verified.

Deployment configuration prepared.

No known functional blockers remain in the verified scope.

---

## What I Want Nexora to Become

Nexora started as a way to understand how different parts of a business application actually work together.

The long-term idea is to move beyond simple screens and CRUD operations and build a system where customer activity, inventory, sales, operations, permissions, and financial visibility are connected through reliable business workflows.

The current version focuses on the foundation:

Customers → Products → Inventory → Sales → Database → Audit

The architecture is intentionally designed so that future modules such as purchasing, suppliers, invoicing, payments, reporting, notifications, analytics, and deeper financial workflows can be added without rebuilding the core system.

Nexora is therefore not just a college project for me. It is an attempt to understand and build the foundation of a real-world business operations platform.
