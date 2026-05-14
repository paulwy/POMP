CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    content TEXT,
    category_id UUID REFERENCES document_categories(id),
    author_id UUID,
    author_name VARCHAR(200),
    status VARCHAR(50) DEFAULT 'draft',
    version VARCHAR(20) DEFAULT '1.0',
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_production_documents_category ON production_documents(category_id);
CREATE INDEX IF NOT EXISTS idx_production_documents_status ON production_documents(status);
