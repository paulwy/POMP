CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT DEFAULT 0,
    file_path VARCHAR(1000),
    url VARCHAR(1000),
    uploaded_by VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);
