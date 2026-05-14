-- 给 cms_articles 表添加 current_reviewer_id 列
ALTER TABLE cms_articles ADD COLUMN IF NOT EXISTS current_reviewer_id UUID REFERENCES users(id);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_cms_articles_current_reviewer_id ON cms_articles(current_reviewer_id);
