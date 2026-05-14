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

// ========== 客户 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Customer {
    pub id: String,
    pub customer_code: String,
    pub name: String,
    pub contact_person: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub credit_limit: Option<BigDecimal>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCustomerRequest {
    pub customer_code: String,
    pub name: String,
    pub contact_person: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub credit_limit: Option<BigDecimal>,
}

pub async fn get_customers_handler(
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

    let offset = (page - 1) * page_size;

    let customers = match sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>, Option<String>, Option<String>, Option<BigDecimal>, bool, DateTime<Utc>, DateTime<Utc>)>(
        "SELECT id, customer_code, name, contact_person, phone, email, address, credit_limit, is_active, created_at, updated_at FROM erp_customers WHERE is_active = true ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(page_size)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records.into_iter().map(|r| Customer {
            id: r.0.to_string(),
            customer_code: r.1,
            name: r.2,
            contact_person: r.3,
            phone: r.4,
            email: r.5,
            address: r.6,
            credit_limit: r.7,
            is_active: r.8,
            created_at: r.9,
            updated_at: r.10,
        }).collect::<Vec<Customer>>(),
        Err(e) => {
            eprintln!("Error fetching customers: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(customers)))
}

pub async fn get_customer_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let customer_id = match Uuid::parse_str(&id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的客户ID".to_string())),
            )
        }
    };

    match sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>, Option<String>, Option<String>, Option<BigDecimal>, bool, DateTime<Utc>, DateTime<Utc>)>(
        "SELECT id, customer_code, name, contact_person, phone, email, address, credit_limit, is_active, created_at, updated_at FROM erp_customers WHERE id = $1"
    )
    .bind(customer_id)
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some(r)) => {
            let customer = Customer {
                id: r.0.to_string(),
                customer_code: r.1,
                name: r.2,
                contact_person: r.3,
                phone: r.4,
                email: r.5,
                address: r.6,
                credit_limit: r.7,
                is_active: r.8,
                created_at: r.9,
                updated_at: r.10,
            };
            (StatusCode::OK, Json(ApiResponse::success(customer)))
        },
        Ok(None) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("客户不存在".to_string()))),
        Err(e) => {
            tracing::error!("Get customer error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("获取客户失败".to_string())))
        }
    }
}

pub async fn create_customer_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateCustomerRequest>,
) -> impl IntoResponse {
    let customer_id = Uuid::new_v4();

    match sqlx::query(
        "INSERT INTO erp_customers (id, customer_code, name, contact_person, phone, email, address, credit_limit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
    )
    .bind(customer_id)
    .bind(&req.customer_code)
    .bind(&req.name)
    .bind(&req.contact_person)
    .bind(&req.phone)
    .bind(&req.email)
    .bind(&req.address)
    .bind(&req.credit_limit)
    .execute(&state.db)
    .await
    {
        Ok(_) => {
            let customer = Customer {
                id: customer_id.to_string(),
                customer_code: req.customer_code,
                name: req.name,
                contact_person: req.contact_person,
                phone: req.phone,
                email: req.email,
                address: req.address,
                credit_limit: req.credit_limit,
                is_active: true,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            (StatusCode::CREATED, Json(ApiResponse::success(customer)))
        }
        Err(e) => {
            tracing::error!("Create customer error: {}", e);
            let error_msg = if e.to_string().contains("duplicate key") {
                "客户编码已存在".to_string()
            } else {
                "创建客户失败".to_string()
            };
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(error_msg)))
        }
    }
}

// ========== 销售订单 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesOrder {
    pub id: String,
    pub order_no: String,
    pub customer_id: Option<String>,
    pub customer_name: Option<String>,
    pub warehouse_id: Option<String>,
    pub order_date: DateTime<Utc>,
    pub delivery_date: Option<DateTime<Utc>>,
    pub status: String,
    pub total_amount: BigDecimal,
    pub tax_amount: BigDecimal,
    pub discount: BigDecimal,
    pub remark: Option<String>,
    pub created_by: Option<String>,
    pub approved_by: Option<String>,
    pub approved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSalesOrderRequest {
    pub customer_id: Option<String>,
    pub warehouse_id: Option<String>,
    pub delivery_date: Option<String>,
    pub remark: Option<String>,
    pub items: Vec<SalesOrderItemRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesOrderItemRequest {
    pub product_id: String,
    pub quantity: BigDecimal,
    pub unit_price: BigDecimal,
    pub remark: Option<String>,
}

pub async fn get_sales_orders_handler(
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

    let mut query = String::from("SELECT id, order_no, customer_id, warehouse_id, order_date, delivery_date, status, total_amount, tax_amount, discount, remark, created_by, approved_by, approved_at, created_at, updated_at FROM erp_sales_orders WHERE 1=1");

    if status.is_some() {
        query.push_str(" AND status = $1");
    }

    query.push_str(" ORDER BY created_at DESC LIMIT $2 OFFSET $3");

    let orders = match sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            Option<Uuid>,
            Option<Uuid>,
            DateTime<Utc>,
            Option<DateTime<Utc>>,
            String,
            BigDecimal,
            BigDecimal,
            BigDecimal,
            Option<String>,
            Option<Uuid>,
            Option<Uuid>,
            Option<DateTime<Utc>>,
            DateTime<Utc>,
            DateTime<Utc>,
        ),
    >(&query)
    .bind(status)
    .bind(page_size)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => {
            let mut result = Vec::new();
            for r in records {
                let customer_name = if let Some(customer_id) = r.2 {
                    sqlx::query_scalar::<_, String>("SELECT name FROM erp_customers WHERE id = $1")
                        .bind(customer_id)
                        .fetch_optional(&state.db)
                        .await
                        .ok()
                        .flatten()
                } else {
                    None
                };

                result.push(SalesOrder {
                    id: r.0.to_string(),
                    order_no: r.1,
                    customer_id: r.2.map(|id| id.to_string()),
                    customer_name,
                    warehouse_id: r.3.map(|id| id.to_string()),
                    order_date: r.4,
                    delivery_date: r.5,
                    status: r.6,
                    total_amount: r.7,
                    tax_amount: r.8,
                    discount: r.9,
                    remark: r.10,
                    created_by: r.11.map(|id| id.to_string()),
                    approved_by: r.12.map(|id| id.to_string()),
                    approved_at: r.13,
                    created_at: r.14,
                    updated_at: r.15,
                });
            }
            result
        }
        Err(e) => {
            eprintln!("Error fetching sales orders: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(orders)))
}

pub async fn create_sales_order_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateSalesOrderRequest>,
) -> impl IntoResponse {
    let order_id = Uuid::new_v4();
    let order_no = format!("SO{}", Utc::now().format("%Y%m%d%H%M%S"));
    let customer_id = req
        .customer_id
        .clone()
        .and_then(|s| Uuid::parse_str(&s).ok());
    let warehouse_id = req
        .warehouse_id
        .clone()
        .and_then(|s| Uuid::parse_str(&s).ok());
    let delivery_date = req.delivery_date.and_then(|s| {
        DateTime::parse_from_rfc3339(&s)
            .ok()
            .map(|d| d.with_timezone(&Utc))
    });

    let mut total_amount = BigDecimal::from(0);

    for item in &req.items {
        total_amount += &(&item.quantity * &item.unit_price);
    }

    let mut tx = match state.db.begin().await {
        Ok(tx) => tx,
        Err(e) => {
            tracing::error!("Begin transaction error: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error("创建销售订单失败".to_string())),
            );
        }
    };

    match sqlx::query(
        "INSERT INTO erp_sales_orders (id, order_no, customer_id, warehouse_id, delivery_date, total_amount, remark) VALUES ($1, $2, $3, $4, $5, $6, $7)"
    )
    .bind(order_id)
    .bind(&order_no)
    .bind(customer_id)
    .bind(warehouse_id)
    .bind(delivery_date)
    .bind(&total_amount)
    .bind(&req.remark)
    .execute(&mut *tx)
    .await
    {
        Ok(_) => {
            for item in req.items {
                let product_id = match Uuid::parse_str(&item.product_id) {
                    Ok(id) => id,
                    Err(_) => {
                        let _ = tx.rollback().await;
                        return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("无效的产品ID".to_string())));
                    }
                };

                let item_id = Uuid::new_v4();
                let amount = &item.quantity * &item.unit_price;

                if let Err(e) = sqlx::query(
                    "INSERT INTO erp_sales_order_items (id, sales_order_id, product_id, quantity, unit_price, amount, remark) VALUES ($1, $2, $3, $4, $5, $6, $7)"
                )
                .bind(item_id)
                .bind(order_id)
                .bind(product_id)
                .bind(&item.quantity)
                .bind(&item.unit_price)
                .bind(&amount)
                .bind(&item.remark)
                .execute(&mut *tx)
                .await
                {
                    tracing::error!("Insert sales order item error: {}", e);
                    let _ = tx.rollback().await;
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("创建销售订单明细失败".to_string())));
                }
            }

            if let Err(e) = tx.commit().await {
                tracing::error!("Commit transaction error: {}", e);
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("创建销售订单失败".to_string())));
            }

            let order = SalesOrder {
                id: order_id.to_string(),
                order_no,
                customer_id: req.customer_id,
                customer_name: None,
                warehouse_id: req.warehouse_id,
                order_date: Utc::now(),
                delivery_date,
                status: "draft".to_string(),
                total_amount,
                tax_amount: BigDecimal::from(0),
                discount: BigDecimal::from(0),
                remark: req.remark,
                created_by: None,
                approved_by: None,
                approved_at: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            (StatusCode::CREATED, Json(ApiResponse::success(order)))
        }
        Err(e) => {
            let _ = tx.rollback().await;
            tracing::error!("Create sales order error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("创建销售订单失败".to_string())))
        }
    }
}

// ========== 销售出库单 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesDelivery {
    pub id: String,
    pub delivery_no: String,
    pub sales_order_id: Option<String>,
    pub customer_id: Option<String>,
    pub warehouse_id: Option<String>,
    pub delivery_date: DateTime<Utc>,
    pub status: String,
    pub total_amount: BigDecimal,
    pub remark: Option<String>,
    pub created_by: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn get_sales_deliveries_handler(
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

    let offset = (page - 1) * page_size;

    let deliveries = match sqlx::query_as::<_, (Uuid, String, Option<Uuid>, Option<Uuid>, Option<Uuid>, DateTime<Utc>, String, BigDecimal, Option<String>, Option<Uuid>, DateTime<Utc>, DateTime<Utc>)>(
        "SELECT id, delivery_no, sales_order_id, customer_id, warehouse_id, delivery_date, status, total_amount, remark, created_by, created_at, updated_at FROM erp_sales_deliveries ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(page_size)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records.into_iter().map(|r| SalesDelivery {
            id: r.0.to_string(),
            delivery_no: r.1,
            sales_order_id: r.2.map(|id| id.to_string()),
            customer_id: r.3.map(|id| id.to_string()),
            warehouse_id: r.4.map(|id| id.to_string()),
            delivery_date: r.5,
            status: r.6,
            total_amount: r.7,
            remark: r.8,
            created_by: r.9.map(|id| id.to_string()),
            created_at: r.10,
            updated_at: r.11,
        }).collect::<Vec<SalesDelivery>>(),
        Err(e) => {
            eprintln!("Error fetching sales deliveries: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(deliveries)))
}
