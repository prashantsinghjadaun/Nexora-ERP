# Nexora ERP — Development & Implementation Guide

## Product Title
**Nexora ERP — Operations & CRM Portal**

---

## 1. Implementation Phases & Roadmap

Development will proceed in 9 sequential phases to ensure systematic building and verification without regressions:

```
[Phase 1: Architecture & Docs] ---> [Phase 2: Backend Core & DB] ---> [Phase 3: Auth & Security]
                                                                                |
[Phase 6: Frontend Foundation] <--- [Phase 5: REST API Routes] <--- [Phase 4: Domain Services]
               |
               v
[Phase 7: UI Modules & Pages] ---> [Phase 8: Integration & Test] ---> [Phase 9: Deployment]
```

### Phase Breakdown
1. **Phase 1: Architecture & Technical Documentation** *(Completed)*
   - Finalize `/docs/` technical documentation, schemas, and system architecture specs.
2. **Phase 2: Backend Core & Database Initialization**
   - Setup Node.js + Express + TypeScript backend scaffold.
   - Configure Prisma ORM with PostgreSQL connection string.
   - Execute database migrations for core tables and indexes.
   - Implement seed script (`seed.ts`) populating default roles and test users.
3. **Phase 3: Authentication & Authorization Engine**
   - Implement bcrypt password hashing & verification utilities.
   - Build JWT signing and validation services.
   - Implement `authenticateJWT` authentication middleware.
   - Implement `requireRole` RBAC authorization middleware.
4. **Phase 4: Business Logic Domain Services & Unit Tests**
   - Build `CustomerService` (CRM CRUD and follow-ups).
   - Build `ProductService` (Catalog CRUD and low stock checks).
   - Build `StockService` (Direct stock movement logging & adjustments).
   - Build `ChallanService` (Draft creation, stock validation, ACID transaction for confirmation, snapshot recording, cancellation).
   - Write comprehensive backend tests using Jest & Supertest asserting stock transaction rules.
5. **Phase 5: REST API Controllers & Routes**
   - Mount Zod validation schemas across all incoming requests.
   - Wire controllers to domain services and register express routes.
   - Implement standardized error handling middleware.
6. **Phase 6: Frontend App Foundation & Auth Integration**
   - Setup React + TypeScript app scaffold.
   - Implement CSS design tokens, custom properties, and UI layout grid.
   - Build central API client (`apiClient.ts`) with Bearer token injection.
   - Implement `AuthContext` and route protection components (`ProtectedRoute`, `RoleGuard`).
7. **Phase 7: Frontend Modules & Administrative Views**
   - Build Dashboard Page (Metrics cards, stock alert widgets, recent activity feed).
   - Build Customer CRM Pages (List, detail view, add/edit modal, follow-up modal).
   - Build Inventory Management Pages (Product list, low stock badges, direct stock adjustment modal).
   - Build Sales Challan Pages (Multi-item challan creation form, item pricing snapshots, status transition controls).
8. **Phase 8: Integration Testing, Auditing & UX Polish**
   - Perform end-to-end verification across all 4 user roles.
   - Validate responsive layouts on mobile, tablet, and desktop screens.
   - Audit edge cases (concurrent orders, insufficient stock UI error display).
9. **Phase 9: Deployment & Handover Documentation**
   - Deploy PostgreSQL database on Neon / Supabase.
   - Deploy Node.js Express backend on Render / Railway.
   - Deploy React SPA frontend on Vercel / Netlify.
   - Prepare test credentials, Postman collection, and project README.

---

## 2. Local Setup & Workflow

### 2.1 Prerequisites
- **Node.js**: `v18.x` or `v20.x` LTS
- **npm**: `v9.x` or later
- **PostgreSQL**: `v15.x` local server or cloud database URL (Neon/Supabase)

### 2.2 Environment Configuration
Create a `.env` file in the backend root:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexora_erp?schema=public"
JWT_SECRET="nexora_super_secret_jwt_key_2026_production_grade"
JWT_EXPIRES_IN="10h"
CORS_ORIGIN="http://localhost:3000"
```

### 2.3 Database Setup Commands
```bash
# Generate Prisma Client
npx prisma generate

# Push database schema migrations
npx prisma migrate dev --name init_nexora_schema

# Seed database with initial roles & test users
npx prisma db seed
```

---

## 3. Git & Commit Strategy

Commits will adhere strictly to Conventional Commits specification:

- `chore: initialize Nexora ERP architecture`
- `feat: configure backend foundation`
- `feat: add database schema`
- `feat: implement authentication`
- `feat: implement role authorization`
- `feat: implement customer CRM`
- `feat: implement inventory management`
- `feat: implement stock movements`
- `feat: implement sales challans`
- `test: add challan business logic tests`
- `feat: implement frontend dashboard`
- `feat: implement CRM interface`
- `feat: implement inventory interface`
- `feat: implement challan interface`
- `docs: add API documentation`
- `docs: add deployment documentation`

---

## 4. Testing Strategy

### 4.1 Backend Integration Testing
Tests are written with Jest and Supertest against a test PostgreSQL database:
1. **Auth Suite**: Validates login token issuance, password mismatch handling, and role extraction.
2. **Stock Transaction Suite**: Tests confirming challans against sufficient stock (asserts inventory decrement & `StockMovement` row creation).
3. **Insufficient Stock Rollback Suite**: Attempts confirming a challan requiring 100 units when stock is 10. Verifies HTTP 422 return, transaction rollback, and zero stock change.
4. **Historical Snapshot Suite**: Updates product price after challan creation; asserts challan subtotal remains unchanged.

---

## 5. Deployment Workflow

1. **Database Deployment**: Provision PostgreSQL instance on Neon or Supabase. Run `npx prisma migrate deploy`.
2. **Backend API Deployment**: Connect GitHub repo to Render / Railway. Configure build command `npm run build` and start command `node dist/index.js`. Inject production environment variables.
3. **Frontend SPA Deployment**: Connect GitHub repo to Vercel. Set build command `npm run build` and output folder `dist`. Set `VITE_API_BASE_URL` pointing to backend API.
