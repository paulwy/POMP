-- 素材库表（如果不存在）
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    material_type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    content TEXT,
    url TEXT,
    file_path TEXT,
    file_size BIGINT,
    file_type VARCHAR(100),
    description TEXT,
    tags JSONB,
    source_url TEXT,
    ai_summary TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(material_type);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_favorite ON materials(is_favorite);
CREATE INDEX IF NOT EXISTS idx_materials_created_by ON materials(created_by);
CREATE INDEX IF NOT EXISTS idx_materials_created_at ON materials(created_at);
CREATE INDEX IF NOT EXISTS idx_materials_tags ON materials USING GIN(tags);

-- 创建更新时间触发器（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_materials_updated_at') THEN
        CREATE TRIGGER update_materials_updated_at
            BEFORE UPDATE ON materials
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
