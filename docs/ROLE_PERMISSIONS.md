# Nexora ERP — Role & Permission Matrix

## Product Title
**Nexora ERP — Operations & CRM Portal**

---

## 1. Executive Role Summaries

Nexora ERP enforces role-based access control (RBAC) across 4 standard enterprise personas:

1. **ADMIN** (System Administrator)
   - Full access to system configuration, user accounts, and business modules.
   - May execute manual IN stock movements. Manual OUT movements are rejected by request schema validation.
   - May create, edit, confirm, or cancel DRAFT Sales Challans. Cannot cancel CONFIRMED challans.

2. **SALES** (Sales Executive / CRM Representative)
   - Full management of customer profiles and follow-up activities.
   - Creation, editing, and confirmation of Sales Challans (triggering systemic internal stock deduction).
   - Can cancel DRAFT challans only. Cannot cancel CONFIRMED challans.
   - Read-only access to product catalog prices and available stock levels.

3. **WAREHOUSE** (Warehouse / Operations Manager)
   - Full management of product master catalog (SKU, price, alert threshold, location).
   - Execution of manual IN stock movements (`PURCHASE_RECEIVED`, `OPENING_STOCK`, `STOCK_CORRECTION`). Manual OUT movements are rejected by schema validation.
   - Read-only access to customer names and confirmed Sales Challans for order fulfillment.

4. **ACCOUNTS** (Financial / Accounting Auditor)
   - View-only access to customers, sales challans, invoice valuations, and stock movement logs.
   - Cannot create, edit, or confirm sales orders or alter product stock.

---

## 2. Layered Architecture: Security, Validation & Business Logic

The system enforces clear separation of concerns across request execution layers:

```
[ Incoming Request ]
        |
        v
+-----------------------------------------------------------+
| 1. Authentication & Role Check: requireRole(['ADMIN',...])| <--- Validates Session & User Role
+-----------------------------+-----------------------------+
                              |
                              v
+-----------------------------------------------------------+
| 2. Request Schema Validation Layer (Zod)                  | <--- Enforces Valid Syntax &
|    (Restricts manual stock movement type to literal 'IN') |      Rejects Manual OUT
+-----------------------------+-----------------------------+
                              |
                              v
+-----------------------------------------------------------+
| 3. Service Layer Business Invariants                      | <--- Defense in Depth: Enforces
|    (ChallanService.confirmChallan within Transaction)     |      Stock Invariants & Systemic
+-----------------------------------------------------------+      Internal OUT Movements
```

1. **Role Authorization (`requireRole`)**: Pure authentication check (401 `UNAUTHORIZED`) and role permission check (403 `FORBIDDEN`).
2. **Request Validation (Zod Schema)**: Restricts manual stock endpoint (`POST /api/v1/stock-movements`) to `type: 'IN'` strictly.
3. **Service Layer Business Logic**: Enforces inventory invariants as defense in depth. Manages single-transaction atomic confirmation, stock verification, stock reduction, snapshot freezing, and internal `OUT` stock movement creation.
4. **Metadata Role of `reason` Field**: The `reason` field is plain descriptive metadata. It is **NEVER** evaluated for security, authorization, or movement logic.

---

## 3. Comprehensive Permission Matrix

| Module / Action | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
| :--- | :---: | :---: | :---: | :---: |
| **Authentication & Profile** | | | | |
| User Login & Fetch Self Profile | ✅ | ✅ | ✅ | ✅ |
| Manage System Users & Roles | ✅ | ❌ | ❌ | ❌ |
| **Customer CRM** | | | | |
| View Customer List & Detail | ✅ | ✅ | ❌ | ✅ |
| Add / Edit Customer Profile | ✅ | ✅ | ❌ | ❌ |
| Search & Filter Customers | ✅ | ✅ | ❌ | ✅ |
| Log Customer Follow-Up Notes | ✅ | ✅ | ❌ | ❌ |
| Delete Customer Record | ✅ | ❌ | ❌ | ❌ |
| **Product Master Catalog** | | | | |
| View Product Catalog & Stock | ✅ | ✅ | ✅ | ✅ |
| Add / Edit Product Entry | ✅ | ❌ | ✅ | ❌ |
| View Low Stock Alerts | ✅ | ✅ | ✅ | ✅ |
| **Inventory & Stock Movements**| | | | |
| View Stock Movement History | ✅ | ❌ | ✅ | ✅ |
| Execute Manual IN Stock Movement | ✅ | ❌ | ✅ | ❌ |
| Execute Manual OUT Stock Movement | ❌ *(Rejected by Schema)* | ❌ | ❌ | ❌ |
| **Sales Challans** | | | | |
| View Sales Challans | ✅ | ✅ | ✅ | ✅ |
| Create & Edit Draft Sales Challan | ✅ | ✅ | ❌ | ❌ |
| Confirm Sales Challan (Triggers Atomic Transaction & Internal OUT Movement) | ✅ | ✅ | ❌ | ❌ |
| Cancel DRAFT Sales Challan | ✅ | ✅ | ❌ | ❌ |
| Cancel CONFIRMED Sales Challan | ❌ *(Forbidden)* | ❌ *(Forbidden)* | ❌ | ❌ |
| **Executive Dashboard** | | | | |
| View High-Level Metrics & KPIs | ✅ | ✅ | ✅ | ✅ |

---

## 4. API Endpoint Protection Mapping

| Endpoint | HTTP Method | Permitted Roles | Business Rules & Schema Enforcement |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/login` | `POST` | Public | Credential validation |
| `/api/v1/auth/me` | `GET` | `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS` | Active session profile |
| `/api/v1/customers` | `GET` | `ADMIN`, `SALES`, `ACCOUNTS` | Paginated CRM list |
| `/api/v1/customers` | `POST` | `ADMIN`, `SALES` | Create customer |
| `/api/v1/customers/:id` | `GET` | `ADMIN`, `SALES`, `ACCOUNTS` | Customer detail |
| `/api/v1/customers/:id` | `PUT` | `ADMIN`, `SALES` | Edit customer |
| `/api/v1/customers/:id/follow-ups` | `POST` | `ADMIN`, `SALES` | Log follow-up note |
| `/api/v1/products` | `GET` | `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS` | Product catalog |
| `/api/v1/products` | `POST` | `ADMIN`, `WAREHOUSE` | Create product |
| `/api/v1/products/:id` | `PUT` | `ADMIN`, `WAREHOUSE` | Edit product |
| `/api/v1/stock-movements` | `GET` | `ADMIN`, `WAREHOUSE`, `ACCOUNTS` | Audit log |
| `/api/v1/stock-movements` | `POST` | `ADMIN`, `WAREHOUSE` | **Manual IN movements only**. Zod schema restricts `type` to literal `'IN'`. |
| `/api/v1/challans` | `GET` | `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS` | Challans list |
| `/api/v1/challans` | `POST` | `ADMIN`, `SALES` | Create draft challan |
| `/api/v1/challans/:id` | `GET` | `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS` | Challan detail |
| `/api/v1/challans/:id/confirm` | `POST` | `ADMIN`, `SALES` | **Single atomic transaction**: validates state, quantities, stock, reduces inventory, logs internal OUT movements, sets CONFIRMED. Rollback on failure. |
| `/api/v1/challans/:id/cancel` | `POST` | `ADMIN`, `SALES` | **DRAFT challans only**. Confirmed challans return HTTP 422. |
| `/api/v1/dashboard/stats` | `GET` | `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS` | Executive metrics |

---

## 5. Code Pattern Implementation

### 5.1 Authorization Middleware (`requireRole`)

```typescript
import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Authentication Check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.'
        }
      });
    }

    // 2. Role Authorization Check
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied.'
        }
      });
    }

    // 3. Authorized
    next();
  };
};
```

### 5.2 Manual Stock Movement Validation Schema

```typescript
import { z } from 'zod';

export const createManualStockMovementSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  type: z.literal('IN', {
    errorMap: () => ({
      message: 'Manual stock movements support IN type only. Sales OUT movements are created automatically during Challan Confirmation.'
    })
  }),
  reason: z.string().min(3, 'Reason must be at least 3 characters long')
});
```
