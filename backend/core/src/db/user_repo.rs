use chrono::Utc;
use sqlx::{types::Uuid, PgPool, Row};

use super::user::{CreateUser, UpdateUser, User};
use crate::errors::AppError;

pub async fn create_user(pool: &PgPool, user: CreateUser) -> Result<User, AppError> {
    let now = Utc::now();
    let result = sqlx::query(
        "INSERT INTO users (username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, password_changed_at, last_login_at, created_at, updated_at",
    )
    .bind(&user.username)
    .bind(user.email)
    .bind(&user.password_hash)
    .bind(user.name)
    .bind(user.phone)
    .bind(user.is_superuser)
    .bind(user.is_active)
    .bind(&user.status)
    .bind(false)
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(User {
        id: result.get("id"),
        username: result.get("username"),
        email: result.get("email"),
        password_hash: result.get("password_hash"),
        name: result.get("name"),
        phone: result.get("phone"),
        avatar: None,
        is_superuser: result.get("is_superuser"),
        is_active: result.get("is_active"),
        status: result.get("status"),
        must_change_password: result.get("must_change_password"),
        password_changed_at: result.get("password_changed_at"),
        last_login_at: result.get("last_login_at"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    })
}

pub async fn register_user(
    pool: &PgPool,
    username: String,
    email: Option<String>,
    password_hash: String,
    name: Option<String>,
) -> Result<User, AppError> {
    let now = Utc::now();
    let result = sqlx::query(
        "INSERT INTO users (username, email, password_hash, name, is_superuser, is_active, status, must_change_password, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, password_changed_at, last_login_at, created_at, updated_at",
    )
    .bind(username)
    .bind(email)
    .bind(password_hash)
    .bind(name)
    .bind(false)
    .bind(false)
    .bind("pending")
    .bind(false)
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(User {
        id: result.get("id"),
        username: result.get("username"),
        email: result.get("email"),
        password_hash: result.get("password_hash"),
        name: result.get("name"),
        phone: result.get("phone"),
        avatar: None,
        is_superuser: result.get("is_superuser"),
        is_active: result.get("is_active"),
        status: result.get("status"),
        must_change_password: result.get("must_change_password"),
        password_changed_at: result.get("password_changed_at"),
        last_login_at: result.get("last_login_at"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    })
}

pub async fn get_user_by_id(pool: &PgPool, user_id: Uuid) -> Result<User, AppError> {
    let result = sqlx::query("SELECT id, username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, password_changed_at, last_login_at, created_at, updated_at FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    match result {
        Some(row) => Ok(User {
            id: row.get("id"),
            username: row.get("username"),
            email: row.get("email"),
            password_hash: row.get("password_hash"),
            name: row.get("name"),
            phone: row.get("phone"),
            avatar: None,
            is_superuser: row.get("is_superuser"),
            is_active: row.get("is_active"),
            status: row.get("status"),
            must_change_password: row.get("must_change_password"),
            password_changed_at: row.get("password_changed_at"),
            last_login_at: row.get("last_login_at"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }),
        None => Err(AppError::DatabaseError(sqlx::Error::RowNotFound)),
    }
}

pub async fn get_user_by_username(pool: &PgPool, username: &str) -> Result<User, AppError> {
    let result = sqlx::query("SELECT id, username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, password_changed_at, last_login_at, created_at, updated_at FROM users WHERE username = $1")
        .bind(username)
        .fetch_one(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(User {
        id: result.get("id"),
        username: result.get("username"),
        email: result.get("email"),
        password_hash: result.get("password_hash"),
        name: result.get("name"),
        phone: result.get("phone"),
        avatar: None,
        is_superuser: result.get("is_superuser"),
        is_active: result.get("is_active"),
        status: result.get("status"),
        must_change_password: result.get("must_change_password"),
        password_changed_at: result.get("password_changed_at"),
        last_login_at: result.get("last_login_at"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    })
}

pub async fn get_user_by_email(pool: &PgPool, email: &str) -> Result<User, AppError> {
    let result = sqlx::query("SELECT id, username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, password_changed_at, last_login_at, created_at, updated_at FROM users WHERE email = $1")
        .bind(email)
        .fetch_one(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(User {
        id: result.get("id"),
        username: result.get("username"),
        email: result.get("email"),
        password_hash: result.get("password_hash"),
        name: result.get("name"),
        phone: result.get("phone"),
        avatar: None,
        is_superuser: result.get("is_superuser"),
        is_active: result.get("is_active"),
        status: result.get("status"),
        must_change_password: result.get("must_change_password"),
        password_changed_at: result.get("password_changed_at"),
        last_login_at: result.get("last_login_at"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    })
}

pub async fn get_users(pool: &PgPool, page: i64, page_size: i64) -> Result<Vec<User>, AppError> {
    let offset = (page - 1) * page_size;
    let results = sqlx::query("SELECT id, username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, password_changed_at, last_login_at, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2")
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    let mut users = Vec::new();
    for row in results {
        users.push(User {
            id: row.get("id"),
            username: row.get("username"),
            email: row.get("email"),
            password_hash: row.get("password_hash"),
            name: row.get("name"),
            phone: row.get("phone"),
            avatar: None,
            is_superuser: row.get("is_superuser"),
            is_active: row.get("is_active"),
            status: row.get("status"),
            must_change_password: row.get("must_change_password"),
            password_changed_at: row.get("password_changed_at"),
            last_login_at: row.get("last_login_at"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        });
    }
    Ok(users)
}

pub async fn get_all_users(pool: &PgPool) -> Result<Vec<User>, AppError> {
    let results = sqlx::query("SELECT id, username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, password_changed_at, last_login_at, created_at, updated_at FROM users ORDER BY created_at DESC")
        .fetch_all(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    let mut users = Vec::new();
    for row in results {
        users.push(User {
            id: row.get("id"),
            username: row.get("username"),
            email: row.get("email"),
            password_hash: row.get("password_hash"),
            name: row.get("name"),
            phone: row.get("phone"),
            avatar: None,
            is_superuser: row.get("is_superuser"),
            is_active: row.get("is_active"),
            status: row.get("status"),
            must_change_password: row.get("must_change_password"),
            password_changed_at: row.get("password_changed_at"),
            last_login_at: row.get("last_login_at"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        });
    }
    Ok(users)
}

pub async fn get_pending_users(pool: &PgPool) -> Result<Vec<User>, AppError> {
    let results = sqlx::query("SELECT id, username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, password_changed_at, last_login_at, created_at, updated_at FROM users WHERE status = 'pending' ORDER BY created_at DESC")
        .fetch_all(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    let mut users = Vec::new();
    for row in results {
        users.push(User {
            id: row.get("id"),
            username: row.get("username"),
            email: row.get("email"),
            password_hash: row.get("password_hash"),
            name: row.get("name"),
            phone: row.get("phone"),
            avatar: None,
            is_superuser: row.get("is_superuser"),
            is_active: row.get("is_active"),
            status: row.get("status"),
            must_change_password: row.get("must_change_password"),
            password_changed_at: row.get("password_changed_at"),
            last_login_at: row.get("last_login_at"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        });
    }
    Ok(users)
}

pub async fn update_user(pool: &PgPool, user_id: Uuid, user: UpdateUser) -> Result<User, AppError> {
    let now = Utc::now();
    let result = sqlx::query(
        "UPDATE users
         SET email = COALESCE($1, email),
             name = COALESCE($2, name),
             phone = COALESCE($3, phone),
             is_superuser = COALESCE($4, is_superuser),
             is_active = COALESCE($5, is_active),
             status = COALESCE($6, status),
             updated_at = $7
         WHERE id = $8::uuid
         RETURNING id, username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, password_changed_at, last_login_at, created_at, updated_at",
    )
    .bind(&user.email)
    .bind(&user.name)
    .bind(&user.phone)
    .bind(user.is_superuser)
    .bind(user.is_active)
    .bind(&user.status)
    .bind(now)
    .bind(user_id.to_string())
    .fetch_optional(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let result = match result {
        Some(r) => r,
        None => return Err(AppError::NotFound("用户不存在".to_string())),
    };

    Ok(User {
        id: result.get("id"),
        username: result.get("username"),
        email: result.get("email"),
        password_hash: result.get("password_hash"),
        name: result.get("name"),
        phone: result.get("phone"),
        avatar: None,
        is_superuser: result.get("is_superuser"),
        is_active: result.get("is_active"),
        status: result.get("status"),
        must_change_password: result.get("must_change_password"),
        password_changed_at: result.get("password_changed_at"),
        last_login_at: result.get("last_login_at"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    })
}

pub async fn update_user_with_password(
    pool: &PgPool,
    user_id: Uuid,
    user: UpdateUser,
    password_hash: String,
) -> Result<User, AppError> {
    let now = Utc::now();
    let result = sqlx::query(
        "UPDATE users
         SET email = COALESCE($1, email),
             name = COALESCE($2, name),
             phone = COALESCE($3, phone),
             password_hash = $4,
             is_superuser = COALESCE($5, is_superuser),
             is_active = COALESCE($6, is_active),
             status = COALESCE($7, status),
             password_changed_at = $8,
             updated_at = $9
         WHERE id = $10::uuid
         RETURNING id, username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, password_changed_at, last_login_at, created_at, updated_at",
    )
    .bind(&user.email)
    .bind(&user.name)
    .bind(&user.phone)
    .bind(password_hash)
    .bind(user.is_superuser)
    .bind(user.is_active)
    .bind(&user.status)
    .bind(now)
    .bind(now)
    .bind(user_id.to_string())
    .fetch_optional(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let result = match result {
        Some(r) => r,
        None => return Err(AppError::NotFound("用户不存在".to_string())),
    };

    Ok(User {
        id: result.get("id"),
        username: result.get("username"),
        email: result.get("email"),
        password_hash: result.get("password_hash"),
        name: result.get("name"),
        phone: result.get("phone"),
        avatar: None,
        is_superuser: result.get("is_superuser"),
        is_active: result.get("is_active"),
        status: result.get("status"),
        must_change_password: result.get("must_change_password"),
        password_changed_at: result.get("password_changed_at"),
        last_login_at: result.get("last_login_at"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    })
}

pub async fn activate_user(pool: &PgPool, user_id: Uuid) -> Result<User, AppError> {
    let now = Utc::now();
    let result = sqlx::query(
        "UPDATE users
         SET is_active = true,
             status = 'approved',
             updated_at = $1
         WHERE id = $2
         RETURNING id, username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, password_changed_at, last_login_at, created_at, updated_at",
    )
    .bind(now)
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(User {
        id: result.get("id"),
        username: result.get("username"),
        email: result.get("email"),
        password_hash: result.get("password_hash"),
        name: result.get("name"),
        phone: result.get("phone"),
        avatar: None,
        is_superuser: result.get("is_superuser"),
        is_active: result.get("is_active"),
        status: result.get("status"),
        must_change_password: result.get("must_change_password"),
        password_changed_at: result.get("password_changed_at"),
        last_login_at: result.get("last_login_at"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    })
}

pub async fn approve_user(pool: &PgPool, user_id: Uuid) -> Result<User, AppError> {
    let now = Utc::now();
    let result = sqlx::query(
        "UPDATE users
         SET is_active = true,
             status = 'approved',
             updated_at = $1
         WHERE id = $2
         RETURNING id, username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, password_changed_at, last_login_at, created_at, updated_at",
    )
    .bind(now)
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(User {
        id: result.get("id"),
        username: result.get("username"),
        email: result.get("email"),
        password_hash: result.get("password_hash"),
        name: result.get("name"),
        phone: result.get("phone"),
        avatar: None,
        is_superuser: result.get("is_superuser"),
        is_active: result.get("is_active"),
        status: result.get("status"),
        must_change_password: result.get("must_change_password"),
        password_changed_at: result.get("password_changed_at"),
        last_login_at: result.get("last_login_at"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    })
}

pub async fn reject_user(pool: &PgPool, user_id: Uuid) -> Result<User, AppError> {
    let now = Utc::now();
    let result = sqlx::query(
        "UPDATE users
         SET is_active = false,
             status = 'rejected',
             updated_at = $1
         WHERE id = $2
         RETURNING id, username, email, password_hash, name, phone, is_superuser, is_active, status, must_change_password, password_changed_at, last_login_at, created_at, updated_at",
    )
    .bind(now)
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(User {
        id: result.get("id"),
        username: result.get("username"),
        email: result.get("email"),
        password_hash: result.get("password_hash"),
        name: result.get("name"),
        phone: result.get("phone"),
        avatar: None,
        is_superuser: result.get("is_superuser"),
        is_active: result.get("is_active"),
        status: result.get("status"),
        must_change_password: result.get("must_change_password"),
        password_changed_at: result.get("password_changed_at"),
        last_login_at: result.get("last_login_at"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    })
}

pub async fn delete_user(pool: &PgPool, user_id: Uuid) -> Result<(), AppError> {
    sqlx::query("DELETE FROM cms_articles WHERE author_id = $1")
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(())
}

pub async fn count_users(pool: &PgPool) -> Result<i64, AppError> {
    let result = sqlx::query("SELECT COUNT(*) as count FROM users")
        .fetch_one(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(result.get::<i64, _>("count"))
}

pub async fn count_pending_users(pool: &PgPool) -> Result<i64, AppError> {
    let result = sqlx::query("SELECT COUNT(*) as count FROM users WHERE status = 'pending'")
        .fetch_one(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(result.get::<i64, _>("count"))
}

pub async fn check_username_exists(pool: &PgPool, username: &str) -> Result<bool, AppError> {
    let result = sqlx::query("SELECT COUNT(*) as count FROM users WHERE username = $1")
        .bind(username)
        .fetch_one(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(result.get::<i64, _>("count") > 0)
}

pub async fn check_email_exists(pool: &PgPool, email: &str) -> Result<bool, AppError> {
    let result = sqlx::query("SELECT COUNT(*) as count FROM users WHERE email = $1")
        .bind(email)
        .fetch_one(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(result.get::<i64, _>("count") > 0)
}

fn map_row_to_user(row: &sqlx::postgres::PgRow) -> User {
    User {
        id: row.try_get("id").unwrap_or_default(),
        username: row.try_get("username").unwrap_or_default(),
        email: row.try_get("email").ok(),
        password_hash: row.try_get("password_hash").unwrap_or_default(),
        name: row.try_get("name").ok(),
        phone: row.try_get("phone").ok(),
        avatar: row.try_get("avatar").ok(),
        is_superuser: row.try_get("is_superuser").unwrap_or_default(),
        is_active: row.try_get("is_active").unwrap_or_default(),
        status: row.try_get("status").unwrap_or_default(),
        must_change_password: row.try_get("must_change_password").unwrap_or_default(),
        password_changed_at: row.try_get("password_changed_at").ok(),
        last_login_at: row.try_get("last_login_at").ok(),
        created_at: row.try_get("created_at").unwrap_or_default(),
        updated_at: row.try_get("updated_at").unwrap_or_default(),
    }
}
