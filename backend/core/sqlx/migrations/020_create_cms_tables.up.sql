-- 创建 CMS 分类表（如果不存在）
CREATE TABLE IF NOT EXISTS cms_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID,
    department_id UUID,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 添加外键约束（仅当不存在时）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'cms_categories' AND constraint_name = 'fk_cms_categories_parent') THEN
        ALTER TABLE cms_categories ADD CONSTRAINT fk_cms_categories_parent FOREIGN KEY (parent_id) REFERENCES cms_categories(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cms_categories_code ON cms_categories(code);
CREATE INDEX IF NOT EXISTS idx_cms_categories_parent_id ON cms_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_cms_categories_department_id ON cms_categories(department_id);

-- 创建 CMS 文章表（如果不存在）
CREATE TABLE IF NOT EXISTS cms_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary TEXT,
    content TEXT,
    cover_image VARCHAR(500),
    author_id UUID,
    department_id UUID,
    status VARCHAR(20) DEFAULT 'draft',
    view_count INTEGER DEFAULT 0,
    is_top BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    review_timeout_days INTEGER,
    review_reminded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 添加外键约束（仅当不存在时）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'cms_articles' AND constraint_name = 'fk_cms_articles_category') THEN
        ALTER TABLE cms_articles ADD CONSTRAINT fk_cms_articles_category FOREIGN KEY (category_id) REFERENCES cms_categories(id);
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'cms_articles' AND constraint_name = 'fk_cms_articles_author') THEN
        ALTER TABLE cms_articles ADD CONSTRAINT fk_cms_articles_author FOREIGN KEY (author_id) REFERENCES users(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cms_articles_category_id ON cms_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_cms_articles_author_id ON cms_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_cms_articles_status ON cms_articles(status);
CREATE INDEX IF NOT EXISTS idx_cms_articles_slug ON cms_articles(slug);
CREATE INDEX IF NOT EXISTS idx_cms_articles_is_top ON cms_articles(is_top);

-- 创建 CMS 文章审核表（如果不存在）
CREATE TABLE IF NOT EXISTS cms_article_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID,
    reviewer_id UUID,
    status VARCHAR(20) NOT NULL,
    comment TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 添加外键约束（仅当不存在时）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'cms_article_reviews' AND constraint_name = 'fk_cms_reviews_article') THEN
        ALTER TABLE cms_article_reviews ADD CONSTRAINT fk_cms_reviews_article FOREIGN KEY (article_id) REFERENCES cms_articles(id);
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'cms_article_reviews' AND constraint_name = 'fk_cms_reviews_reviewer') THEN
        ALTER TABLE cms_article_reviews ADD CONSTRAINT fk_cms_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cms_article_reviews_article_id ON cms_article_reviews(article_id);
CREATE INDEX IF NOT EXISTS idx_cms_article_reviews_reviewer_id ON cms_article_reviews(reviewer_id);
