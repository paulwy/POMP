-- 添加用户密码安全相关字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_users_must_change_password ON users(must_change_password);
CREATE INDEX IF NOT EXISTS idx_users_password_changed_at ON users(password_changed_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

-- 为现有用户设置默认值
UPDATE users 
SET must_change_password = FALSE 
WHERE must_change_password IS NULL;
