use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use bcrypt::{hash, DEFAULT_COST};
use bigdecimal::BigDecimal;
use chrono::{DateTime, Datelike, Timelike, Utc};
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use serde_json;
use std::sync::Arc;
use uuid::Uuid;

use crate::errors::ApiResponse;
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub user_id: String,
    pub is_superuser: bool,
    pub exp: usize,
    pub iat: usize,
}

fn extract_user_from_headers(
    headers: &HeaderMap,
    secret: &str,
) -> Result<Uuid, (StatusCode, String)> {
    if let Some(auth_header) = headers.get("Authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if let Some(token) = auth_str.strip_prefix("Bearer ") {
                match decode::<Claims>(
                    token,
                    &DecodingKey::from_secret(secret.as_ref()),
                    &Validation::new(Algorithm::HS256),
                ) {
                    Ok(token_data) => {
                        return Uuid::parse_str(&token_data.claims.user_id)
                            .map_err(|_| (StatusCode::UNAUTHORIZED, "无效的用户ID".to_string()));
                    }
                    Err(e) => {
                        tracing::error!("Token decode error: {}", e);
                    }
                }
            }
        }
    }
    Err((StatusCode::UNAUTHORIZED, "未授权访问".to_string()))
}

fn optional_uuid_from_str(value: &Option<String>) -> Option<Uuid> {
    value
        .as_ref()
        .map(|s| s.trim())
        .filter(|t| !t.is_empty())
        .and_then(|t| Uuid::parse_str(t).ok())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Employee {
    pub id: String,
    pub user_id: String,
    pub employee_no: Option<String>,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub position_id: Option<String>,
    pub position_name: Option<String>,
    pub department_id: Option<String>,
    pub department_name: Option<String>,
    pub hire_date: Option<String>,
    pub sort_order: Option<i32>,
    pub status: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn get_employees_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let page = params
        .get("page")
        .and_then(|p| p.parse::<i32>().ok())
        .unwrap_or(1);
    let page_size = params
        .get("page_size")
        .and_then(|p| p.parse::<i32>().ok())
        .unwrap_or(100);
    let _status = params.get("status").cloned();

    let employees = match sqlx::query_as::<_, (Uuid, Option<String>, Option<String>, Option<String>, Option<String>, Option<Uuid>, Option<Uuid>, Option<chrono::NaiveDate>, Option<i32>, Option<DateTime<Utc>>, Option<DateTime<Utc>>)>(
        r#"SELECT id, employee_no, name, email, phone, position_id, department_id, hire_date, sort_order, created_at, updated_at FROM users WHERE status != 'archived' ORDER BY COALESCE(sort_order, 0) ASC, created_at DESC LIMIT $1 OFFSET $2"#
    )
    .bind(page_size)
    .bind((page - 1) * page_size)
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => {
            let mut result = Vec::new();
            for r in records {
                let position_id = r.5;
                let user_department_id = r.6;

                let mut department_name = if let Some(did) = user_department_id {
                    sqlx::query_scalar::<_, String>(r#"SELECT name FROM departments WHERE id = $1"#)
                        .bind(did)
                        .fetch_optional(&state.db)
                        .await
                        .ok()
                        .flatten()
                } else {
                    None
                };

                if department_name.is_none() {
                    department_name = if let Some(pos_id) = position_id {
                        sqlx::query_scalar::<_, String>(r#"SELECT d.name FROM positions p LEFT JOIN departments d ON p.department_id = d.id WHERE p.id = $1"#)
                            .bind(pos_id)
                            .fetch_optional(&state.db)
                            .await
                            .ok()
                            .flatten()
                    } else {
                        None
                    };
                }

                let position_name = if let Some(pos_id) = position_id {
                    sqlx::query_scalar::<_, String>(r#"SELECT name FROM positions WHERE id = $1"#)
                        .bind(pos_id)
                        .fetch_optional(&state.db)
                        .await
                        .ok()
                        .flatten()
                } else {
                    None
                };

                result.push(Employee {
                    id: r.0.to_string(),
                    user_id: r.0.to_string(),
                    employee_no: r.1,
                    name: r.2.clone().unwrap_or_default(),
                    email: r.3,
                    phone: r.4,
                    position_id: position_id.map(|id| id.to_string()),
                    position_name,
                    department_id: user_department_id.map(|id| id.to_string()),
                    department_name,
                    hire_date: r.7.map(|d| d.format("%Y-%m-%d").to_string()),
                    sort_order: r.8,
                    status: "active".to_string(),
                    is_active: true,
                    created_at: r.9.unwrap_or(Utc::now()),
                    updated_at: r.10.unwrap_or(Utc::now()),
                });
            }
            result
        }
        Err(e) => {
            eprintln!("Error fetching employees: {}", e);
            vec![]
        }
    };

    let total: i64 =
        match sqlx::query_scalar!("SELECT COUNT(*) FROM users WHERE status != 'archived'")
            .fetch_one(&state.db)
            .await
        {
            Ok(count) => count.unwrap_or(0),
            Err(_) => 0,
        };

    let result = serde_json::json!({
        "success": true,
        "data": employees,
        "total": total,
        "page": page,
        "page_size": page_size,
        "error": null,
    });

    (StatusCode::OK, Json(result))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateEmployeeRequest {
    pub name: String,
    pub email: String,
    pub username: String,
    pub phone: Option<String>,
    pub position_id: Option<String>,
    pub department_id: Option<String>,
    pub employee_no: Option<String>,
    pub hire_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConvertToEmployeeRequest {
    pub user_id: String,
    pub employee_no: String,
    pub hire_date: String,
    pub position_id: Option<String>,
    pub department_id: Option<String>,
}

pub async fn create_employee_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateEmployeeRequest>,
) -> impl IntoResponse {
    // 验证必填字段
    let username = req.username.trim().to_string();
    if username.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("用户名为必填字段".to_string())),
        );
    }

    let employee_no = match &req.employee_no {
        Some(no) if !no.trim().is_empty() => no.trim().to_string(),
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("工号为必填字段".to_string())),
            );
        }
    };

    let hire_date = match &req.hire_date {
        Some(date) if !date.trim().is_empty() => date.trim().to_string(),
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("入职日期为必填字段".to_string())),
            );
        }
    };

    // 生成默认密码：用户名@123
    let default_password = format!("{}@123", username);
    let password_hash = match hash(default_password, DEFAULT_COST) {
        Ok(hash) => hash,
        Err(e) => {
            tracing::error!("Password hash error: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("密码加密失败".to_string())),
            );
        }
    };

    let user_id = Uuid::new_v4();
    let position_uuid = optional_uuid_from_str(&req.position_id);
    let department_uuid = optional_uuid_from_str(&req.department_id);

    match sqlx::query(
        r#"INSERT INTO users (id, username, name, email, phone, position_id, department_id, employee_no, hire_date, is_active, status, password_hash, is_superuser, must_change_password)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::date, true, 'active', $10, false, true)"#
    )
    .bind(user_id)
    .bind(&username)
    .bind(&req.name)
    .bind(&req.email)
    .bind(&req.phone)
    .bind(position_uuid)
    .bind(department_uuid)
    .bind(&employee_no)
    .bind(&hire_date)
    .bind(password_hash) // 动态生成的默认密码哈希
    .execute(&state.db)
    .await
    {
        Ok(_) => {
            let employee = Employee {
                id: user_id.to_string(),
                user_id: user_id.to_string(),
                employee_no: Some(employee_no.clone()),
                name: req.name,
                email: Some(req.email),
                phone: req.phone,
                position_id: position_uuid.map(|u| u.to_string()),
                position_name: None,
                department_id: department_uuid.map(|u| u.to_string()),
                department_name: None,
                hire_date: Some(hire_date),
                sort_order: None,
                status: "active".to_string(),
                is_active: true,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            // 返回时包含默认密码提示信息
            let response = serde_json::json!({
                "employee": employee,
                "default_password": format!("{}@123", username),
                "message": "员工创建成功，默认密码为用户名@123，请通知员工首次登录后修改密码"
            });
            (StatusCode::CREATED, Json(ApiResponse::success(response)))
        }
        Err(e) => {
            tracing::error!("Create employee error: {}", e);
            let error_msg = if e.to_string().contains("duplicate key") {
                if e.to_string().contains("username") {
                    "工号已存在，请使用其他工号".to_string()
                } else if e.to_string().contains("email") {
                    "邮箱已被使用".to_string()
                } else if e.to_string().contains("employee_no") {
                    "工号已存在".to_string()
                } else {
                    "创建员工失败，数据重复".to_string()
                }
            } else {
                "创建员工失败".to_string()
            };
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(error_msg)))
        }
    }
}

pub async fn convert_to_employee_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ConvertToEmployeeRequest>,
) -> impl IntoResponse {
    let user_id = match Uuid::parse_str(&req.user_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的用户ID".to_string())),
            );
        }
    };

    let position_uuid = optional_uuid_from_str(&req.position_id);
    let department_uuid = optional_uuid_from_str(&req.department_id);

    match sqlx::query(
        r#"UPDATE users SET employee_no = $1, hire_date = $2::date, position_id = $3, department_id = $4, status = 'active', is_active = true, must_change_password = false WHERE id = $5"#
    )
    .bind(&req.employee_no)
    .bind(&req.hire_date)
    .bind(position_uuid)
    .bind(department_uuid)
    .bind(user_id)
    .execute(&state.db)
    .await
    {
        Ok(result) => {
            if result.rows_affected() == 0 {
                return (
                    StatusCode::NOT_FOUND,
                    Json(ApiResponse::error("用户不存在".to_string())),
                );
            }

            let employee = Employee {
                id: user_id.to_string(),
                user_id: user_id.to_string(),
                employee_no: Some(req.employee_no.clone()),
                name: "".to_string(),
                email: None,
                phone: None,
                position_id: position_uuid.map(|u| u.to_string()),
                position_name: None,
                department_id: department_uuid.map(|u| u.to_string()),
                department_name: None,
                hire_date: Some(req.hire_date),
                sort_order: None,
                status: "active".to_string(),
                is_active: true,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            let response = serde_json::json!({
                "employee": employee,
                "message": "用户已成功转为员工"
            });
            (StatusCode::OK, Json(ApiResponse::success(response)))
        }
        Err(e) => {
            tracing::error!("Convert to employee error: {}", e);
            let error_msg = if e.to_string().contains("duplicate key") {
                if e.to_string().contains("employee_no") {
                    "工号已存在，请使用其他工号".to_string()
                } else {
                    "转成员工失败，数据重复".to_string()
                }
            } else {
                "转成员工失败".to_string()
            };
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(error_msg)))
        }
    }
}

pub async fn get_employee_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let user_uuid = match Uuid::parse_str(&id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的用户ID".to_string())),
            )
        }
    };

    match sqlx::query_as::<_, (Uuid, Option<String>, String, Option<String>, Option<String>, Option<Uuid>, Option<Uuid>, Option<chrono::NaiveDate>, Option<DateTime<Utc>>)>(
        r#"SELECT id, employee_no, name, email, phone, position_id, department_id, hire_date, created_at FROM users WHERE id = $1"#
    )
    .bind(user_uuid)
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some(r)) => {
            let position_id = r.5;
            let user_department_id = r.6;

            let position_name = if let Some(pos_id) = position_id {
                sqlx::query_scalar::<_, String>(r#"SELECT name FROM positions WHERE id = $1"#)
                    .bind(pos_id)
                    .fetch_optional(&state.db)
                    .await
                    .ok()
                    .flatten()
            } else {
                None
            };

            let mut department_name = if let Some(did) = user_department_id {
                sqlx::query_scalar::<_, String>(r#"SELECT name FROM departments WHERE id = $1"#)
                    .bind(did)
                    .fetch_optional(&state.db)
                    .await
                    .ok()
                    .flatten()
            } else {
                None
            };

            if department_name.is_none() {
                department_name = if let Some(pos_id) = position_id {
                    sqlx::query_scalar::<_, String>(r#"SELECT d.name FROM positions p LEFT JOIN departments d ON p.department_id = d.id WHERE p.id = $1"#)
                        .bind(pos_id)
                        .fetch_optional(&state.db)
                        .await
                        .ok()
                        .flatten()
                } else {
                    None
                };
            }

            let employee = Employee {
                id: r.0.to_string(),
                user_id: r.0.to_string(),
                employee_no: r.1,
                name: r.2.clone(),
                email: r.3,
                phone: r.4,
                position_id: position_id.map(|id| id.to_string()),
                position_name,
                department_id: user_department_id.map(|id| id.to_string()),
                department_name,
                hire_date: r.7.map(|d| d.format("%Y-%m-%d").to_string()),
                sort_order: None,
                status: "active".to_string(),
                is_active: true,
                created_at: r.8.unwrap_or(Utc::now()),
                updated_at: Utc::now(),
            };
            (StatusCode::OK, Json(ApiResponse::success(employee)))
        }
        Ok(None) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("员工不存在".to_string()))),
        Err(e) => {
            tracing::error!("Get employee error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("获取员工信息失败".to_string())))
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateEmployeeRequest {
    pub name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub position_id: Option<String>,
    pub department_id: Option<String>,
    pub employee_no: Option<String>,
    pub hire_date: Option<String>,
    pub status: Option<String>,
}

pub async fn update_employee_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<UpdateEmployeeRequest>,
) -> impl IntoResponse {
    let user_uuid = match Uuid::parse_str(&id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的用户ID".to_string())),
            )
        }
    };

    let hire_date: Option<chrono::NaiveDate> = req
        .hire_date
        .as_ref()
        .and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

    // 处理空字符串的情况：如果是空字符串，设置为None（表示要清空）；如果是None，则保持原字段不变
    let position_id = match req.position_id {
        Some(ref s) if s.is_empty() => Some(None),
        Some(_) => Some(optional_uuid_from_str(&req.position_id)),
        None => None,
    };

    let department_id = match req.department_id {
        Some(ref s) if s.is_empty() => Some(None),
        Some(_) => Some(optional_uuid_from_str(&req.department_id)),
        None => None,
    };

    let result = sqlx::query(
        r#"UPDATE users SET 
           name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           position_id = CASE WHEN $4 IS NOT NULL THEN $4 ELSE position_id END,
           department_id = CASE WHEN $5 IS NOT NULL THEN $5 ELSE department_id END,
           employee_no = COALESCE($6, employee_no),
           hire_date = COALESCE($7, hire_date),
           status = COALESCE($8, status),
           updated_at = CURRENT_TIMESTAMP
           WHERE id = $9"#,
    )
    .bind(&req.name)
    .bind(&req.email)
    .bind(&req.phone)
    .bind(position_id.flatten())
    .bind(department_id.flatten())
    .bind(&req.employee_no)
    .bind(hire_date)
    .bind(&req.status)
    .bind(user_uuid)
    .execute(&state.db)
    .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (
            StatusCode::OK,
            Json(ApiResponse::success(
                serde_json::json!({"message": "员工信息已更新"}),
            )),
        ),
        Ok(_) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error("员工不存在".to_string())),
        ),
        Err(e) => {
            tracing::error!("Update employee error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("更新员工信息失败".to_string())),
            )
        }
    }
}

pub async fn delete_employee_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let user_uuid = match Uuid::parse_str(&id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的用户ID".to_string())),
            )
        }
    };

    let result = sqlx::query(
        r#"UPDATE users SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = $1"#,
    )
    .bind(user_uuid)
    .execute(&state.db)
    .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (
            StatusCode::OK,
            Json(ApiResponse::success(
                serde_json::json!({"message": "员工已删除"}),
            )),
        ),
        Ok(_) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error("员工不存在".to_string())),
        ),
        Err(e) => {
            tracing::error!("Delete employee error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("删除员工失败".to_string())),
            )
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttendanceRecord {
    pub id: String,
    pub employee_id: String,
    pub employee_name: String,
    pub attendance_date: String,
    pub check_in: Option<String>,
    pub check_out: Option<String>,
    pub check_in_location: Option<String>,
    pub check_out_location: Option<String>,
    pub status: String,
    pub work_hours: Option<BigDecimal>,
    pub overtime_hours: Option<BigDecimal>,
    pub late_minutes: Option<i32>,
    pub early_leave_minutes: Option<i32>,
    pub remark: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckInRequest {
    pub location: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

pub async fn check_in_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Query(_params): Query<std::collections::HashMap<String, String>>,
    Json(req): Json<CheckInRequest>,
) -> impl IntoResponse {
    let user_uuid = match extract_user_from_headers(&headers, &state.config.jwt_secret) {
        Ok(id) => id,
        Err((status, msg)) => {
            return (status, Json(ApiResponse::error(msg)));
        }
    };

    let today = Utc::now().format("%Y-%m-%d").to_string();

    let existing = sqlx::query_as::<_, (Uuid,)>(
        r#"SELECT id FROM attendance_records WHERE user_id = $1 AND attendance_date = $2::date"#,
    )
    .bind(user_uuid)
    .bind(&today)
    .fetch_optional(&state.db)
    .await;

    match existing {
        Ok(Some(_record)) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("今日已签到".to_string())),
        ),
        Ok(None) => {
            let record_id = Uuid::new_v4();
            let now = Utc::now();
            let check_in_time = now.format("%H:%M:%S").to_string();
            let status = if now.hour() > 9 || (now.hour() == 9 && now.minute() > 0) {
                "late"
            } else {
                "normal"
            };

            match sqlx::query(
                r#"INSERT INTO attendance_records (id, user_id, attendance_date, check_in_time, check_in_location, status)
                   VALUES ($1, $2, $3::date, $4, $5, $6)"#
            )
            .bind(record_id)
            .bind(user_uuid)
            .bind(&today)
            .bind(now)
            .bind(&req.location)
            .bind(status)
            .execute(&state.db)
            .await
            {
                Ok(_) => {
                    let user_name = sqlx::query_scalar::<_, String>(r#"SELECT name FROM users WHERE id = $1"#)
                        .bind(user_uuid)
                        .fetch_optional(&state.db)
                        .await
                        .ok()
                        .flatten()
                        .unwrap_or_else(|| "未知".to_string());

                    let record = AttendanceRecord {
                        id: record_id.to_string(),
                        employee_id: user_uuid.to_string(),
                        employee_name: user_name,
                        attendance_date: today,
                        check_in: Some(check_in_time),
                        check_out: None,
                        check_in_location: req.location,
                        check_out_location: None,
                        status: status.to_string(),
                        work_hours: None,
                        overtime_hours: None,
                        late_minutes: None,
                        early_leave_minutes: None,
                        remark: None,
                        created_at: now,
                        updated_at: now,
                    };
                    (StatusCode::CREATED, Json(ApiResponse::success(record)))
                }
                Err(e) => {
                    tracing::error!("Check in error: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("签到失败".to_string())))
                }
            }
        }
        Err(e) => {
            tracing::error!("Check in query error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("签到失败".to_string())),
            )
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckOutRequest {
    pub location: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

pub async fn check_out_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Query(_params): Query<std::collections::HashMap<String, String>>,
    Json(req): Json<CheckOutRequest>,
) -> impl IntoResponse {
    let user_uuid = match extract_user_from_headers(&headers, &state.config.jwt_secret) {
        Ok(id) => id,
        Err((status, msg)) => {
            return (status, Json(ApiResponse::error(msg)));
        }
    };

    let today = Utc::now().format("%Y-%m-%d").to_string();
    let now = Utc::now();
    let check_out_time = now.format("%H:%M:%S").to_string();

    let result = sqlx::query(
        r#"UPDATE attendance_records SET 
           check_out_time = $1,
           check_out_location = $2,
           updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $3 AND attendance_date = $4::date AND check_out_time IS NULL"#,
    )
    .bind(now)
    .bind(&req.location)
    .bind(user_uuid)
    .bind(&today)
    .execute(&state.db)
    .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => {
            let record = sqlx::query_as::<_, (Uuid, DateTime<Utc>, Option<DateTime<Utc>>, String, Option<String>)>(
                r#"SELECT id, check_in_time, check_out_time, status, check_in_location FROM attendance_records 
                   WHERE user_id = $1 AND attendance_date = $2::date"#
            )
            .bind(user_uuid)
            .bind(&today)
            .fetch_one(&state.db)
            .await;

            match record {
                Ok(r) => {
                    let work_hours = r.2.map(|checkout| {
                        BigDecimal::from((checkout - r.1).num_minutes()) / BigDecimal::from(60)
                    });

                    let user_name =
                        sqlx::query_scalar::<_, String>(r#"SELECT name FROM users WHERE id = $1"#)
                            .bind(user_uuid)
                            .fetch_optional(&state.db)
                            .await
                            .ok()
                            .flatten()
                            .unwrap_or_else(|| "未知".to_string());

                    let record = AttendanceRecord {
                        id: r.0.to_string(),
                        employee_id: user_uuid.to_string(),
                        employee_name: user_name,
                        attendance_date: today,
                        check_in: Some(r.1.format("%H:%M:%S").to_string()),
                        check_out: Some(check_out_time),
                        check_in_location: r.4,
                        check_out_location: req.location,
                        status: r.3,
                        work_hours,
                        overtime_hours: None,
                        late_minutes: None,
                        early_leave_minutes: None,
                        remark: None,
                        created_at: r.1,
                        updated_at: now,
                    };
                    (StatusCode::OK, Json(ApiResponse::success(record)))
                }
                Err(e) => {
                    tracing::error!("Fetch record error: {}", e);
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(ApiResponse::error("签退失败".to_string())),
                    )
                }
            }
        }
        Ok(_) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("未签到或已签退".to_string())),
        ),
        Err(e) => {
            tracing::error!("Check out error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("签退失败".to_string())),
            )
        }
    }
}

pub async fn get_attendance_records_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let page = params
        .get("page")
        .and_then(|p| p.parse::<i32>().ok())
        .unwrap_or(1);
    let page_size = params
        .get("page_size")
        .and_then(|p| p.parse::<i32>().ok())
        .unwrap_or(100);

    // 验证用户身份
    let _user_uuid = match extract_user_from_headers(&headers, &state.config.jwt_secret) {
        Ok(id) => id,
        Err((status, msg)) => {
            return (status, Json(ApiResponse::error(msg)));
        }
    };

    let records = match sqlx::query_as::<_, (Uuid, Uuid, chrono::NaiveDate, Option<DateTime<Utc>>, Option<String>, Option<DateTime<Utc>>, Option<String>, String, Option<BigDecimal>, Option<BigDecimal>, Option<i32>, Option<i32>, Option<String>, DateTime<Utc>, DateTime<Utc>)>(
        r#"SELECT id, user_id, attendance_date, check_in_time, check_in_location, check_out_time, check_out_location, status, work_hours, overtime_hours, late_minutes, early_leave_minutes, remark, created_at, updated_at 
           FROM attendance_records ORDER BY attendance_date DESC LIMIT $1 OFFSET $2"#
    )
    .bind(page_size)
    .bind((page - 1) * page_size)
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => {
            let mut result = Vec::new();
            for r in rows {
                let user_name = sqlx::query_scalar::<_, String>(r#"SELECT name FROM users WHERE id = $1"#)
                    .bind(r.1)
                    .fetch_optional(&state.db)
                    .await
                    .ok()
                    .flatten()
                    .unwrap_or_else(|| "未知".to_string());

                result.push(AttendanceRecord {
                    id: r.0.to_string(),
                    employee_id: r.1.to_string(),
                    employee_name: user_name,
                    attendance_date: r.2.format("%Y-%m-%d").to_string(),
                    check_in: r.3.map(|t| t.format("%H:%M:%S").to_string()),
                    check_out: r.5.map(|t| t.format("%H:%M:%S").to_string()),
                    check_in_location: r.4,
                    check_out_location: r.6,
                    status: r.7,
                    work_hours: r.8,
                    overtime_hours: r.9,
                    late_minutes: r.10,
                    early_leave_minutes: r.11,
                    remark: r.12,
                    created_at: r.13,
                    updated_at: r.14,
                });
            }
            result
        }
        Err(e) => {
            eprintln!("Error fetching attendance records: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(records)))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeaveRequest {
    pub id: String,
    pub employee_id: String,
    pub employee_name: String,
    pub leave_type: String,
    pub start_date: String,
    pub end_date: String,
    pub total_days: f64,
    pub reason: String,
    pub status: String,
    pub approved_by: Option<String>,
    pub approved_at: Option<DateTime<Utc>>,
    pub remark: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateLeaveRequest {
    pub leave_type: String,
    pub start_date: String,
    pub end_date: String,
    pub reason: String,
}

pub async fn create_leave_request_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Query(_params): Query<std::collections::HashMap<String, String>>,
    Json(req): Json<CreateLeaveRequest>,
) -> impl IntoResponse {
    let user_uuid = match extract_user_from_headers(&headers, &state.config.jwt_secret) {
        Ok(id) => id,
        Err((status, msg)) => {
            return (status, Json(ApiResponse::error(msg)));
        }
    };

    let leave_id = Uuid::new_v4();

    match sqlx::query(
        r#"INSERT INTO leave_requests (id, user_id, leave_type, start_date, end_date, total_days, reason, status)
           VALUES ($1, $2, $3, $4::date, $5::date, $6, $7, 'pending')"#
    )
    .bind(leave_id)
    .bind(user_uuid)
    .bind(&req.leave_type)
    .bind(&req.start_date)
    .bind(&req.end_date)
    .bind(1.0)
    .bind(&req.reason)
    .execute(&state.db)
    .await
    {
        Ok(_) => {
            let user_name = sqlx::query_scalar::<_, String>(r#"SELECT name FROM users WHERE id = $1"#)
                .bind(user_uuid)
                .fetch_optional(&state.db)
                .await
                .ok()
                .flatten()
                .unwrap_or_else(|| "未知".to_string());

            let leave = LeaveRequest {
                id: leave_id.to_string(),
                employee_id: user_uuid.to_string(),
                employee_name: user_name,
                leave_type: req.leave_type,
                start_date: req.start_date,
                end_date: req.end_date,
                total_days: 1.0,
                reason: req.reason,
                status: "pending".to_string(),
                approved_by: None,
                approved_at: None,
                remark: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            (StatusCode::CREATED, Json(ApiResponse::success(leave)))
        }
        Err(e) => {
            tracing::error!("Create leave request error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("创建请假申请失败".to_string())))
        }
    }
}

pub async fn get_leave_requests_handler(
    State(state): State<Arc<AppState>>,
    Query(_params): Query<std::collections::HashMap<String, String>>,
    headers: HeaderMap,
) -> impl IntoResponse {
    // 验证用户身份
    let _user_uuid = match extract_user_from_headers(&headers, &state.config.jwt_secret) {
        Ok(id) => id,
        Err((status, msg)) => {
            return (status, Json(ApiResponse::error(msg)));
        }
    };

    let requests = match sqlx::query_as::<_, (Uuid, Uuid, String, chrono::NaiveDate, chrono::NaiveDate, f64, Option<String>, String, Option<Uuid>, Option<DateTime<Utc>>, Option<String>, DateTime<Utc>, DateTime<Utc>)>(
        r#"SELECT id, user_id, leave_type, start_date, end_date, total_days::double precision, reason, status, approved_by, approved_at, remark, created_at, updated_at 
           FROM leave_requests ORDER BY created_at DESC"#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => {
            let mut result = Vec::new();
            for r in rows {
                let user_name = sqlx::query_scalar::<_, String>(r#"SELECT name FROM users WHERE id = $1"#)
                    .bind(r.1)
                    .fetch_optional(&state.db)
                    .await
                    .ok()
                    .flatten()
                    .unwrap_or_else(|| "未知".to_string());

                let approved_by_name = if let Some(approver_id) = r.8 {
                    sqlx::query_scalar::<_, String>(r#"SELECT name FROM users WHERE id = $1"#)
                        .bind(approver_id)
                        .fetch_optional(&state.db)
                        .await
                        .ok()
                        .flatten()
                } else {
                    None
                };

                result.push(LeaveRequest {
                    id: r.0.to_string(),
                    employee_id: r.1.to_string(),
                    employee_name: user_name,
                    leave_type: r.2,
                    start_date: r.3.format("%Y-%m-%d").to_string(),
                    end_date: r.4.format("%Y-%m-%d").to_string(),
                    total_days: r.5,
                    reason: r.6.unwrap_or_default(),
                    status: r.7,
                    approved_by: approved_by_name,
                    approved_at: r.9,
                    remark: r.10,
                    created_at: r.11,
                    updated_at: r.12,
                });
            }
            result
        }
        Err(e) => {
            eprintln!("Error fetching leave requests: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(requests)))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApproveLeaveRequest {
    pub approved: bool,
    pub comment: Option<String>,
}

pub async fn approve_leave_request_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Query(_params): Query<std::collections::HashMap<String, String>>,
    Path(id): Path<String>,
    Json(req): Json<ApproveLeaveRequest>,
) -> impl IntoResponse {
    let leave_uuid = match Uuid::parse_str(&id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的请假ID".to_string())),
            )
        }
    };

    let approver_id = match extract_user_from_headers(&headers, &state.config.jwt_secret) {
        Ok(id) => Some(id),
        Err((status, msg)) => {
            return (status, Json(ApiResponse::error(msg)));
        }
    };

    let new_status = if req.approved { "approved" } else { "rejected" };

    let result = sqlx::query(
        r#"UPDATE leave_requests SET 
           status = $1,
           approved_by = $2,
           approved_at = CURRENT_TIMESTAMP,
           remark = COALESCE($3, remark),
           updated_at = CURRENT_TIMESTAMP
           WHERE id = $4"#,
    )
    .bind(new_status)
    .bind(approver_id)
    .bind(&req.comment)
    .bind(leave_uuid)
    .execute(&state.db)
    .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (
            StatusCode::OK,
            Json(ApiResponse::success(serde_json::json!({
                "message": if req.approved { "请假已批准" } else { "请假已拒绝" },
                "comment": req.comment
            }))),
        ),
        Ok(_) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error("请假申请不存在".to_string())),
        ),
        Err(e) => {
            tracing::error!("Approve leave request error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("审批失败".to_string())),
            )
        }
    }
}

pub async fn get_leave_request_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let leave_uuid = match Uuid::parse_str(&id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的请假ID".to_string())),
            )
        }
    };

    match sqlx::query_as::<_, (Uuid, Uuid, String, chrono::NaiveDate, chrono::NaiveDate, f64, Option<String>, String, Option<Uuid>, Option<DateTime<Utc>>, Option<String>, DateTime<Utc>, DateTime<Utc>)>(
        r#"SELECT id, user_id, leave_type, start_date, end_date, total_days::double precision, reason, status, approved_by, approved_at, remark, created_at, updated_at 
           FROM leave_requests WHERE id = $1"#
    )
    .bind(leave_uuid)
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some(r)) => {
            let user_name = sqlx::query_scalar::<_, String>(r#"SELECT name FROM users WHERE id = $1"#)
                .bind(r.1)
                .fetch_optional(&state.db)
                .await
                .ok()
                .flatten()
                .unwrap_or_else(|| "未知".to_string());

            let approved_by_name = if let Some(approver_id) = r.8 {
                sqlx::query_scalar::<_, String>(r#"SELECT name FROM users WHERE id = $1"#)
                    .bind(approver_id)
                    .fetch_optional(&state.db)
                    .await
                    .ok()
                    .flatten()
            } else {
                None
            };

            let leave = LeaveRequest {
                id: r.0.to_string(),
                employee_id: r.1.to_string(),
                employee_name: user_name,
                leave_type: r.2,
                start_date: r.3.format("%Y-%m-%d").to_string(),
                end_date: r.4.format("%Y-%m-%d").to_string(),
                total_days: r.5,
                reason: r.6.unwrap_or_default(),
                status: r.7,
                approved_by: approved_by_name,
                approved_at: r.9,
                remark: r.10,
                created_at: r.11,
                updated_at: r.12,
            };
            (StatusCode::OK, Json(ApiResponse::success(leave)))
        }
        Ok(None) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("请假申请不存在".to_string()))),
        Err(e) => {
            tracing::error!("Get leave request error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("获取请假信息失败".to_string())))
        }
    }
}

pub async fn update_leave_request_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<CreateLeaveRequest>,
) -> impl IntoResponse {
    let leave_uuid = match Uuid::parse_str(&id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的请假ID".to_string())),
            )
        }
    };

    let result = sqlx::query(
        r#"UPDATE leave_requests SET 
           leave_type = $1,
           start_date = $2::date,
           end_date = $3::date,
           reason = $4,
           updated_at = CURRENT_TIMESTAMP
           WHERE id = $5 AND status = 'pending'"#,
    )
    .bind(&req.leave_type)
    .bind(&req.start_date)
    .bind(&req.end_date)
    .bind(&req.reason)
    .bind(leave_uuid)
    .execute(&state.db)
    .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (
            StatusCode::OK,
            Json(ApiResponse::success(
                serde_json::json!({"message": "请假申请已更新"}),
            )),
        ),
        Ok(_) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("请假申请不存在或已审批".to_string())),
        ),
        Err(e) => {
            tracing::error!("Update leave request error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("更新请假申请失败".to_string())),
            )
        }
    }
}

pub async fn delete_leave_request_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let leave_uuid = match Uuid::parse_str(&id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的请假ID".to_string())),
            )
        }
    };

    let result = sqlx::query(r#"DELETE FROM leave_requests WHERE id = $1 AND status = 'pending'"#)
        .bind(leave_uuid)
        .execute(&state.db)
        .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => (
            StatusCode::OK,
            Json(ApiResponse::success(
                serde_json::json!({"message": "请假申请已删除"}),
            )),
        ),
        Ok(_) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("请假申请不存在或已审批".to_string())),
        ),
        Err(e) => {
            tracing::error!("Delete leave request error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("删除请假申请失败".to_string())),
            )
        }
    }
}

pub async fn get_attendance_today_handler(
    State(state): State<Arc<AppState>>,
    Query(_params): Query<std::collections::HashMap<String, String>>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let user_uuid = match extract_user_from_headers(&headers, &state.config.jwt_secret) {
        Ok(id) => id,
        Err((status, msg)) => {
            return (
                status,
                Json(serde_json::json!({
                    "success": false,
                    "data": null,
                    "error": msg,
                })),
            );
        }
    };

    let today = Utc::now().format("%Y-%m-%d").to_string();

    match sqlx::query_as::<_, (Uuid, Uuid, chrono::NaiveDate, Option<DateTime<Utc>>, Option<String>, Option<DateTime<Utc>>, Option<String>, String, Option<BigDecimal>, Option<BigDecimal>, Option<i32>, Option<i32>, Option<String>, DateTime<Utc>, DateTime<Utc>)>(
        r#"SELECT id, user_id, attendance_date, check_in_time, check_in_location, check_out_time, check_out_location, status, work_hours, overtime_hours, late_minutes, early_leave_minutes, remark, created_at, updated_at 
           FROM attendance_records WHERE user_id = $1 AND attendance_date = $2::date"#
    )
    .bind(user_uuid)
    .bind(&today)
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some(r)) => {
            let user_name = sqlx::query_scalar::<_, String>(r#"SELECT name FROM users WHERE id = $1"#)
                .bind(r.1)
                .fetch_optional(&state.db)
                .await
                .ok()
                .flatten()
                .unwrap_or_else(|| "未知".to_string());

            let record = AttendanceRecord {
                id: r.0.to_string(),
                employee_id: r.1.to_string(),
                employee_name: user_name,
                attendance_date: r.2.format("%Y-%m-%d").to_string(),
                check_in: r.3.map(|t| t.format("%H:%M:%S").to_string()),
                check_out: r.5.map(|t| t.format("%H:%M:%S").to_string()),
                check_in_location: r.4,
                check_out_location: r.6,
                status: r.7,
                work_hours: r.8,
                overtime_hours: r.9,
                late_minutes: r.10,
                early_leave_minutes: r.11,
                remark: r.12,
                created_at: r.13,
                updated_at: r.14,
            };
            let response = serde_json::json!({
                "success": true,
                "data": record,
                "error": null,
            });
            (StatusCode::OK, Json(response))
        }
        Ok(None) => {
            let response = serde_json::json!({
                "success": true,
                "data": null,
                "error": null,
            });
            (StatusCode::OK, Json(response))
        }
        Err(e) => {
            tracing::error!("Get today attendance error: {}", e);
            let response = serde_json::json!({
                "success": false,
                "data": null,
                "error": "获取今日考勤失败",
            });
            (StatusCode::INTERNAL_SERVER_ERROR, Json(response))
        }
    }
}

pub async fn get_attendance_month_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let user_uuid = match extract_user_from_headers(&headers, &state.config.jwt_secret) {
        Ok(id) => id,
        Err((status, msg)) => {
            return (status, Json(ApiResponse::error(msg)));
        }
    };
    let year = params
        .get("year")
        .and_then(|y| y.parse::<i32>().ok())
        .unwrap_or_else(|| Utc::now().year());
    let month = params
        .get("month")
        .and_then(|m| m.parse::<u32>().ok())
        .unwrap_or_else(|| Utc::now().month());

    let start_date = format!("{}-{:02}-01", year, month);
    let end_date = if month == 12 {
        format!("{}-01-01", year + 1)
    } else {
        format!("{}-{:02}-01", year, month + 1)
    };

    match sqlx::query_as::<_, (Uuid, Uuid, chrono::NaiveDate, Option<DateTime<Utc>>, Option<String>, Option<DateTime<Utc>>, Option<String>, String, Option<BigDecimal>, Option<BigDecimal>, Option<i32>, Option<i32>, Option<String>, DateTime<Utc>, DateTime<Utc>)>(
        r#"SELECT id, user_id, attendance_date, check_in_time, check_in_location, check_out_time, check_out_location, status, work_hours, overtime_hours, late_minutes, early_leave_minutes, remark, created_at, updated_at 
           FROM attendance_records WHERE user_id = $1 AND attendance_date >= $2::date AND attendance_date < $3::date ORDER BY attendance_date"#
    )
    .bind(user_uuid)
    .bind(&start_date)
    .bind(&end_date)
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => {
            let user_name = sqlx::query_scalar::<_, String>(r#"SELECT name FROM users WHERE id = $1"#)
                .bind(user_uuid)
                .fetch_optional(&state.db)
                .await
                .ok()
                .flatten()
                .unwrap_or_else(|| "未知".to_string());

            let records: Vec<AttendanceRecord> = rows.into_iter().map(|r| {
                AttendanceRecord {
                    id: r.0.to_string(),
                    employee_id: r.1.to_string(),
                    employee_name: user_name.clone(),
                    attendance_date: r.2.format("%Y-%m-%d").to_string(),
                    check_in: r.3.map(|t| t.format("%H:%M:%S").to_string()),
                    check_out: r.5.map(|t| t.format("%H:%M:%S").to_string()),
                    check_in_location: r.4,
                    check_out_location: r.6,
                    status: r.7,
                    work_hours: r.8,
                    overtime_hours: r.9,
                    late_minutes: r.10,
                    early_leave_minutes: r.11,
                    remark: r.12,
                    created_at: r.13,
                    updated_at: r.14,
                }
            }).collect();

            (StatusCode::OK, Json(ApiResponse::success(records)))
        }
        Err(e) => {
            tracing::error!("Get month attendance error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("获取月度考勤失败".to_string())))
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttendanceStatistics {
    pub total_days: i32,
    pub work_days: i32,
    pub leave_days: i32,
    pub late_count: i32,
    pub early_leave_count: i32,
    pub overtime_hours: f64,
}

pub async fn get_attendance_stats_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let user_uuid = match extract_user_from_headers(&headers, &state.config.jwt_secret) {
        Ok(id) => id,
        Err((status, msg)) => {
            return (status, Json(ApiResponse::error(msg)));
        }
    };
    let year = params
        .get("year")
        .and_then(|y| y.parse::<i32>().ok())
        .unwrap_or_else(|| Utc::now().year());
    let month = params
        .get("month")
        .and_then(|m| m.parse::<u32>().ok())
        .unwrap_or_else(|| Utc::now().month());

    let start_date = format!("{}-{:02}-01", year, month);
    let end_date = if month == 12 {
        format!("{}-01-01", year + 1)
    } else {
        format!("{}-{:02}-01", year, month + 1)
    };

    let stats = match sqlx::query_as::<_, (i64, i64, i64, i64, i64, f64)>(
        r#"SELECT 
            COALESCE(COUNT(*), 0) as total_days,
            COALESCE(SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END), 0) as work_days,
            COALESCE(SUM(CASE WHEN status IN ('leave', 'on_leave') THEN 1 ELSE 0 END), 0) as leave_days,
            COALESCE(SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END), 0) as late_count,
            COALESCE(SUM(CASE WHEN status = 'early_leave' THEN 1 ELSE 0 END), 0) as early_leave_count,
            COALESCE(SUM(overtime_hours), 0)::double precision as overtime_hours
           FROM attendance_records 
           WHERE user_id = $1 AND attendance_date >= $2::date AND attendance_date < $3::date"#
    )
    .bind(user_uuid)
    .bind(&start_date)
    .bind(&end_date)
    .fetch_one(&state.db)
    .await
    {
        Ok(r) => AttendanceStatistics {
            total_days: r.0 as i32,
            work_days: r.1 as i32,
            leave_days: r.2 as i32,
            late_count: r.3 as i32,
            early_leave_count: r.4 as i32,
            overtime_hours: r.5,
        },
        Err(e) => {
            tracing::error!("Get attendance stats error: {}", e);
            AttendanceStatistics {
                total_days: 0,
                work_days: 0,
                leave_days: 0,
                late_count: 0,
                early_leave_count: 0,
                overtime_hours: 0.0,
            }
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(stats)))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PositionHR {
    pub id: String,
    pub name: String,
    pub code: String,
    pub description: Option<String>,
    pub department_id: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn get_positions_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let positions = match sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<Uuid>, bool, DateTime<Utc>, DateTime<Utc>)>(
        r#"SELECT id, name, code, description, department_id, true as is_active, created_at, updated_at FROM positions ORDER BY created_at"#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records.into_iter().map(|r| PositionHR {
            id: r.0.to_string(),
            name: r.1,
            code: r.2,
            description: r.3,
            department_id: r.4.map(|id| id.to_string()),
            is_active: r.5,
            created_at: r.6,
            updated_at: r.7,
        }).collect::<Vec<PositionHR>>(),
        Err(e) => {
            eprintln!("Error fetching positions: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(positions)))
}
