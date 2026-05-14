use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::errors::ApiResponse;
use crate::AppState;

// ========== 会计科目 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub id: String,
    pub account_code: String,
    pub account_name: String,
    pub account_type: Option<String>,
    pub parent_id: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAccountRequest {
    pub account_code: String,
    pub account_name: String,
    pub account_type: Option<String>,
    pub parent_id: Option<String>,
}

pub async fn get_accounts_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let account_type = params.get("account_type").cloned();

    let mut query = String::from("SELECT id, account_code, account_name, account_type, parent_id, is_active, created_at, updated_at FROM erp_accounts WHERE is_active = true");

    if account_type.is_some() {
        query.push_str(" AND account_type = $1");
    }

    query.push_str(" ORDER BY account_code");

    let accounts = match sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            String,
            Option<String>,
            Option<Uuid>,
            bool,
            DateTime<Utc>,
            DateTime<Utc>,
        ),
    >(&query)
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records
            .into_iter()
            .map(|r| Account {
                id: r.0.to_string(),
                account_code: r.1,
                account_name: r.2,
                account_type: r.3,
                parent_id: r.4.map(|id| id.to_string()),
                is_active: r.5,
                created_at: r.6,
                updated_at: r.7,
            })
            .collect::<Vec<Account>>(),
        Err(e) => {
            eprintln!("Error fetching accounts: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(accounts)))
}

pub async fn get_account_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let account_id = match Uuid::parse_str(&id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的科目ID".to_string())),
            )
        }
    };

    match sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<Uuid>, bool, DateTime<Utc>, DateTime<Utc>)>(
        "SELECT id, account_code, account_name, account_type, parent_id, is_active, created_at, updated_at FROM erp_accounts WHERE id = $1"
    )
    .bind(account_id)
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some(r)) => {
            let account = Account {
                id: r.0.to_string(),
                account_code: r.1,
                account_name: r.2,
                account_type: r.3,
                parent_id: r.4.map(|id| id.to_string()),
                is_active: r.5,
                created_at: r.6,
                updated_at: r.7,
            };
            (StatusCode::OK, Json(ApiResponse::success(account)))
        },
        Ok(None) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("科目不存在".to_string()))),
        Err(e) => {
            tracing::error!("Get account error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("获取科目失败".to_string())))
        }
    }
}

pub async fn create_account_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateAccountRequest>,
) -> impl IntoResponse {
    let account_id = Uuid::new_v4();
    let parent_id = req.parent_id.clone().and_then(|s| Uuid::parse_str(&s).ok());

    match sqlx::query(
        "INSERT INTO erp_accounts (id, account_code, account_name, account_type, parent_id) VALUES ($1, $2, $3, $4, $5)"
    )
    .bind(account_id)
    .bind(&req.account_code)
    .bind(&req.account_name)
    .bind(&req.account_type)
    .bind(parent_id)
    .execute(&state.db)
    .await
    {
        Ok(_) => {
            let account = Account {
                id: account_id.to_string(),
                account_code: req.account_code,
                account_name: req.account_name,
                account_type: req.account_type,
                parent_id: req.parent_id,
                is_active: true,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            (StatusCode::CREATED, Json(ApiResponse::success(account)))
        }
        Err(e) => {
            tracing::error!("Create account error: {}", e);
            let error_msg = if e.to_string().contains("duplicate key") {
                "科目编码已存在".to_string()
            } else {
                "创建科目失败".to_string()
            };
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(error_msg)))
        }
    }
}

// ========== 凭证 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Voucher {
    pub id: String,
    pub voucher_no: String,
    pub voucher_date: DateTime<Utc>,
    pub voucher_type: Option<String>,
    pub reference_type: Option<String>,
    pub reference_id: Option<String>,
    pub description: Option<String>,
    pub status: String,
    pub total_debit: BigDecimal,
    pub total_credit: BigDecimal,
    pub created_by: Option<String>,
    pub approved_by: Option<String>,
    pub approved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoucherItem {
    pub id: String,
    pub account_id: String,
    pub account_name: Option<String>,
    pub debit: BigDecimal,
    pub credit: BigDecimal,
    pub remark: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateVoucherRequest {
    pub voucher_type: Option<String>,
    pub reference_type: Option<String>,
    pub reference_id: Option<String>,
    pub description: Option<String>,
    pub items: Vec<VoucherItemRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoucherItemRequest {
    pub account_id: String,
    pub debit: BigDecimal,
    pub credit: BigDecimal,
    pub remark: Option<String>,
}

pub async fn get_vouchers_handler(
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
        .unwrap_or(20);
    let status = params.get("status").cloned();

    let offset = (page - 1) * page_size;

    let mut query = String::from("SELECT id, voucher_no, voucher_date, voucher_type, reference_type, reference_id, description, status, total_debit, total_credit, created_by, approved_by, approved_at, created_at, updated_at FROM erp_vouchers WHERE 1=1");
    let mut count_query = String::from("SELECT COUNT(*) FROM erp_vouchers WHERE 1=1");

    if status.is_some() {
        query.push_str(" AND status = $1");
        count_query.push_str(" AND status = $1");
    }

    query.push_str(" ORDER BY created_at DESC LIMIT $2 OFFSET $3");

    let vouchers = match sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            DateTime<Utc>,
            Option<String>,
            Option<String>,
            Option<Uuid>,
            Option<String>,
            String,
            BigDecimal,
            BigDecimal,
            Option<Uuid>,
            Option<Uuid>,
            Option<DateTime<Utc>>,
            DateTime<Utc>,
            DateTime<Utc>,
        ),
    >(&query)
    .bind(status.clone())
    .bind(page_size)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records
            .into_iter()
            .map(|r| Voucher {
                id: r.0.to_string(),
                voucher_no: r.1,
                voucher_date: r.2,
                voucher_type: r.3,
                reference_type: r.4,
                reference_id: r.5.map(|id| id.to_string()),
                description: r.6,
                status: r.7,
                total_debit: r.8,
                total_credit: r.9,
                created_by: r.10.map(|id| id.to_string()),
                approved_by: r.11.map(|id| id.to_string()),
                approved_at: r.12,
                created_at: r.13,
                updated_at: r.14,
            })
            .collect::<Vec<Voucher>>(),
        Err(e) => {
            eprintln!("Error fetching vouchers: {}", e);
            vec![]
        }
    };

    let total: i64 = match sqlx::query_scalar(&count_query)
        .bind(status)
        .fetch_one(&state.db)
        .await
    {
        Ok(count) => count,
        Err(_) => 0,
    };

    let result = serde_json::json!({
        "list": vouchers,
        "total": total,
        "page": page,
        "page_size": page_size
    });

    (StatusCode::OK, Json(ApiResponse::success(result)))
}

pub async fn create_voucher_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateVoucherRequest>,
) -> impl IntoResponse {
    let voucher_id = Uuid::new_v4();
    let voucher_no = format!("VCH{}", Utc::now().format("%Y%m%d%H%M%S"));
    let reference_id = req
        .reference_id
        .clone()
        .and_then(|s| Uuid::parse_str(&s).ok());

    let mut total_debit = BigDecimal::from(0);
    let mut total_credit = BigDecimal::from(0);

    for item in &req.items {
        total_debit += &item.debit;
        total_credit += &item.credit;
    }

    let mut tx = match state.db.begin().await {
        Ok(tx) => tx,
        Err(e) => {
            tracing::error!("Begin transaction error: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("创建凭证失败".to_string())),
            );
        }
    };

    match sqlx::query(
        "INSERT INTO erp_vouchers (id, voucher_no, voucher_type, reference_type, reference_id, description, total_debit, total_credit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
    )
    .bind(voucher_id)
    .bind(&voucher_no)
    .bind(&req.voucher_type)
    .bind(&req.reference_type)
    .bind(reference_id)
    .bind(&req.description)
    .bind(&total_debit)
    .bind(&total_credit)
    .execute(&mut *tx)
    .await
    {
        Ok(_) => {
            for item in req.items {
                let account_id = match Uuid::parse_str(&item.account_id) {
                    Ok(id) => id,
                    Err(_) => {
                        let _ = tx.rollback().await;
                        return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("无效的科目ID".to_string())));
                    }
                };

                let item_id = Uuid::new_v4();
                if let Err(e) = sqlx::query(
                    "INSERT INTO erp_voucher_items (id, voucher_id, account_id, debit, credit, remark) VALUES ($1, $2, $3, $4, $5, $6)"
                )
                .bind(item_id)
                .bind(voucher_id)
                .bind(account_id)
                .bind(&item.debit)
                .bind(&item.credit)
                .bind(&item.remark)
                .execute(&mut *tx)
                .await
                {
                    tracing::error!("Insert voucher item error: {}", e);
                    let _ = tx.rollback().await;
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("创建凭证明细失败".to_string())));
                }
            }

            if let Err(e) = tx.commit().await {
                tracing::error!("Commit transaction error: {}", e);
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("创建凭证失败".to_string())));
            }

            let voucher = Voucher {
                id: voucher_id.to_string(),
                voucher_no,
                voucher_date: Utc::now(),
                voucher_type: req.voucher_type,
                reference_type: req.reference_type,
                reference_id: req.reference_id,
                description: req.description,
                status: "draft".to_string(),
                total_debit,
                total_credit,
                created_by: None,
                approved_by: None,
                approved_at: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            (StatusCode::CREATED, Json(ApiResponse::success(voucher)))
        }
        Err(e) => {
            let _ = tx.rollback().await;
            tracing::error!("Create voucher error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("创建凭证失败".to_string())))
        }
    }
}

// ========== 收付款 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payment {
    pub id: String,
    pub payment_no: String,
    pub payment_type: String,
    pub party_type: Option<String>,
    pub party_id: Option<String>,
    pub payment_date: DateTime<Utc>,
    pub amount: BigDecimal,
    pub payment_method: Option<String>,
    pub reference_type: Option<String>,
    pub reference_id: Option<String>,
    pub status: String,
    pub remark: Option<String>,
    pub created_by: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePaymentRequest {
    pub payment_type: String,
    pub party_type: Option<String>,
    pub party_id: Option<String>,
    pub amount: BigDecimal,
    pub payment_method: Option<String>,
    pub reference_type: Option<String>,
    pub reference_id: Option<String>,
    pub remark: Option<String>,
}

pub async fn get_payments_handler(
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
        .unwrap_or(20);
    let payment_type = params.get("payment_type").cloned();

    let offset = (page - 1) * page_size;

    let mut query = String::from("SELECT id, payment_no, payment_type, party_type, party_id, payment_date, amount, payment_method, reference_type, reference_id, status, remark, created_by, created_at, updated_at FROM erp_payments WHERE 1=1");

    if payment_type.is_some() {
        query.push_str(" AND payment_type = $1");
    }

    query.push_str(" ORDER BY created_at DESC LIMIT $2 OFFSET $3");

    let payments = match sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            String,
            Option<String>,
            Option<Uuid>,
            DateTime<Utc>,
            BigDecimal,
            Option<String>,
            Option<String>,
            Option<Uuid>,
            String,
            Option<String>,
            Option<Uuid>,
            DateTime<Utc>,
            DateTime<Utc>,
        ),
    >(&query)
    .bind(payment_type)
    .bind(page_size)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records
            .into_iter()
            .map(|r| Payment {
                id: r.0.to_string(),
                payment_no: r.1,
                payment_type: r.2,
                party_type: r.3,
                party_id: r.4.map(|id| id.to_string()),
                payment_date: r.5,
                amount: r.6,
                payment_method: r.7,
                reference_type: r.8,
                reference_id: r.9.map(|id| id.to_string()),
                status: r.10,
                remark: r.11,
                created_by: r.12.map(|id| id.to_string()),
                created_at: r.13,
                updated_at: r.14,
            })
            .collect::<Vec<Payment>>(),
        Err(e) => {
            eprintln!("Error fetching payments: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(payments)))
}

pub async fn create_payment_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreatePaymentRequest>,
) -> impl IntoResponse {
    let payment_id = Uuid::new_v4();
    let payment_no = format!("PAY{}", Utc::now().format("%Y%m%d%H%M%S"));
    let party_id = req.party_id.clone().and_then(|s| Uuid::parse_str(&s).ok());
    let reference_id = req
        .reference_id
        .clone()
        .and_then(|s| Uuid::parse_str(&s).ok());

    match sqlx::query(
        "INSERT INTO erp_payments (id, payment_no, payment_type, party_type, party_id, amount, payment_method, reference_type, reference_id, remark) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)"
    )
    .bind(payment_id)
    .bind(&payment_no)
    .bind(&req.payment_type)
    .bind(&req.party_type)
    .bind(party_id)
    .bind(&req.amount)
    .bind(&req.payment_method)
    .bind(&req.reference_type)
    .bind(reference_id)
    .bind(&req.remark)
    .execute(&state.db)
    .await
    {
        Ok(_) => {
            let payment = Payment {
                id: payment_id.to_string(),
                payment_no,
                payment_type: req.payment_type,
                party_type: req.party_type,
                party_id: req.party_id,
                payment_date: Utc::now(),
                amount: req.amount,
                payment_method: req.payment_method,
                reference_type: req.reference_type,
                reference_id: req.reference_id,
                status: "pending".to_string(),
                remark: req.remark,
                created_by: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            (StatusCode::CREATED, Json(ApiResponse::success(payment)))
        }
        Err(e) => {
            tracing::error!("Create payment error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("创建收付款单失败".to_string())))
        }
    }
}
