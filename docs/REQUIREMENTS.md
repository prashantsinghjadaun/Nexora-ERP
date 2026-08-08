# Nexora ERP — Requirements & Case Study Mapping

## Product Title
**Nexora ERP — Operations & CRM Portal**

## Project Overview
Nexora ERP is a production-grade mini ERP + CRM operations portal designed for a wholesale and distribution enterprise. The system handles customer relationships, product catalogs, multi-warehouse inventory management, immutable stock movement tracking, sales challan generation with snapshot isolation, customer follow-up management, and executive analytics dashboards.

This document maps all original case study requirements to our technical implementation plan, establishing traceability and verification strategies for every requirement.

---

## Technical Stack Requirements

| Component | Technology | Selection Rationale |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, HTML, CSS | Type-safe dynamic UI, component-driven architecture, custom styling control |
| **Backend** | Node.js, Express.js, TypeScript | Performant asynchronous IO, structured layered REST architecture, strict typing |
| **Database** | PostgreSQL | Enterprise relational DB supporting ACID transactions, row locking, and complex indexing |
| **ORM** | Prisma ORM | Type-safe query building, declarative schema migrations, transactional batching |
| **Authentication** | JWT (JSON Web Tokens), bcrypt | Stateless, scalable token-based security with salted password hashing (10 rounds) |

---

## Role Requirements

The system enforces 4 distinct roles with strict backend and frontend access controls:
1. **ADMIN**: Superuser access to all modules, user management, configuration, and data overrides.
2. **SALES**: Customer CRM, follow-up management, creation and confirmation of Sales Challans.
3. **WAREHOUSE**: Product catalog maintenance, stock entry (IN/OUT), stock movement logging, and viewing confirmed challans for dispatch.
4. **ACCOUNTS**: View-only financial records, sales challans, invoice summaries, customer ledger balances, and audit reports.

---

## Core Requirement Checklist & Implementation Mapping

### 1. Authentication & Role-Based Access Control (RBAC)

| Req ID | Requirement Description | Implementation Strategy | Status |
| :--- | :--- | :--- | :--- |
| `REQ-AUTH-01` | User Login with Credentials | `POST /api/v1/auth/login` validating email & password via bcrypt | Planned |
| `REQ-AUTH-02` | JWT Token Generation | Issue signed JWT with `userId`, `email`, and `role` (10h expiry) | Planned |
| `REQ-AUTH-03` | Role Support (ADMIN, SALES, WAREHOUSE, ACCOUNTS) | Standardized Enum `Role` in database and JWT payload | Planned |
| `REQ-AUTH-04` | Route Guarding & RBAC Middleware | Middleware `authenticateJWT` + `requireRole(['ADMIN', ...])` | Planned |
| `REQ-AUTH-05` | Active User Profile Endpoint | `GET /api/v1/auth/me` returning sanitized current user profile | Planned |

### 2. Customer CRM Module

| Req ID | Requirement Description | Implementation Strategy | Status |
| :--- | :--- | :--- | :--- |
| `REQ-CRM-01` | Customer Profile Data | Fields: `name`, `mobile`, `email`, `businessName`, `gstNumber` (optional), `address`, `type`, `status` | Planned |
| `REQ-CRM-02` | Customer Types | Enum: `RETAIL`, `WHOLESALE`, `DISTRIBUTOR` | Planned |
| `REQ-CRM-03` | Customer Lifecycle Status | Enum: `LEAD`, `ACTIVE`, `INACTIVE` | Planned |
| `REQ-CRM-04` | Add / Edit Customer | `POST /api/v1/customers` and `PUT /api/v1/customers/:id` with Zod validation | Planned |
| `REQ-CRM-05` | Search & Filter Customers | `GET /api/v1/customers?search=...&type=...&status=...&page=1` | Planned |
| `REQ-CRM-06` | Customer Detail Page | `GET /api/v1/customers/:id` with nested follow-up history & order summary | Planned |
| `REQ-CRM-07` | Follow-up Date & Notes | `FollowUp` table linked to Customer with `nextFollowUpDate`, `notes`, `createdBy` | Planned |
| `REQ-CRM-08` | Log Follow-up Activity | `POST /api/v1/customers/:id/follow-ups` updates customer's last contact date | Planned |

### 3. Product & Inventory Management

| Req ID | Requirement Description | Implementation Strategy | Status |
| :--- | :--- | :--- | :--- |
| `REQ-INV-01` | Product Master Data | `name`, `sku` (unique indexed), `category`, `unitPrice` (Decimal), `currentStock` (Int), `minStockAlert` (Int), `location` | Planned |
| `REQ-INV-02` | Add / Edit Product | `POST /api/v1/products` and `PUT /api/v1/products/:id` (Restricted to ADMIN / WAREHOUSE) | Planned |
| `REQ-INV-03` | Low Stock Alert Flagging | Query filter `currentStock <= minStockAlert` and dynamic visual badge on UI | Planned |
| `REQ-INV-04` | Stock Movement Audit Log | `StockMovement` table recording `productId`, `quantity`, `type` (`IN`/`OUT`), `reason`, `createdByUserId`, `timestamp` | Planned |
| `REQ-INV-05` | Direct Stock Adjustments | `POST /api/v1/stock-movements` wrapped in DB transaction updating `Product.currentStock` | Planned |

### 4. Sales Challan Module

| Req ID | Requirement Description | Implementation Strategy | Status |
| :--- | :--- | :--- | :--- |
| `REQ-CHAL-01` | Create Sales Challan | `POST /api/v1/challans` accepting customer ID & array of items (`productId`, `quantity`) | Planned |
| `REQ-CHAL-02` | Auto Challan Numbering | System-generated unique sequence identifier (e.g. `CH-2026-00001`) | Planned |
| `REQ-CHAL-03` | Challan Status Workflow | Status enum: `DRAFT`, `CONFIRMED`, `CANCELLED` | Planned |
| `REQ-CHAL-04` | Draft Inventory Rule | Draft creation DOES NOT deduct stock or mutate `currentStock` | Planned |
| `REQ-CHAL-05` | Challan Confirmation | `POST /api/v1/challans/:id/confirm` triggers ACID transaction to validate and deduct inventory | Planned |
| `REQ-CHAL-06` | Negative Stock Prevention | Check `currentStock >= requestedQuantity` with row lock. Fail transaction if insufficient | Planned |
| `REQ-CHAL-07` | Insufficient Stock API Error | Return HTTP 422 Unprocessable Entity with product-level stock deficiency array | Planned |
| `REQ-CHAL-08` | Product Data Snapshot | `SalesChallanItem` stores snapshot `productName`, `sku`, `unitPrice` at time of creation/confirmation | Planned |
| `REQ-CHAL-09` | Challan Cancellation | `POST /api/v1/challans/:id/cancel` (Draft cancels freely; Confirmed restores stock via transaction) | Planned |
| `REQ-CHAL-10` | Summary Calculations | Aggregated fields: total items, total quantity, total valuation amount | Planned |

### 5. Dashboard & Analytics

| Req ID | Requirement Description | Implementation Strategy | Status |
| :--- | :--- | :--- | :--- |
| `REQ-DASH-01` | Key Performance Metrics | Active customer count, total products, low-stock item count, pending draft challans, confirmed sales | Planned |
| `REQ-DASH-02` | Recent Stock Movements Log | Feed displaying last 10 stock movements with user and timestamp | Planned |
| `REQ-DASH-03` | Low Stock Alert Widget | List of products where `currentStock <= minStockAlert` for immediate reorder | Planned |
| `REQ-DASH-04` | Follow-up Reminders Widget | Upcoming customer follow-ups scheduled for today / overdue | Planned |

### 6. API, Architecture & Quality Standards

| Req ID | Requirement Description | Implementation Strategy | Status |
| :--- | :--- | :--- | :--- |
| `REQ-API-01` | Clean REST Principles | Nouns for endpoints, standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`), consistent status codes | Planned |
| `REQ-API-02` | Input Validation | Zod schema validation middleware on request body, params, and queries | Planned |
| `REQ-API-03` | Error Response Standard | Universal JSON error schema `{ success: false, error: { code, message, details } }` | Planned |
| `REQ-API-04` | Pagination & Filtering | Query parameters `page`, `limit`, `search`, `sortBy`, `order` across list endpoints | Planned |
| `REQ-API-05` | Transactional Integrity | Database transactions (`prisma.$transaction`) for multi-step stock mutations | Planned |
| `REQ-API-06` | Testing | Automated unit and integration tests using Jest and Supertest targeting stock rules & authorization | Planned |
| `REQ-API-07` | Environment Security | Zero secrets in repository; loaded via environment variables (`.env`) | Planned |

---

## Verification & Traceability Matrix

Every requirement listed above will be verified before final project completion using the following methods:
1. **Automated Integration Tests**: Backend test suite asserting inventory decrement, snapshot persistence, and transaction rollback on stock deficit.
2. **Role Authorization Tests**: API endpoint permission checks ensuring non-permitted roles receive HTTP 403 Forbidden.
3. **Manual Flow Verification**: Verification of UI state updates across multi-role workflows (Sales creates challan -> Warehouse checks stock -> Confirmation alters inventory).
