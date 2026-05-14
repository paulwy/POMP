import apiClient from '@/api/client';

export interface Product {
  id: string;
  product_code: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  spec?: string;
  purchase_price: number;
  sale_price: number;
  min_stock: number;
  max_stock?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  warehouse_code: string;
  name: string;
  location?: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  warehouse_id: string;
  warehouse_name?: string;
  quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  product_name?: string;
  warehouse_id: string;
  warehouse_name?: string;
  change_type: string;
  quantity_before: number;
  quantity_change: number;
  quantity_after: number;
  reference_type?: string;
  reference_id?: string;
  remark?: string;
  created_by?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  supplier_code: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id?: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  amount?: number;
  remark?: string;
}

export interface PurchaseOrder {
  id: string;
  order_no: string;
  supplier_id?: string;
  supplier_name?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  order_date: string;
  expected_date?: string;
  status: string;
  total_amount: number;
  tax_amount: number;
  discount: number;
  remark?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  items?: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PurchaseReceipt {
  id: string;
  receipt_no: string;
  order_id?: string;
  supplier_id?: string;
  supplier_name?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  receipt_date: string;
  status: string;
  total_quantity: number;
  total_amount: number;
  remark?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalesOrderItem {
  id?: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  amount?: number;
  remark?: string;
}

export interface SalesOrder {
  id: string;
  order_no: string;
  customer_id?: string;
  customer_name?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  order_date: string;
  delivery_date?: string;
  status: string;
  total_amount: number;
  tax_amount: number;
  discount: number;
  remark?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  items?: SalesOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface SalesShipment {
  id: string;
  shipment_no: string;
  order_id?: string;
  customer_id?: string;
  customer_name?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  shipment_date: string;
  status: string;
  total_quantity: number;
  total_amount: number;
  remark?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoucherItem {
  id?: string;
  account_id: string;
  account_name?: string;
  account_code?: string;
  debit: number;
  credit: number;
  remark?: string;
}

export interface Voucher {
  id: string;
  voucher_no: string;
  voucher_date: string;
  voucher_type: string;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  status: string;
  total_debit: number;
  total_credit: number;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  items?: VoucherItem[];
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  payment_no: string;
  payment_type: string;
  party_type: string;
  party_id?: string;
  party_name?: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_type?: string;
  reference_id?: string;
  remark?: string;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  product_code: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  spec?: string;
  purchase_price?: number;
  sale_price?: number;
  min_stock?: number;
  max_stock?: number;
}

export interface CreateWarehouseRequest {
  warehouse_code: string;
  name: string;
  location?: string;
  manager_id?: string;
}

export interface CreateSupplierRequest {
  supplier_code: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CreatePurchaseOrderRequest {
  supplier_id?: string;
  warehouse_id?: string;
  expected_date?: string;
  remark?: string;
  items: PurchaseOrderItem[];
}

export interface CreateCustomerRequest {
  customer_code: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CreateSalesOrderRequest {
  customer_id?: string;
  warehouse_id?: string;
  delivery_date?: string;
  remark?: string;
  items: SalesOrderItem[];
}

export interface CreateAccountRequest {
  account_code: string;
  account_name: string;
  account_type: string;
  parent_id?: string;
}

export interface CreateVoucherRequest {
  voucher_type: string;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  items: VoucherItem[];
}

export interface CreatePaymentRequest {
  payment_type: string;
  party_type: string;
  party_id?: string;
  amount: number;
  payment_method: string;
  reference_type?: string;
  reference_id?: string;
  remark?: string;
}

export const erpInventoryApi = {
  async getProducts(page?: number, pageSize?: number, category?: string): Promise<Product[]> {
    const params: Record<string, string> = {};
    if (page !== undefined) params.page = page.toString();
    if (pageSize !== undefined) params.page_size = pageSize.toString();
    if (category) params.category = category;
    
    const response = await apiClient.get('/v1/erp/products', { params });
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  async getProduct(id: string): Promise<Product> {
    const response = await apiClient.get(`/v1/erp/products/${id}`);
    return response.data?.data || response.data;
  },

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await apiClient.post('/v1/erp/products', data);
    return response.data?.data || response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/v1/erp/products/${id}`);
  },

  async getWarehouses(): Promise<Warehouse[]> {
    const response = await apiClient.get('/v1/erp/warehouses');
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  async createWarehouse(data: CreateWarehouseRequest): Promise<Warehouse> {
    const response = await apiClient.post('/v1/erp/warehouses', data);
    return response.data?.data || response.data;
  },

  async deleteWarehouse(id: string): Promise<void> {
    await apiClient.delete(`/v1/erp/warehouses/${id}`);
  },

  async getInventory(warehouseId?: string, productId?: string): Promise<Inventory[]> {
    const params: Record<string, string> = {};
    if (warehouseId) params.warehouse_id = warehouseId;
    if (productId) params.product_id = productId;
    
    const response = await apiClient.get('/v1/erp/inventory', { params });
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  async getInventoryLogs(page?: number, pageSize?: number): Promise<InventoryLog[]> {
    const params: Record<string, string> = {};
    if (page !== undefined) params.page = page.toString();
    if (pageSize !== undefined) params.page_size = pageSize.toString();
    
    const response = await apiClient.get('/v1/erp/inventory-logs', { params });
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },
};

export const erpPurchaseApi = {
  async getSuppliers(): Promise<Supplier[]> {
    const response = await apiClient.get('/v1/erp/suppliers');
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  async getSupplier(id: string): Promise<Supplier> {
    const response = await apiClient.get(`/v1/erp/suppliers/${id}`);
    return response.data?.data || response.data;
  },

  async createSupplier(data: CreateSupplierRequest): Promise<Supplier> {
    const response = await apiClient.post('/v1/erp/suppliers', data);
    return response.data?.data || response.data;
  },

  async deleteSupplier(id: string): Promise<void> {
    await apiClient.delete(`/v1/erp/suppliers/${id}`);
  },

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const response = await apiClient.get('/v1/erp/purchase-orders');
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  async getPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.get(`/v1/erp/purchase-orders/${id}`);
    return response.data?.data || response.data;
  },

  async createPurchaseOrder(data: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
    const response = await apiClient.post('/v1/erp/purchase-orders', data);
    return response.data?.data || response.data;
  },

  async getPurchaseReceipts(): Promise<PurchaseReceipt[]> {
    const response = await apiClient.get('/v1/erp/purchase-receipts');
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },
};

export const erpSalesApi = {
  async getCustomers(): Promise<Customer[]> {
    const response = await apiClient.get('/v1/erp/customers');
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  async getCustomer(id: string): Promise<Customer> {
    const response = await apiClient.get(`/v1/erp/customers/${id}`);
    return response.data?.data || response.data;
  },

  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const response = await apiClient.post('/v1/erp/customers', data);
    return response.data?.data || response.data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await apiClient.delete(`/v1/erp/customers/${id}`);
  },

  async getSalesOrders(): Promise<SalesOrder[]> {
    const response = await apiClient.get('/v1/erp/sales-orders');
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  async getSalesOrder(id: string): Promise<SalesOrder> {
    const response = await apiClient.get(`/v1/erp/sales-orders/${id}`);
    return response.data?.data || response.data;
  },

  async createSalesOrder(data: CreateSalesOrderRequest): Promise<SalesOrder> {
    const response = await apiClient.post('/v1/erp/sales-orders', data);
    return response.data?.data || response.data;
  },

  async getSalesShipments(): Promise<SalesShipment[]> {
    const response = await apiClient.get('/v1/erp/sales-shipments');
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },
};

export const erpFinanceApi = {
  async getAccounts(): Promise<Account[]> {
    const response = await apiClient.get('/v1/erp/accounts');
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  async getAccount(id: string): Promise<Account> {
    const response = await apiClient.get(`/v1/erp/accounts/${id}`);
    return response.data?.data || response.data;
  },

  async createAccount(data: CreateAccountRequest): Promise<Account> {
    const response = await apiClient.post('/v1/erp/accounts', data);
    return response.data?.data || response.data;
  },

  async deleteAccount(id: string): Promise<void> {
    await apiClient.delete(`/v1/erp/accounts/${id}`);
  },

  async getVouchers(): Promise<Voucher[]> {
    const response = await apiClient.get('/v1/erp/vouchers');
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  async getVoucher(id: string): Promise<Voucher> {
    const response = await apiClient.get(`/v1/erp/vouchers/${id}`);
    return response.data?.data || response.data;
  },

  async createVoucher(data: CreateVoucherRequest): Promise<Voucher> {
    const response = await apiClient.post('/v1/erp/vouchers', data);
    return response.data?.data || response.data;
  },

  async getPayments(): Promise<Payment[]> {
    const response = await apiClient.get('/v1/erp/payments');
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },

  async getPayment(id: string): Promise<Payment> {
    const response = await apiClient.get(`/v1/erp/payments/${id}`);
    return response.data?.data || response.data;
  },

  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    const response = await apiClient.post('/v1/erp/payments', data);
    return response.data?.data || response.data;
  },
};
