-- GIS标注点表
CREATE TABLE IF NOT EXISTS gis_markers (
    id UUID PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    marker_type VARCHAR(50) NOT NULL,
    icon VARCHAR(255),
    color VARCHAR(20),
    user_id UUID,
    project_id UUID,
    layer VARCHAR(100),
    tags JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_gis_markers_type ON gis_markers(marker_type);
CREATE INDEX IF NOT EXISTS idx_gis_markers_layer ON gis_markers(layer);
CREATE INDEX IF NOT EXISTS idx_gis_markers_project ON gis_markers(project_id);
CREATE INDEX IF NOT EXISTS idx_gis_markers_user ON gis_markers(user_id);
CREATE INDEX IF NOT EXISTS idx_gis_markers_status ON gis_markers(status);