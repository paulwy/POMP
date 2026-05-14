-- 字典类型表（如果不存在）
CREATE TABLE IF NOT EXISTS dict_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES dict_types(id),
    sort_order INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dict_types_category ON dict_types(category);
CREATE INDEX IF NOT EXISTS idx_dict_types_code ON dict_types(code);
CREATE INDEX IF NOT EXISTS idx_dict_types_is_active ON dict_types(is_active);

-- 字典项表（如果不存在）
CREATE TABLE IF NOT EXISTS dict_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dict_type_id UUID NOT NULL REFERENCES dict_types(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    value TEXT,
    sort_order INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dict_type_id, code)
);

CREATE INDEX IF NOT EXISTS idx_dict_items_type ON dict_items(dict_type_id);
CREATE INDEX IF NOT EXISTS idx_dict_items_code ON dict_items(code);
CREATE INDEX IF NOT EXISTS idx_dict_items_is_active ON dict_items(is_active);

-- 触发器：自动更新 updated_at（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_dict_types_updated_at') THEN
        CREATE TRIGGER update_dict_types_updated_at
            BEFORE UPDATE ON dict_types
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_dict_items_updated_at') THEN
        CREATE TRIGGER update_dict_items_updated_at
            BEFORE UPDATE ON dict_items
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;