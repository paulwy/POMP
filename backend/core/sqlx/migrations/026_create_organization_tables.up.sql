-- 创建部门表（如果不存在）
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    parent_id UUID,
    manager_id UUID,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建职位级别表（如果不存在）
CREATE TABLE IF NOT EXISTS position_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    code VARCHAR(30),
    level INTEGER DEFAULT 1,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建职位表（如果不存在）
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    department_id UUID,
    level_id UUID,
    description TEXT,
    is_leader BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);
CREATE INDEX IF NOT EXISTS idx_positions_department_id ON positions(department_id);
CREATE INDEX IF NOT EXISTS idx_positions_level_id ON positions(level_id);

-- 添加外键约束（仅当目标表存在时）
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'departments' AND constraint_name = 'fk_departments_manager') THEN
            ALTER TABLE departments ADD CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'departments') THEN
        IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'departments' AND constraint_name = 'fk_departments_parent') THEN
            ALTER TABLE departments ADD CONSTRAINT fk_departments_parent FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'departments') THEN
        IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'positions' AND constraint_name = 'fk_positions_department') THEN
            ALTER TABLE positions ADD CONSTRAINT fk_positions_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'position_levels') THEN
        IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'positions' AND constraint_name = 'fk_positions_level') THEN
            ALTER TABLE positions ADD CONSTRAINT fk_positions_level FOREIGN KEY (level_id) REFERENCES position_levels(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;