-- GIS地图管理相关表

-- 客户地理位置表
CREATE TABLE IF NOT EXISTS gis_customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    customer_type VARCHAR(50),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    address TEXT,
    level VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 项目地理位置表
CREATE TABLE IF NOT EXISTS gis_projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    project_type VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'planning',
    customer_id VARCHAR(36),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    budget DECIMAL(15,2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_project_customer FOREIGN KEY (customer_id) REFERENCES gis_customers(id) ON DELETE SET NULL
);

-- 仓库地理位置表
CREATE TABLE IF NOT EXISTS gis_warehouses (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    warehouse_type VARCHAR(50),
    capacity VARCHAR(100),
    address TEXT,
    manager_name VARCHAR(100),
    manager_phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 人员地理位置表
CREATE TABLE IF NOT EXISTS gis_personnel (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    personnel_type VARCHAR(50) NOT NULL,
    position VARCHAR(100),
    department VARCHAR(100),
    phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    last_location_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 位置轨迹表
CREATE TABLE IF NOT EXISTS gis_location_history (
    id VARCHAR(36) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    location_time TIMESTAMP WITH TIME ZONE NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_gis_customers_status ON gis_customers(status);
CREATE INDEX IF NOT EXISTS idx_gis_customers_type ON gis_customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_gis_projects_status ON gis_projects(status);
CREATE INDEX IF NOT EXISTS idx_gis_projects_type ON gis_projects(project_type);
CREATE INDEX IF NOT EXISTS idx_gis_projects_customer ON gis_projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_gis_warehouses_status ON gis_warehouses(status);
CREATE INDEX IF NOT EXISTS idx_gis_warehouses_type ON gis_warehouses(warehouse_type);
CREATE INDEX IF NOT EXISTS idx_gis_personnel_status ON gis_personnel(status);
CREATE INDEX IF NOT EXISTS idx_gis_personnel_type ON gis_personnel(personnel_type);
CREATE INDEX IF NOT EXISTS idx_gis_location_entity ON gis_location_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_gis_location_time ON gis_location_history(location_time);

-- 插入示例数据
INSERT INTO gis_customers (id, name, longitude, latitude, customer_type, contact_person, contact_phone, address, level, status, created_at, updated_at) VALUES
('c0000001-0000-0000-0000-000000000001', '北京高铁建设局', 116.4074, 39.9042, 'key_customer', '张经理', '010-12345678', '北京市朝阳区', 'AAA', 'active', NOW(), NOW()),
('c0000002-0000-0000-0000-000000000001', '中建八局', 116.4274, 39.9142, 'strategic_customer', '李总', '010-87654321', '北京市海淀区', 'AA', 'active', NOW(), NOW()),
('c0000003-0000-0000-0000-000000000001', '北京建工集团', 116.3874, 39.8942, 'key_customer', '王工', '010-11112222', '北京市西城区', 'AAA', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO gis_projects (id, name, longitude, latitude, project_type, status, customer_id, start_date, end_date, budget, description, created_at, updated_at) VALUES
('p0000001-0000-0000-0000-000000000001', '京张高铁维护工程', 116.4174, 39.9242, 'construction', 'in_progress', 'c0000001-0000-0000-0000-000000000001', '2024-01-01', '2024-12-31', 5000000.00, '京张高铁沿线保温维护工程', NOW(), NOW()),
('p0000002-0000-0000-0000-000000000001', '雄安新区保温工程', 116.4374, 39.9342, 'construction', 'planning', 'c0000002-0000-0000-0000-000000000001', '2024-03-01', '2024-11-30', 8000000.00, '雄安新区新建建筑保温项目', NOW(), NOW()),
('p0000003-0000-0000-0000-000000000001', '北京副中心超低能耗项目', 116.3974, 39.8842, 'construction', 'in_progress', 'c0000003-0000-0000-0000-000000000001', '2024-02-01', '2024-10-31', 3500000.00, '超低能耗建筑示范项目', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO gis_warehouses (id, name, longitude, latitude, warehouse_type, capacity, address, manager_name, manager_phone, status, created_at, updated_at) VALUES
('w0000001-0000-0000-0000-000000000001', '北京原料仓库', 116.4474, 39.9442, 'raw_material', '5000吨', '北京市顺义区', '赵经理', '13800138001', 'active', NOW(), NOW()),
('w0000002-0000-0000-0000-000000000001', '天津成品仓库', 116.4674, 39.9542, 'finished_product', '3000吨', '天津市滨海新区', '钱经理', '13800138002', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO gis_personnel (id, name, longitude, latitude, personnel_type, position, department, phone, status, last_location_time, created_at, updated_at) VALUES
('e0000001-0000-0000-0000-000000000001', '张工 - 外勤工程师', 116.4124, 39.9092, 'field_engineer', '外勤工程师', '工程部', '13900139001', 'active', NOW(), NOW(), NOW()),
('e0000002-0000-0000-0000-000000000001', '李工 - 项目经理', 116.4224, 39.9192, 'project_manager', '项目经理', '项目部', '13900139002', 'active', NOW(), NOW(), NOW()),
('e0000003-0000-0000-0000-000000000001', '王工 - 安全员', 116.4024, 39.8992, 'safety_officer', '安全员', '安全部', '13900139003', 'active', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
