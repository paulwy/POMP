use sqlx::postgres::PgPool;
use uuid::Uuid;
use chrono::{Utc, DateTime};
use bcrypt::{hash, DEFAULT_COST};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db_url = "postgres://postgres:postgres@localhost:5432/pomp";
    let pool = PgPool::connect(db_url).await?;
    
    let admin_id = Uuid::parse_str("a0049509-3f20-46ad-adc0-416b3ba1c0a0")?;
    let password_hash = hash("admin123", DEFAULT_COST)?;
    let now: DateTime<Utc> = Utc::now();
    
    sqlx::query!(
        r#"
        INSERT INTO users (id, username, email, password_hash, name, is_superuser, is_active, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET 
            username = EXCLUDED.username,
            email = EXCLUDED.email,
            password_hash = EXCLUDED.password_hash,
            name = EXCLUDED.name,
            is_superuser = EXCLUDED.is_superuser,
            is_active = EXCLUDED.is_active,
            status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at
        "#,
        admin_id,
        "admin",
        "admin@example.com",
        password_hash,
        "管理员",
        true,
        true,
        "active",
        now,
        now
    ).execute(&pool).await?;
    
    println!("管理员用户创建成功！");
    println!("用户名: admin");
    println!("密码: admin123");
    
    Ok(())
}
