CREATE TABLE template_versions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id VARCHAR(36) NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    version_name VARCHAR(100),
    content JSONB NOT NULL,
    description TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(template_id, version_number)
);

CREATE INDEX idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX idx_template_versions_version_number ON template_versions(version_number);
