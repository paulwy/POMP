CREATE TABLE template_permissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id VARCHAR(36) NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('organization', 'department', 'role', 'user')),
    target_id VARCHAR(36) NOT NULL,
    target_name VARCHAR(100),
    access_level VARCHAR(20) NOT NULL CHECK (access_level IN ('read', 'write', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_template_permissions_template_id ON template_permissions(template_id);
CREATE INDEX idx_template_permissions_target ON template_permissions(permission_type, target_id);
