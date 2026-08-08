export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  type: CustomerType;
  address?: string | null;
  status: CustomerStatus;
  nextFollowUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  customerId: string;
  notes: string;
  followUpDate: string;
  createdById: string;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
  };
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  type: MovementType;
  reason: string;
  createdById: string;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
  };
  createdAt: string;
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface SalesChallanItem {
  id: string;
  salesChallanId: string;
  productId: string;
  product?: Product;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
  createdAt: string;
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: Customer;
  status: ChallanStatus;
  totalAmount: number;
  totalQuantity: number;
  notes?: string | null;
  createdById: string;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
  };
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: SalesChallanItem[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}
