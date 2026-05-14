-- 创建统一模板管理表
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    variables JSONB DEFAULT '[]'::jsonb,
    version VARCHAR(50) NOT NULL DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}'::text[],
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(template_type);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_code ON templates(code);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);

-- 模板使用记录表
CREATE TABLE IF NOT EXISTS template_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    business_type VARCHAR(100),
    business_id UUID,
    used_by UUID,
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_usage_template_id ON template_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_business ON template_usage(business_type, business_id);

-- 模板收藏表
CREATE TABLE IF NOT EXISTS template_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(template_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_template_favorites_template ON template_favorites(template_id);
CREATE INDEX IF NOT EXISTS idx_template_favorites_user ON template_favorites(user_id);

-- 模板版本表
CREATE TABLE IF NOT EXISTS template_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_name VARCHAR(200),
    content JSONB NOT NULL,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(template_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_template_versions_template ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_version ON template_versions(version_number);

-- 模板权限表
CREATE TABLE IF NOT EXISTS template_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    permission_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    target_name VARCHAR(200),
    access_level VARCHAR(20) NOT NULL DEFAULT 'read',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_permissions_template ON template_permissions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_permissions_type ON template_permissions(permission_type);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at_trigger
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_templates_updated_at();
