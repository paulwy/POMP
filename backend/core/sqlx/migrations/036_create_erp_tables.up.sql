-- 库存管理模块表

-- 产品/物料表
CREATE TABLE IF NOT EXISTS erp_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit VARCHAR(50),
    spec VARCHAR(255),
    purchase_price DECIMAL(15,4) DEFAULT 0,
    sale_price DECIMAL(15,4) DEFAULT 0,
    min_stock DECIMAL(15,4) DEFAULT 0,
    max_stock DECIMAL(15,4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_product_code ON erp_products(product_code);
CREATE INDEX IF NOT EXISTS idx_erp_product_category ON erp_products(category);
CREATE INDEX IF NOT EXISTS idx_erp_product_active ON erp_products(is_active);

-- 仓库表
CREATE TABLE IF NOT EXISTS erp_warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_warehouse_code ON erp_warehouses(warehouse_code);

-- 库存表
CREATE TABLE IF NOT EXISTS erp_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES erp_products(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES erp_warehouses(id) ON DELETE CASCADE,
    quantity DECIMAL(15,4) DEFAULT 0,
    available_quantity DECIMAL(15,4) DEFAULT 0,
    reserved_quantity DECIMAL(15,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_erp_inventory_product ON erp_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_erp_inventory_warehouse ON erp_inventory(warehouse_id);

-- 库存变动记录表
CREATE TABLE IF NOT EXISTS erp_inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES erp_products(id) ON DELETE SET NULL,
    warehouse_id UUID REFERENCES erp_warehouses(id) ON DELETE SET NULL,
    change_type VARCHAR(50),
    change_quantity DECIMAL(15,4),
    before_quantity DECIMAL(15,4),
    after_quantity DECIMAL(15,4),
    reference_type VARCHAR(50),
    reference_id UUID,
    remark TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_inv_log_product ON erp_inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_erp_inv_log_warehouse ON erp_inventory_logs(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_erp_inv_log_created ON erp_inventory_logs(created_at);

-- 采购管理模块表

-- 供应商表
CREATE TABLE IF NOT EXISTS erp_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    address VARCHAR(255),
    credit_limit DECIMAL(15,4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_supplier_code ON erp_suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_erp_supplier_active ON erp_suppliers(is_active);

-- 采购订单表
CREATE TABLE IF NOT EXISTS erp_purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES erp_suppliers(id) ON DELETE SET NULL,
    warehouse_id UUID REFERENCES erp_warehouses(id) ON DELETE SET NULL,
    order_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expected_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'draft',
    total_amount DECIMAL(15,4) DEFAULT 0,
    tax_amount DECIMAL(15,4) DEFAULT 0,
    discount DECIMAL(15,4) DEFAULT 0,
    remark TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_po_order_no ON erp_purchase_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_erp_po_supplier ON erp_purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_erp_po_status ON erp_purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_erp_po_date ON erp_purchase_orders(order_date);

-- 采购订单明细表
CREATE TABLE IF NOT EXISTS erp_purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES erp_purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES erp_products(id) ON DELETE SET NULL,
    quantity DECIMAL(15,4),
    unit_price DECIMAL(15,4),
    amount DECIMAL(15,4),
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_po_item_order ON erp_purchase_order_items(purchase_order_id);

-- 采购入库单
CREATE TABLE IF NOT EXISTS erp_purchase_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no VARCHAR(100) UNIQUE NOT NULL,
    purchase_order_id UUID REFERENCES erp_purchase_orders(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES erp_suppliers(id) ON DELETE SET NULL,
    warehouse_id UUID REFERENCES erp_warehouses(id) ON DELETE SET NULL,
    receipt_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(15,4) DEFAULT 0,
    remark TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_pr_receipt_no ON erp_purchase_receipts(receipt_no);
CREATE INDEX IF NOT EXISTS idx_erp_pr_po ON erp_purchase_receipts(purchase_order_id);

-- 采购入库明细表
CREATE TABLE IF NOT EXISTS erp_purchase_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID REFERENCES erp_purchase_receipts(id) ON DELETE CASCADE,
    purchase_order_item_id UUID REFERENCES erp_purchase_order_items(id) ON DELETE SET NULL,
    product_id UUID REFERENCES erp_products(id) ON DELETE SET NULL,
    quantity DECIMAL(15,4),
    unit_price DECIMAL(15,4),
    amount DECIMAL(15,4),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_pr_item_receipt ON erp_purchase_receipt_items(receipt_id);

-- 销售管理模块表

-- 客户表
CREATE TABLE IF NOT EXISTS erp_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    address VARCHAR(255),
    credit_limit DECIMAL(15,4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_customer_code ON erp_customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_erp_customer_active ON erp_customers(is_active);

-- 销售订单表
CREATE TABLE IF NOT EXISTS erp_sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES erp_customers(id) ON DELETE SET NULL,
    warehouse_id UUID REFERENCES erp_warehouses(id) ON DELETE SET NULL,
    order_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    delivery_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'draft',
    total_amount DECIMAL(15,4) DEFAULT 0,
    tax_amount DECIMAL(15,4) DEFAULT 0,
    discount DECIMAL(15,4) DEFAULT 0,
    remark TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_so_order_no ON erp_sales_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_erp_so_customer ON erp_sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_erp_so_status ON erp_sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_erp_so_date ON erp_sales_orders(order_date);

-- 销售订单明细表
CREATE TABLE IF NOT EXISTS erp_sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID REFERENCES erp_sales_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES erp_products(id) ON DELETE SET NULL,
    quantity DECIMAL(15,4),
    unit_price DECIMAL(15,4),
    amount DECIMAL(15,4),
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_so_item_order ON erp_sales_order_items(sales_order_id);

-- 销售出库单
CREATE TABLE IF NOT EXISTS erp_sales_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_no VARCHAR(100) UNIQUE NOT NULL,
    sales_order_id UUID REFERENCES erp_sales_orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES erp_customers(id) ON DELETE SET NULL,
    warehouse_id UUID REFERENCES erp_warehouses(id) ON DELETE SET NULL,
    delivery_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(15,4) DEFAULT 0,
    remark TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_sd_delivery_no ON erp_sales_deliveries(delivery_no);
CREATE INDEX IF NOT EXISTS idx_erp_sd_so ON erp_sales_deliveries(sales_order_id);

-- 销售出库明细表
CREATE TABLE IF NOT EXISTS erp_sales_delivery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID REFERENCES erp_sales_deliveries(id) ON DELETE CASCADE,
    sales_order_item_id UUID REFERENCES erp_sales_order_items(id) ON DELETE SET NULL,
    product_id UUID REFERENCES erp_products(id) ON DELETE SET NULL,
    quantity DECIMAL(15,4),
    unit_price DECIMAL(15,4),
    amount DECIMAL(15,4),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_sd_item_delivery ON erp_sales_delivery_items(delivery_id);

-- 财务模块表

-- 会计科目表
CREATE TABLE IF NOT EXISTS erp_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(50) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50),
    parent_id UUID REFERENCES erp_accounts(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_account_code ON erp_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_erp_account_type ON erp_accounts(account_type);

-- 凭证表
CREATE TABLE IF NOT EXISTS erp_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_no VARCHAR(100) UNIQUE NOT NULL,
    voucher_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    voucher_type VARCHAR(50),
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    total_debit DECIMAL(15,4) DEFAULT 0,
    total_credit DECIMAL(15,4) DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_voucher_no ON erp_vouchers(voucher_no);
CREATE INDEX IF NOT EXISTS idx_erp_voucher_date ON erp_vouchers(voucher_date);
CREATE INDEX IF NOT EXISTS idx_erp_voucher_status ON erp_vouchers(status);

-- 凭证明细表
CREATE TABLE IF NOT EXISTS erp_voucher_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID REFERENCES erp_vouchers(id) ON DELETE CASCADE,
    account_id UUID REFERENCES erp_accounts(id) ON DELETE SET NULL,
    debit DECIMAL(15,4) DEFAULT 0,
    credit DECIMAL(15,4) DEFAULT 0,
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_voucher_item_voucher ON erp_voucher_items(voucher_id);

-- 收付款单
CREATE TABLE IF NOT EXISTS erp_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_no VARCHAR(100) UNIQUE NOT NULL,
    payment_type VARCHAR(50),
    party_type VARCHAR(50),
    party_id UUID,
    payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(15,4),
    payment_method VARCHAR(50),
    reference_type VARCHAR(50),
    reference_id UUID,
    status VARCHAR(50) DEFAULT 'pending',
    remark TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_payment_no ON erp_payments(payment_no);
CREATE INDEX IF NOT EXISTS idx_erp_payment_date ON erp_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_erp_payment_type ON erp_payments(payment_type);
