use chrono::Utc;
use sqlx::{types::Uuid, PgPool, Row};

use super::role::{CreateRole, Permission, Role, RoleWithPermissions, UpdateRole};
use crate::errors::AppError;

pub async fn create_role(pool: &PgPool, role: CreateRole) -> Result<Role, AppError> {
    let now = Utc::now();
    let result = sqlx::query(
        r#"INSERT INTO roles (name, code, description, is_active, is_system, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, name, code, description, is_active, is_system, created_at, updated_at"#,
    )
    .bind(&role.name)
    .bind(&role.code)
    .bind(&role.description)
    .bind(role.is_active.unwrap_or(true))
    .bind(role.is_system.unwrap_or(false))
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(Role {
        id: result.get("id"),
        name: result.get("name"),
        code: result.get("code"),
        description: result.get("description"),
        is_active: result.get("is_active"),
        is_system: result.get("is_system"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    })
}

pub async fn get_role_by_id(pool: &PgPool, role_id: Uuid) -> Result<Role, AppError> {
    let result = sqlx::query(
        "SELECT id, name, code, description, is_active, is_system, created_at, updated_at
         FROM roles WHERE id = $1",
    )
    .bind(role_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(Role {
        id: result.get("id"),
        name: result.get("name"),
        code: result.get("code"),
        description: result.get("description"),
        is_active: result.get("is_active"),
        is_system: result.get("is_system"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    })
}

pub async fn get_role_by_code(pool: &PgPool, code: &str) -> Result<Option<Role>, AppError> {
    let result = sqlx::query(
        "SELECT id, name, code, description, is_active, is_system, created_at, updated_at
         FROM roles WHERE code = $1",
    )
    .bind(code)
    .fetch_optional(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(result.map(|row| Role {
        id: row.get("id"),
        name: row.get("name"),
        code: row.get("code"),
        description: row.get("description"),
        is_active: row.get("is_active"),
        is_system: row.get("is_system"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }))
}

pub async fn get_all_roles(pool: &PgPool) -> Result<Vec<Role>, AppError> {
    let results = sqlx::query(
        "SELECT id, name, code, description, is_active, is_system, created_at, updated_at
         FROM roles ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut roles = Vec::new();
    for row in results {
        roles.push(Role {
            id: row.get("id"),
            name: row.get("name"),
            code: row.get("code"),
            description: row.get("description"),
            is_active: row.get("is_active"),
            is_system: row.get("is_system"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        });
    }
    Ok(roles)
}

pub async fn get_active_roles(pool: &PgPool) -> Result<Vec<Role>, AppError> {
    let results = sqlx::query(
        "SELECT id, name, code, description, is_active, is_system, created_at, updated_at
         FROM roles WHERE is_active = true ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut roles = Vec::new();
    for row in results {
        roles.push(Role {
            id: row.get("id"),
            name: row.get("name"),
            code: row.get("code"),
            description: row.get("description"),
            is_active: row.get("is_active"),
            is_system: row.get("is_system"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        });
    }
    Ok(roles)
}

pub async fn update_role(
    pool: &PgPool,
    role_id: Uuid,
    update: UpdateRole,
) -> Result<Role, AppError> {
    let now = Utc::now();

    let result = sqlx::query(
        r#"UPDATE roles
           SET name = COALESCE($1, name),
               code = COALESCE($2, code),
               description = COALESCE($3, description),
               is_active = COALESCE($4, is_active),
               updated_at = $5
           WHERE id = $6
           RETURNING id, name, code, description, is_active, is_system, created_at, updated_at"#,
    )
    .bind(&update.name)
    .bind(&update.code)
    .bind(&update.description)
    .bind(update.is_active)
    .bind(now)
    .bind(role_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(Role {
        id: result.get("id"),
        name: result.get("name"),
        code: result.get("code"),
        description: result.get("description"),
        is_active: result.get("is_active"),
        is_system: result.get("is_system"),
        created_at: result.get("created_at"),
        updated_at: result.get("updated_at"),
    })
}

pub async fn delete_role(pool: &PgPool, role_id: Uuid) -> Result<(), AppError> {
    sqlx::query("DELETE FROM roles WHERE id = $1 AND is_system = false")
        .bind(role_id)
        .execute(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(())
}

pub async fn get_role_permissions(
    pool: &PgPool,
    role_id: Uuid,
) -> Result<Vec<Permission>, AppError> {
    let results = sqlx::query(
        r#"SELECT p.id, p.name, p.code, p.resource, p.action, p.description, p.parent_id, p.created_at
           FROM permissions p
           INNER JOIN role_permissions rp ON p.id = rp.permission_id
           WHERE rp.role_id = $1
           ORDER BY p.resource, p.action"#
    )
    .bind(role_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut permissions = Vec::new();
    for row in results {
        permissions.push(Permission {
            id: row.get("id"),
            name: row.get("name"),
            code: row.get("code"),
            resource: row.get("resource"),
            action: row.get("action"),
            description: row.get("description"),
            parent_id: row.get("parent_id"),
            created_at: row.get("created_at"),
        });
    }
    Ok(permissions)
}

pub async fn assign_permissions_to_role(
    pool: &PgPool,
    role_id: Uuid,
    permission_ids: Vec<Uuid>,
) -> Result<(), AppError> {
    for perm_id in permission_ids {
        sqlx::query(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
             ON CONFLICT (role_id, permission_id) DO NOTHING",
        )
        .bind(role_id)
        .bind(perm_id)
        .execute(pool)
        .await
        .map_err(AppError::DatabaseError)?;
    }
    Ok(())
}

pub async fn remove_permissions_from_role(
    pool: &PgPool,
    role_id: Uuid,
    permission_ids: Vec<Uuid>,
) -> Result<(), AppError> {
    for perm_id in permission_ids {
        sqlx::query("DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2")
            .bind(role_id)
            .bind(perm_id)
            .execute(pool)
            .await
            .map_err(AppError::DatabaseError)?;
    }
    Ok(())
}

pub async fn set_role_permissions(
    pool: &PgPool,
    role_id: Uuid,
    permission_ids: Vec<Uuid>,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM role_permissions WHERE role_id = $1")
        .bind(role_id)
        .execute(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    for perm_id in permission_ids {
        sqlx::query(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
             ON CONFLICT (role_id, permission_id) DO NOTHING",
        )
        .bind(role_id)
        .bind(perm_id)
        .execute(pool)
        .await
        .map_err(AppError::DatabaseError)?;
    }
    Ok(())
}

pub async fn get_all_permissions(pool: &PgPool) -> Result<Vec<Permission>, AppError> {
    let results = sqlx::query(
        "SELECT id, name, code, resource, action, description, parent_id, created_at
         FROM permissions ORDER BY resource, action",
    )
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut permissions = Vec::new();
    for row in results {
        permissions.push(Permission {
            id: row.get("id"),
            name: row.get("name"),
            code: row.get("code"),
            resource: row.get("resource"),
            action: row.get("action"),
            description: row.get("description"),
            parent_id: row.get("parent_id"),
            created_at: row.get("created_at"),
        });
    }
    Ok(permissions)
}

pub async fn assign_role_to_user(
    pool: &PgPool,
    user_id: Uuid,
    role_id: Uuid,
    assigned_by: Option<Uuid>,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
         VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
         ON CONFLICT (user_id, role_id) DO NOTHING",
    )
    .bind(user_id)
    .bind(role_id)
    .bind(assigned_by)
    .execute(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(())
}

pub async fn remove_role_from_user(
    pool: &PgPool,
    user_id: Uuid,
    role_id: Uuid,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2")
        .bind(user_id)
        .bind(role_id)
        .execute(pool)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(())
}

pub async fn get_user_roles(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<RoleWithPermissions>, AppError> {
    let results = sqlx::query(
        r#"SELECT r.id, r.name, r.code, r.description, r.is_active, r.is_system, r.created_at, r.updated_at
           FROM roles r
           INNER JOIN user_roles ur ON r.id = ur.role_id
           WHERE ur.user_id = $1 AND r.is_active = true"#
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut roles = Vec::new();
    for row in results {
        let role_id: Uuid = row.get("id");
        let permissions = get_role_permissions(pool, role_id).await?;

        roles.push(RoleWithPermissions {
            id: row.get("id"),
            name: row.get("name"),
            code: row.get("code"),
            description: row.get("description"),
            is_active: row.get("is_active"),
            is_system: row.get("is_system"),
            permissions: permissions.into_iter().map(|p| p.code).collect(),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        });
    }
    Ok(roles)
}

pub async fn get_user_permission_codes(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<String>, AppError> {
    let results = sqlx::query(
        r#"SELECT DISTINCT p.code
           FROM permissions p
           INNER JOIN role_permissions rp ON p.id = rp.permission_id
           INNER JOIN user_roles ur ON rp.role_id = ur.role_id
           WHERE ur.user_id = $1"#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    let mut codes = Vec::new();
    for row in results {
        codes.push(row.get::<String, _>("code"));
    }
    Ok(codes)
}

pub async fn is_user_admin(pool: &PgPool, user_id: Uuid) -> Result<bool, AppError> {
    let result = sqlx::query(
        r#"SELECT EXISTS(
               SELECT 1 FROM user_roles ur
               INNER JOIN roles r ON ur.role_id = r.id
               WHERE ur.user_id = $1 AND r.code = 'admin'
           ) as is_admin"#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(result.get("is_admin"))
}
