-- 为用户表添加字段（如果不存在）
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_no VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES positions(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active';

-- 创建考勤记录表（如果不存在）
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attendance_date DATE,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    check_in_location VARCHAR(255),
    check_out_location VARCHAR(255),
    status VARCHAR(30) DEFAULT 'normal',
    work_hours DECIMAL(4,2) DEFAULT 0,
    late_minutes INTEGER DEFAULT 0,
    early_leave_minutes INTEGER DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

-- 添加唯一约束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'attendance_records' AND constraint_name = 'attendance_records_user_id_attendance_date_key') THEN
        ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_user_id_attendance_date_key UNIQUE (user_id, attendance_date);
    END IF;
END $$;

-- 创建请假申请表（如果不存在）
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    leave_type VARCHAR(30),
    start_date DATE,
    end_date DATE,
    total_days DECIMAL(4,1),
    reason TEXT,
    status VARCHAR(30) DEFAULT 'pending',
    workflow_instance_id UUID,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_leave_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_dates ON leave_requests(start_date, end_date);