-- 帮助中心分类表（如果不存在）
CREATE TABLE IF NOT EXISTS help_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_categories_code ON help_categories(code);
CREATE INDEX IF NOT EXISTS idx_help_categories_is_active ON help_categories(is_active);

-- 帮助中心文章表（如果不存在）
CREATE TABLE IF NOT EXISTS help_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES help_categories(id) ON DELETE CASCADE,
    slug VARCHAR(200) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(100),
    tags VARCHAR(500),
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON help_articles(slug);
CREATE INDEX IF NOT EXISTS idx_help_articles_is_published ON help_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_help_articles_view_count ON help_articles(view_count);

-- 创建触发器（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_help_categories_updated_at') THEN
        CREATE TRIGGER update_help_categories_updated_at
            BEFORE UPDATE ON help_categories
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_help_articles_updated_at') THEN
        CREATE TRIGGER update_help_articles_updated_at
            BEFORE UPDATE ON help_articles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;