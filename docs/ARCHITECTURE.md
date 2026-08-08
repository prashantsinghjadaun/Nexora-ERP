# Nexora ERP — Architecture Specification

## Product Title
**Nexora ERP — Operations & CRM Portal**

---

## 1. High-Level System Architecture

Nexora ERP is engineered as a decoupled, full-stack client-server web application. The frontend is a single-page application (SPA) built with React and TypeScript, while the backend is a RESTful API service built with Node.js, Express, and TypeScript, backed by PostgreSQL through Prisma ORM.

```
+-----------------------------------------------------------------------+
|                            USER BROWSER                               |
|  +-----------------------------------------------------------------+  |
|  |                 React + TypeScript Single Page App              |  |
|  |  [ Auth Provider ] -> [ Router Guards ] -> [ Dynamic UI Views ] |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------||----------------------------------+
                                    || HTTPS / REST (JSON)
                                    || Authorization: Bearer <JWT>
+-----------------------------------\/----------------------------------+
|                            BACKEND SERVER                             |
|  +-----------------------------------------------------------------+  |
|  |                         Express.js Router                       |  |
|  +-----------------------------------------------------------------+  |
|                                   ||                                  |
|  +--------------------------------\/-------------------------------+  |
|  |                Middleware Stack (Auth JWT + RBAC + Zod)         |  |
|  +-----------------------------------------------------------------+  |
|                                   ||                                  |
|  +--------------------------------\/-------------------------------+  |
|  |                       Controller Layer                          |  |
|  +-----------------------------------------------------------------+  |
|                                   ||                                  |
|  +--------------------------------\/-------------------------------+  |
|  |             Service Layer (Domain & Transaction Logic)          |  |
|  +-----------------------------------------------------------------+  |
|                                   ||                                  |
|  +--------------------------------\/-------------------------------+  |
|  |                      Prisma ORM Client                          |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------||----------------------------------+
                                    || SQL / Connection Pool
+-----------------------------------\/----------------------------------+
|                           DATABASE LAYER                              |
|  +-----------------------------------------------------------------+  |
|  |                     PostgreSQL Database                         |  |
|  |  (Tables, Indexes, Foreign Keys, ACID Row-Level Locking)       |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
```

---

## 2. Frontend Architecture (React + TypeScript)

### 2.1 Technical Core
- **Framework**: React 18+ with TypeScript (strict mode enabled).
- **Styling**: Modern Vanilla CSS with CSS custom properties (design system design tokens), modern layouts (Flexbox, CSS Grid), and smooth micro-animations.
- **State Management**:
  - React Context API for global session and authentication state (`AuthContext`).
  - React Hooks (`useCustomFetch`, custom feature hooks) for server data synchronization, caching, and state updates.
- **Routing**: Client-side routing with role-based route guards (`ProtectedRoute` component).

### 2.2 Component Hierarchy & Directory Structure
```
frontend/
├── src/
│   ├── assets/              # Static assets, SVG icons
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Buttons, Modal, Table, Input, Badge, Toast, Loader
│   │   ├── layout/          # Header, Sidebar, AppLayout, PageContainer
│   │   └── guards/          # ProtectedRoute, RoleGuard
│   ├── context/             # AuthContext, NotificationContext
│   ├── hooks/               # useAuth, useDebounce, useForm, useFetch
│   ├── pages/               # Page components
│   │   ├── auth/            # LoginPage
│   │   ├── dashboard/       # DashboardPage
│   │   ├── customers/       # CustomerListPage, CustomerDetailPage, CustomerFormPage
│   │   ├── inventory/       # ProductListPage, ProductDetailPage, StockMovementModal
│   │   └── challans/        # ChallanListPage, ChallanDetailPage, CreateChallanPage
│   ├── services/            # API client methods (auth, customers, products, challans)
│   ├── types/               # TypeScript interfaces & API payload schemas
│   ├── utils/               # Currency formatters, date formatters, validation helpers
│   ├── App.tsx              # Main routing & application initialization
│   ├── main.tsx             # DOM root mounting
│   └── index.css            # Global design tokens, reset, typography, & utility classes
```

### 2.3 API Integration Strategy
- Centralized HTTP client (`apiClient.ts`) handling base URLs, default headers, request interceptors (attaching JWT token), and response interceptors (unified error parsing and automatic logout on 401 Unauthorized).

---

## 3. Backend Architecture (Node.js + Express + TypeScript)

### 3.1 Layered Architecture Pattern
To guarantee separation of concerns and maintainability, code is strictly divided into distinct layers:

1. **Routes Layer (`/routes`)**: Defines API endpoints, HTTP verbs, and mounts middleware. Contains zero business logic.
2. **Middleware Layer (`/middleware`)**: Handles cross-cutting concerns: authentication (`authenticate`), authorization (`authorize`), input validation (`validate`), request logging, and centralized error catching (`errorHandler`).
3. **Controller Layer (`/controllers`)**: Extracts HTTP request payload/params/query, calls appropriate services, and shapes the HTTP response code and payload.
4. **Service Layer (`/services`)**: Contains all core domain rules, transaction orchestrations, data calculations, and inventory validations.
5. **Data Access Layer (`/prisma`)**: Interacts directly with PostgreSQL database through generated Prisma Client types.

```
backend/
├── src/
│   ├── config/              # Environment variables, CORS, JWT secrets config
│   ├── controllers/         # AuthController, CustomerController, ProductController, ChallanController
│   ├── errors/              # Custom AppError classes (BadRequestError, UnauthorizedError, ConflictError, InsufficientStockError)
│   ├── middleware/          # authMiddleware, roleMiddleware, validateMiddleware, errorMiddleware
│   ├── routes/              # authRoutes, customerRoutes, productRoutes, stockRoutes, challanRoutes, dashboardRoutes
│   ├── services/            # AuthService, CustomerService, ProductService, StockService, ChallanService
│   ├── types/               # Express request augmentations, JWT payloads, DTOs
│   ├── utils/               # Password hasher, logger, challan number generator
│   ├── validators/          # Zod schemas for request payload validation
│   └── app.ts               # Express server configuration & middleware mounting
├── prisma/
│   ├── schema.prisma        # Prisma Schema definition
│   └── seed.ts              # Initial seed script for roles and admin users
├── index.ts                 # Server entrypoint listening on PORT
```

---

## 4. Database Layer Architecture

- **Database Engine**: PostgreSQL 15+.
- **ORM**: Prisma ORM for schema migration management, type safety, and query construction.
- **Connection Management**: PostgreSQL connection pool configured via environment variables (`DATABASE_URL`).
- **Data Integrity**:
  - Foreign key constraints with explicit delete rules (`RESTRICT` to prevent accidental orphaned historical transactions).
  - Explicit decimal precision (`Decimal(12, 2)`) for all financial prices and valuations.
  - Snapshot fields in transaction item tables for historical immutability.

---

## 5. Security & Authentication Architecture

### 5.1 Password Security
- Passwords hashed using `bcrypt` with a minimum cost factor (salt rounds) of 10.
- Raw passwords are never logged, stored in cleartext, or returned in API responses.

### 5.2 Token-Based Authentication (JWT)
- On successful credentials verification at `POST /api/v1/auth/login`, the server returns a signed JWT.
- Token payload contains:
  ```json
  {
    "userId": "usr_c123456789",
    "email": "sales@nexora.com",
    "role": "SALES",
    "iat": 1770536400,
    "exp": 1770572400
  }
  ```
- Client stores JWT in browser local storage / memory and transmits it in the `Authorization: Bearer <jwt_token>` HTTP request header.

---

## 6. Role-Based Authorization Architecture

Authorization occurs at two levels:
1. **Backend Enforcement (Mandatory)**: Middleware `requireRole(['ADMIN', 'SALES'])` inspects `req.user.role`. If authorized, execution proceeds to the controller; otherwise, an immediate HTTP 403 Forbidden response is issued.
2. **Frontend UI Rendering (UX Enhancement)**: Navigation links and actionable buttons (e.g. "Confirm Challan", "Adjust Stock") are conditionally rendered based on the user's role obtained from `AuthContext`.

---

## 7. Service Boundaries & Decoupling

Domain services are encapsulated to allow clean testing and modular expansion:
- **`AuthService`**: Credential validation, token issuance, user session fetch.
- **`CustomerService`**: Customer creation, filtering, update, and follow-up logging.
- **`ProductService`**: Product catalog CRUD, stock alert queries.
- **`StockService`**: Direct manual stock adjustments (IN/OUT), logging stock movements within transactions.
- **`ChallanService`**: Creation of draft challans, validation of stock levels, transactional confirmation (stock reduction + movement creation + snapshot recording), and cancellation.

---

## 8. Production Deployment Architecture

```
                       +-------------------------------+
                       |        Frontend Client        |
                       |       Hosted on Vercel        |
                       |    (Static SPA Bundle CDN)    |
                       +---------------+---------------+
                                       |
                                       | HTTPS (API Calls)
                                       v
                       +---------------+---------------+
                       |        Backend API Server     |
                       |       Hosted on Render        |
                       |      (Node.js / Express)      |
                       +---------------+---------------+
                                       |
                                       | Encrypted Database Connection
                                       v
                       +---------------+---------------+
                       |       PostgreSQL Database     |
                       |    Hosted on Neon / Supabase  |
                       |      (Managed Serverless)     |
                       +-------------------------------+
```

### Environment Configuration Variables
- `NODE_ENV`: `development` | `production` | `test`
- `PORT`: Server listening port (default `5000`)
- `DATABASE_URL`: Connection string for PostgreSQL database
- `JWT_SECRET`: Secret key for JWT signing and verification
- `JWT_EXPIRES_IN`: Token validity duration (e.g. `10h`)
- `CORS_ORIGIN`: Allowed frontend origin URL for cross-origin resource sharing
