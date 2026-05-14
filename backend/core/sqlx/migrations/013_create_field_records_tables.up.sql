-- 创建外勤记录表（如果不存在）
CREATE TABLE IF NOT EXISTS field_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    task_title VARCHAR(255) NOT NULL,
    task_description TEXT,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    location_name VARCHAR(255),
    address VARCHAR(500),
    status VARCHAR(50) DEFAULT 'in_progress',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建照片证据表（如果不存在）
CREATE TABLE IF NOT EXISTS photo_evidences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_record_id UUID NOT NULL REFERENCES field_records(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    content_type VARCHAR(100),
    description TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建录音证据表（如果不存在）
CREATE TABLE IF NOT EXISTS audio_evidences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_record_id UUID NOT NULL REFERENCES field_records(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    duration INTEGER,
    content_type VARCHAR(100),
    description TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_field_records_user_id ON field_records(user_id);
CREATE INDEX IF NOT EXISTS idx_field_records_status ON field_records(status);
CREATE INDEX IF NOT EXISTS idx_field_records_created_at ON field_records(created_at);
CREATE INDEX IF NOT EXISTS idx_photo_evidences_field_record_id ON photo_evidences(field_record_id);
CREATE INDEX IF NOT EXISTS idx_audio_evidences_field_record_id ON audio_evidences(field_record_id);