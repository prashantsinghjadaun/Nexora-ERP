# Nexora ERP — Business Rules & Logic Specification

## Product Title
**Nexora ERP — Operations & CRM Portal**

---

## 1. Sales Challan Lifecycle & Rules

The Sales Challan workflow governs sales processing and inventory allocation.

```
       +-------------------+
       |   Create Order    |
       +---------+---------+
                 |
                 v
       +-------------------+
       |  Status: DRAFT    | <--- Inventory remains unchanged
       +----+---------+----+
            |         |
  Cancel    |         | Confirm
  (Allowed) |         | (Single Atomic Transaction)
            v         v
+---------------+  +---------------------+
|  CANCELLED    |  |  Status: CONFIRMED  | <--- Single Database Transaction:
| (No Stock Delta)| | (Stock Reduced,     |      1. Validate challan state (DRAFT)
+---------------+  |  Internal OUT logged|      2. Validate item quantities (>0)
                   |  Snapshots saved)   |      3. Verify sufficient stock
                   +---------------------+      4. Reduce product stock
                              |                 5. Create OUT stock movements internally
                              |                 6. Mark challan CONFIRMED
                     Cancel   |                 7. Commit transaction
                  (FORBIDDEN) |                 (Rollback ALL on any failure)
                              v
                   +---------------------+
                   |   ERROR HTTP 422    | <--- Confirmed challans CANNOT
                   | "Cannot cancel      |      be cancelled in case study scope
                   |  confirmed order"   |
                   +---------------------+
```

### 1.1 Draft State Rules (`DRAFT`)
1. **No Inventory Reservation**: Creating or modifying a draft challan does **NOT** reduce physical inventory or reserve stock.
2. **Snapshot Initialization**: Items added to a draft challan record snapshot metadata (`productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`) based on active catalog prices at time of creation/modification.
3. **Editable Fields**: Quantities and item lists in a draft challan can be updated freely by `SALES` or `ADMIN` roles.
4. **Cancellation**: A `DRAFT` challan may be cancelled at any time by transitioning its status to `CANCELLED`. This has zero effect on inventory.

### 1.2 Confirmation State Rules (`CONFIRMED`)
1. **Single Database Transaction**: Transitioning from `DRAFT` to `CONFIRMED` MUST be executed within a single database ACID transaction (`prisma.$transaction`).
2. **Atomic Flow During Confirmation**:
   - **Validate Challan State**: Verify that the target challan exists and is strictly in `DRAFT` status.
   - **Validate All Quantities**: Verify that all requested item quantities are valid integers $> 0$.
   - **Verify Sufficient Stock**: For every product in the order, verify that:
     $$\text{currentStock} \ge \text{requestedQuantity}$$
   - **Reduce Product Stock**: Atomically decrement `Product.currentStock = currentStock - quantity`.
   - **Create OUT Stock Movements**: Systematically create an internal `StockMovement` entry of type `OUT` for each item, recording `productId`, `quantity`, `type: 'OUT'`, `reason: "Sales Challan #<challanNumber>"`, and `createdById`.
   - **Preserve Product Snapshots**: Lock and store `productNameSnapshot`, `skuSnapshot`, and `unitPriceSnapshot` on `SalesChallanItem` to freeze historic document state.
   - **Mark Challan CONFIRMED**: Update `SalesChallan.status = 'CONFIRMED'` and record `confirmedAt = NOW()`.
   - **Commit Transaction**: Complete the database transaction atomically.
3. **Strict Rollback Guarantee**: If any step fails within the transaction (validation error, stock deficit, DB error):
   - The ENTIRE transaction MUST immediately abort and roll back.
   - Zero stock changes or status mutations persist.
   - The API returns HTTP 422 Unprocessable Entity containing error details.

### 1.3 Cancellation Rules & Scope Invariant
1. **Draft Challans Only**: **Only `DRAFT` challans may be cancelled.**
2. **Confirmed Challan Immutability**: **`CONFIRMED` challans CANNOT be cancelled through the cancellation endpoint.** Because confirmed challans have already altered physical inventory and generated immutable audit movements, cancelling a confirmed challan is forbidden in the initial case-study scope.
3. **API Restriction**: Attempting to call `POST /api/v1/challans/:id/cancel` on a `CONFIRMED` challan will result in HTTP 422 Unprocessable Entity with error code `CANNOT_CANCEL_CONFIRMED_CHALLAN`.

---

## 2. Inventory Invariants & Stock Movement Rules

### 2.1 Non-Negative Stock Invariant & Defense in Depth
1. **Database Constraint**: Database column constraints (`CHECK (currentStock >= 0)`) guarantee non-negative stock at the database level.
2. **Service Layer Defense in Depth**: The service layer explicitly enforces inventory invariants before attempting any stock reduction. System integrity never relies solely on frontend validation or request schema validation.

### 2.2 Manual Stock Movement Endpoint (`POST /api/v1/stock-movements`)
1. **Manual IN Movements Only**: For the initial case-study scope, the manual stock movement endpoint supports manual `IN` stock movements **ONLY** (e.g. `type: 'IN'`).
2. **Schema-Level Rejection of Manual OUT**: The manual endpoint rejects any attempt to submit a `type: 'OUT'` movement at the request schema validation layer (`z.literal('IN')`).
3. **Internal Creation of OUT Movements**: All `OUT` stock movements are created strictly internally by the `ChallanService` during Challan Confirmation inside an atomic database transaction.
4. **Descriptive Role of `reason` Field**: The `reason` text field (e.g. `"Purchase order #101 received"`) is audit metadata only. It is **NEVER** used for security checks, authorization decisions, or movement logic.

---

## 3. Customer & CRM Rules

1. **Unique Identity**: Every customer record requires a unique business name or contact email/mobile combination.
2. **GST Validation**: When provided, `gstNumber` must conform to standard Indian GSTIN formatting (15 alphanumeric characters).
3. **Follow-Up Scheduling**:
   - Logging a follow-up interaction automatically updates `Customer.nextFollowUpDate` and records an entry in the `FollowUp` audit table.
   - Overdue follow-ups ($\text{nextFollowUpDate} < \text{NOW()}$ while `status == LEAD`) are highlighted on the CRM dashboard.

---

## 4. Input Validation Standards

All data entering the API boundary is validated using Zod schemas before reaching the service layer:
- **Email**: Must be a valid format (`user@domain.com`).
- **Mobile**: Must be 10–15 digits.
- **SKU**: Alphanumeric code without spaces (e.g. `PROD-ELEC-001`).
- **Manual Stock Movement Payload**:
  - `productId`: Valid UUID string
  - `quantity`: Positive integer ($> 0$)
  - `type`: Literal `"IN"` strictly
  - `reason`: Required string with minimum 3 characters (audit metadata only)

---

## 5. Edge Cases & Concurrency Handling

| Edge Case Scenario | Potential Risk | Mitigation & Resolution Strategy |
| :--- | :--- | :--- |
| **Manual Attempt to Submit OUT Movement** | Client submits `POST /api/v1/stock-movements` with `type: 'OUT'`. | Rejected immediately at the Zod request schema validation layer with HTTP 400 Bad Request (`type must be 'IN'`). |
| **Client Arbitrary Reason Text** | Client sends `type: 'IN'` with `reason: "Arbitrary text"`. | Operation succeeds as a manual IN movement. The `reason` field is treated strictly as plain text metadata and does NOT affect authorization or security logic. |
| **Concurrent Challan Confirmation** | Two sales agents confirm challans for limited stock simultaneously. | Single Prisma transaction executes updates sequentially. First transaction succeeds; second transaction detects stock deficiency and rolls back safely with HTTP 422. |
| **Attempt to Cancel Confirmed Order** | User attempts to cancel a confirmed challan. | API enforces Rule 1.3: Returns HTTP 422 `CANNOT_CANCEL_CONFIRMED_CHALLAN`. |
