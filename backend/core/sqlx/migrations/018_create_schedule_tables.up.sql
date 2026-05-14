-- 日程表（如果不存在）
CREATE TABLE IF NOT EXISTS schedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL DEFAULT 'meeting', -- meeting, task, reminder
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    location VARCHAR(500),
    organizer_id UUID NOT NULL,
    participant_ids JSONB DEFAULT '[]'::jsonb,
    reminder_minutes INTEGER DEFAULT 30,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, canceled, completed
    color VARCHAR(50) DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_events_organizer_id ON schedule_events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_start_time ON schedule_events(start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_events_end_time ON schedule_events(end_time);
CREATE INDEX IF NOT EXISTS idx_schedule_events_status ON schedule_events(status);

-- 创建更新时间触发器（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_schedule_events_updated_at') THEN
        CREATE TRIGGER update_schedule_events_updated_at
            BEFORE UPDATE ON schedule_events
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
