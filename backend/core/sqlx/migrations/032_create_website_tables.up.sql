CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name VARCHAR(200) NOT NULL DEFAULT '三楷深发科技',
    site_description TEXT,
    logo_url VARCHAR(500),
    primary_color VARCHAR(20) DEFAULT '#3b82f6',
    secondary_color VARCHAR(20) DEFAULT '#1e40af',
    contact_email VARCHAR(200),
    contact_phone VARCHAR(50),
    contact_address TEXT,
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS website_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id VARCHAR(200),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    target VARCHAR(50) NOT NULL DEFAULT 'cloudflare',
    url VARCHAR(500),
    error_message TEXT,
    triggered_by VARCHAR(200),
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_settings (site_name, site_description, contact_email, contact_phone, contact_address)
VALUES ('三楷深发科技', '专业的科技服务提供商', 'contact@example.com', '400-XXX-XXXX', '河北省石家庄市')
ON CONFLICT DO NOTHING;
