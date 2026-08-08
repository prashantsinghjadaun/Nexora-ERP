# Nexora ERP — REST API Specification

## Product Title
**Nexora ERP — Operations & CRM Portal**

---

## 1. Global API Conventions

- **Base URL**: `/api/v1`
- **Data Format**: `application/json` for request bodies and response payloads.
- **Authentication**: JWT sent via HTTP header:
  `Authorization: Bearer <jwt_token>`

---

## 2. HTTP Status Code Conventions

| Status Code | Description | Usage |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Standard response for `GET`, `PUT`, and confirmation actions |
| `201 Created` | Resource created | Returned on successful `POST` operations |
| `400 Bad Request` | Malformed request body | Validation error, schema failure (e.g. attempting manual OUT movement) |
| `401 Unauthorized` | Missing/invalid token | Unauthenticated user (`!req.user`) |
| `403 Forbidden` | Access denied | User lacks required role (`!allowedRoles.includes(req.user.role)`) |
| `404 Not Found` | Resource missing | Requested entity ID does not exist |
| `409 Conflict` | Duplicate resource | Duplicate SKU, email, or unique constraint violation |
| `422 Unprocessable Entity`| Business rule failure | Insufficient stock, attempt to cancel confirmed challan |
| `500 Internal Server Error`| Server crash/error | Unexpected unhandled server exception |

---

## 3. Standard Response Formats

### 3.1 Success Response Payload Structure
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "totalCount": 45,
    "totalPages": 5
  }
}
```

### 3.2 Error Response Payload Structure
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "One or more products have insufficient inventory to confirm this challan.",
    "details": [
      {
        "productId": "prod_99182",
        "productName": "Industrial Steel Rod 12mm",
        "requestedQuantity": 50,
        "availableQuantity": 12
      }
    ]
  }
}
```

---

## 4. Complete Endpoint Catalog

### 4.1 Authentication Module (`/auth`)

#### `POST /api/v1/auth/login`
- **Access**: Public

#### `GET /api/v1/auth/me`
- **Access**: Authenticated (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`)

---

### 4.2 Customer CRM Module (`/customers`)

#### `GET /api/v1/customers`
- **Access**: `ADMIN`, `SALES`, `ACCOUNTS`

#### `POST /api/v1/customers`
- **Access**: `ADMIN`, `SALES`

#### `GET /api/v1/customers/:id`
- **Access**: `ADMIN`, `SALES`, `ACCOUNTS`

#### `PUT /api/v1/customers/:id`
- **Access**: `ADMIN`, `SALES`

#### `POST /api/v1/customers/:id/follow-ups`
- **Access**: `ADMIN`, `SALES`

---

### 4.3 Product Management Module (`/products`)

#### `GET /api/v1/products`
- **Access**: All Authenticated Roles

#### `POST /api/v1/products`
- **Access**: `ADMIN`, `WAREHOUSE`

#### `PUT /api/v1/products/:id`
- **Access**: `ADMIN`, `WAREHOUSE`

---

### 4.4 Inventory & Stock Movements Module (`/stock-movements`)

#### `GET /api/v1/stock-movements`
- **Access**: `ADMIN`, `WAREHOUSE`, `ACCOUNTS`

#### `POST /api/v1/stock-movements`
- **Access**: `ADMIN`, `WAREHOUSE` (Manual Stock Entry)
- **Schema-Level Rules**:
  - **Supports IN Type Only**: For the initial case-study scope, the manual stock movement endpoint accepts `type: "IN"` strictly.
  - **Zod Schema Enforcement**:
    - `productId`: Valid UUID string
    - `quantity`: Positive integer ($> 0$)
    - `type`: Literal `"IN"` strictly
    - `reason`: Required string (minimum 3 characters)
  - **Manual OUT Rejection**: Any attempt to submit `type: "OUT"` is rejected at the API schema boundary with `HTTP 400 Bad Request`.
  - **Systemic Sales OUT Movements**: Sales-related `OUT` stock movements are created strictly internally by the `ChallanService` during Challan Confirmation.
  - **Non-Security Role of `reason`**: The `reason` field is plain metadata describing why the movement occurred. It is **NEVER** used for security or authorization checks.
- **Request Body**:
  ```json
  {
    "productId": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 25,
    "type": "IN",
    "reason": "Purchase received from Acme Supplier (Invoice #INV-992)"
  }
  ```
- **Error Response (400 Bad Request - Manual OUT Attempt)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid input payload",
      "details": [
        {
          "field": "type",
          "message": "Manual stock movements support IN type only. Sales OUT movements are created automatically during Challan Confirmation."
        }
      ]
    }
  }
  ```

---

### 4.5 Sales Challan Module (`/challans`)

#### `GET /api/v1/challans`
- **Access**: All Authenticated Roles

#### `POST /api/v1/challans`
- **Access**: `ADMIN`, `SALES`
- **Behavior**: Creates a `DRAFT` challan. Does **NOT** alter inventory.

#### `POST /api/v1/challans/:id/confirm`
- **Access**: `ADMIN`, `SALES`
- **Single Database Transaction Execution**:
  1. `POST /challans/:id/confirm`
  2. Start database transaction
  3. Validate challan state (must be `DRAFT`)
  4. Validate all item quantities ($> 0$)
  5. Verify sufficient stock ($\text{currentStock} \ge \text{requestedQuantity}$)
  6. Reduce product stock ($\text{currentStock} = \text{currentStock} - \text{quantity}$)
  7. Create corresponding `OUT` stock movements internally
  8. Preserve product snapshot data
  9. Mark challan `CONFIRMED`
  10. Commit transaction
  - **Rollback Guarantee**: If any step fails, the ENTIRE transaction rolls back cleanly with zero stock or document changes.
- **Response (200 OK)**: Confirmed challan payload.
- **Error Response (422 Unprocessable Entity)**: Returns `INSUFFICIENT_STOCK` details if stock is insufficient.

#### `POST /api/v1/challans/:id/cancel`
- **Access**: `ADMIN`, `SALES`
- **Draft Scope Invariant**: **Only `DRAFT` challans may be cancelled.**
- **Confirmed Immutability**: Attempting to cancel a `CONFIRMED` challan returns **HTTP 422 Unprocessable Entity**:
  ```json
  {
    "success": false,
    "error": {
      "code": "CANNOT_CANCEL_CONFIRMED_CHALLAN",
      "message": "Confirmed sales challans cannot be cancelled because inventory has already been deducted and stock movements logged."
    }
  }
  ```

---

### 4.6 Dashboard Analytics Module (`/dashboard`)

#### `GET /api/v1/dashboard/stats`
- **Access**: All Authenticated Roles
