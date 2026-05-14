use bcrypt::{hash, DEFAULT_COST};
use chrono::Utc;
use sksfems_backend::Config;
use sqlx::query;
use uuid::Uuid;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = Config::load()?;
    let db = sqlx::PgPool::connect(&config.database_url).await?;

    let admin_id = Uuid::parse_str("a0049509-3f20-46ad-adc0-416b3ba1c0a0")?;
    let password_hash = hash("admin123", DEFAULT_COST)?;
    let now = Utc::now();

    query!(
        r#"
        INSERT INTO users (id, username, email, password_hash, name, employee_no, is_superuser, is_active, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET 
            username = EXCLUDED.username,
            email = EXCLUDED.email,
            password_hash = EXCLUDED.password_hash,
            name = EXCLUDED.name,
            employee_no = EXCLUDED.employee_no,
            is_superuser = EXCLUDED.is_superuser,
            is_active = EXCLUDED.is_active,
            status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at
        "#,
        admin_id,
        "admin",
        "admin@example.com",
        password_hash,
        "超级管理员",
        "admin",
        true,
        true,
        "approved",
        now,
        now
    ).execute(&db).await?;

    println!("管理员用户设置成功！");
    println!("用户名: admin");
    println!("密码: admin123");

    Ok(())
}
