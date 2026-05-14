-- 删除触发器
DROP TRIGGER IF EXISTS update_schedule_events_updated_at ON schedule_events;

-- 删除表
DROP TABLE IF EXISTS schedule_events;
