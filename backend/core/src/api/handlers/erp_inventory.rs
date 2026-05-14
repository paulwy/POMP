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

// ========== 产品 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: String,
    pub product_code: String,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub unit: Option<String>,
    pub spec: Option<String>,
    pub purchase_price: BigDecimal,
    pub sale_price: BigDecimal,
    pub min_stock: BigDecimal,
    pub max_stock: Option<BigDecimal>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProductRequest {
    pub product_code: String,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub unit: Option<String>,
    pub spec: Option<String>,
    pub purchase_price: Option<BigDecimal>,
    pub sale_price: Option<BigDecimal>,
    pub min_stock: Option<BigDecimal>,
    pub max_stock: Option<BigDecimal>,
}

pub async fn get_products_handler(
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
    let category = params.get("category").cloned();

    let offset = (page - 1) * page_size;

    let mut query = String::from("SELECT id, product_code, name, description, category, unit, spec, purchase_price, sale_price, min_stock, max_stock, is_active, created_at, updated_at FROM erp_products WHERE is_active = true");

    if category.is_some() {
        query.push_str(" AND category = $1");
    }

    query.push_str(" ORDER BY created_at DESC LIMIT $2 OFFSET $3");

    let products = match sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            String,
            Option<String>,
            Option<String>,
            Option<String>,
            Option<String>,
            BigDecimal,
            BigDecimal,
            BigDecimal,
            Option<BigDecimal>,
            bool,
            DateTime<Utc>,
            DateTime<Utc>,
        ),
    >(&query)
    .bind(category)
    .bind(page_size)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records
            .into_iter()
            .map(|r| Product {
                id: r.0.to_string(),
                product_code: r.1,
                name: r.2,
                description: r.3,
                category: r.4,
                unit: r.5,
                spec: r.6,
                purchase_price: r.7,
                sale_price: r.8,
                min_stock: r.9,
                max_stock: r.10,
                is_active: r.11,
                created_at: r.12,
                updated_at: r.13,
            })
            .collect::<Vec<Product>>(),
        Err(e) => {
            eprintln!("Error fetching products: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(products)))
}

pub async fn get_product_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let product_id = match Uuid::parse_str(&id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::error("无效的产品ID".to_string())),
            )
        }
    };

    match sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<String>, Option<String>, Option<String>, BigDecimal, BigDecimal, BigDecimal, Option<BigDecimal>, bool, DateTime<Utc>, DateTime<Utc>)>(
        "SELECT id, product_code, name, description, category, unit, spec, purchase_price, sale_price, min_stock, max_stock, is_active, created_at, updated_at FROM erp_products WHERE id = $1"
    )
    .bind(product_id)
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some(r)) => {
            let product = Product {
                id: r.0.to_string(),
                product_code: r.1,
                name: r.2,
                description: r.3,
                category: r.4,
                unit: r.5,
                spec: r.6,
                purchase_price: r.7,
                sale_price: r.8,
                min_stock: r.9,
                max_stock: r.10,
                is_active: r.11,
                created_at: r.12,
                updated_at: r.13,
            };
            (StatusCode::OK, Json(ApiResponse::success(product)))
        },
        Ok(None) => (StatusCode::NOT_FOUND, Json(ApiResponse::error("产品不存在".to_string()))),
        Err(e) => {
            tracing::error!("Get product error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("获取产品失败".to_string())))
        }
    }
}

pub async fn create_product_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateProductRequest>,
) -> impl IntoResponse {
    let product_id = Uuid::new_v4();
    let purchase_price = req.purchase_price.unwrap_or_else(|| BigDecimal::from(0));
    let sale_price = req.sale_price.unwrap_or_else(|| BigDecimal::from(0));
    let min_stock = req.min_stock.unwrap_or_else(|| BigDecimal::from(0));

    match sqlx::query(
        "INSERT INTO erp_products (id, product_code, name, description, category, unit, spec, purchase_price, sale_price, min_stock, max_stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)"
    )
    .bind(product_id)
    .bind(&req.product_code)
    .bind(&req.name)
    .bind(&req.description)
    .bind(&req.category)
    .bind(&req.unit)
    .bind(&req.spec)
    .bind(&purchase_price)
    .bind(&sale_price)
    .bind(&min_stock)
    .bind(&req.max_stock)
    .execute(&state.db)
    .await
    {
        Ok(_) => {
            let product = Product {
                id: product_id.to_string(),
                product_code: req.product_code,
                name: req.name,
                description: req.description,
                category: req.category,
                unit: req.unit,
                spec: req.spec,
                purchase_price,
                sale_price,
                min_stock,
                max_stock: req.max_stock,
                is_active: true,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            (StatusCode::CREATED, Json(ApiResponse::success(product)))
        }
        Err(e) => {
            tracing::error!("Create product error: {}", e);
            let error_msg = if e.to_string().contains("duplicate key") {
                "产品编码已存在".to_string()
            } else {
                "创建产品失败".to_string()
            };
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(error_msg)))
        }
    }
}

// ========== 仓库 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Warehouse {
    pub id: String,
    pub warehouse_code: String,
    pub name: String,
    pub location: Option<String>,
    pub manager_id: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWarehouseRequest {
    pub warehouse_code: String,
    pub name: String,
    pub location: Option<String>,
    pub manager_id: Option<String>,
}

pub async fn get_warehouses_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let warehouses = match sqlx::query_as::<_, (Uuid, String, String, Option<String>, Option<Uuid>, bool, DateTime<Utc>, DateTime<Utc>)>(
        "SELECT id, warehouse_code, name, location, manager_id, is_active, created_at, updated_at FROM erp_warehouses WHERE is_active = true ORDER BY created_at"
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records.into_iter().map(|r| Warehouse {
            id: r.0.to_string(),
            warehouse_code: r.1,
            name: r.2,
            location: r.3,
            manager_id: r.4.map(|id| id.to_string()),
            is_active: r.5,
            created_at: r.6,
            updated_at: r.7,
        }).collect::<Vec<Warehouse>>(),
        Err(e) => {
            eprintln!("Error fetching warehouses: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(warehouses)))
}

pub async fn create_warehouse_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateWarehouseRequest>,
) -> impl IntoResponse {
    let warehouse_id = Uuid::new_v4();
    let manager_id = req
        .manager_id
        .clone()
        .and_then(|s| Uuid::parse_str(&s).ok());

    match sqlx::query(
        "INSERT INTO erp_warehouses (id, warehouse_code, name, location, manager_id) VALUES ($1, $2, $3, $4, $5)"
    )
    .bind(warehouse_id)
    .bind(&req.warehouse_code)
    .bind(&req.name)
    .bind(&req.location)
    .bind(manager_id)
    .execute(&state.db)
    .await
    {
        Ok(_) => {
            let warehouse = Warehouse {
                id: warehouse_id.to_string(),
                warehouse_code: req.warehouse_code,
                name: req.name,
                location: req.location,
                manager_id: req.manager_id,
                is_active: true,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            (StatusCode::CREATED, Json(ApiResponse::success(warehouse)))
        }
        Err(e) => {
            tracing::error!("Create warehouse error: {}", e);
            let error_msg = if e.to_string().contains("duplicate key") {
                "仓库编码已存在".to_string()
            } else {
                "创建仓库失败".to_string()
            };
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(error_msg)))
        }
    }
}

// ========== 库存 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Inventory {
    pub id: String,
    pub product_id: String,
    pub product_name: Option<String>,
    pub product_code: Option<String>,
    pub warehouse_id: String,
    pub warehouse_name: Option<String>,
    pub quantity: BigDecimal,
    pub available_quantity: BigDecimal,
    pub reserved_quantity: BigDecimal,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn get_inventory_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let warehouse_id = params
        .get("warehouse_id")
        .and_then(|s| Uuid::parse_str(s).ok());
    let product_id = params
        .get("product_id")
        .and_then(|s| Uuid::parse_str(s).ok());

    let mut query = String::from("SELECT i.id, i.product_id, i.warehouse_id, i.quantity, i.available_quantity, i.reserved_quantity, i.created_at, i.updated_at FROM erp_inventory i WHERE 1=1");
    let mut args = Vec::new();

    if let Some(wh_id) = warehouse_id {
        query.push_str(" AND i.warehouse_id = $1");
        args.push(wh_id);
    }

    if let Some(p_id) = product_id {
        query.push_str(" AND i.product_id = $2");
        args.push(p_id);
    }

    query.push_str(" ORDER BY i.created_at DESC");

    let inventory = match sqlx::query_as::<
        _,
        (
            Uuid,
            Uuid,
            Uuid,
            BigDecimal,
            BigDecimal,
            BigDecimal,
            DateTime<Utc>,
            DateTime<Utc>,
        ),
    >(&query)
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => {
            let mut result = Vec::new();
            for r in records {
                let product_name =
                    sqlx::query_scalar::<_, String>("SELECT name FROM erp_products WHERE id = $1")
                        .bind(r.1)
                        .fetch_optional(&state.db)
                        .await
                        .ok()
                        .flatten();

                let product_code = sqlx::query_scalar::<_, String>(
                    "SELECT product_code FROM erp_products WHERE id = $1",
                )
                .bind(r.1)
                .fetch_optional(&state.db)
                .await
                .ok()
                .flatten();

                let warehouse_name = sqlx::query_scalar::<_, String>(
                    "SELECT name FROM erp_warehouses WHERE id = $1",
                )
                .bind(r.2)
                .fetch_optional(&state.db)
                .await
                .ok()
                .flatten();

                result.push(Inventory {
                    id: r.0.to_string(),
                    product_id: r.1.to_string(),
                    product_name,
                    product_code,
                    warehouse_id: r.2.to_string(),
                    warehouse_name,
                    quantity: r.3,
                    available_quantity: r.4,
                    reserved_quantity: r.5,
                    created_at: r.6,
                    updated_at: r.7,
                });
            }
            result
        }
        Err(e) => {
            eprintln!("Error fetching inventory: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(inventory)))
}

// ========== 库存变动记录 ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryLog {
    pub id: String,
    pub product_id: String,
    pub product_name: Option<String>,
    pub warehouse_id: String,
    pub warehouse_name: Option<String>,
    pub change_type: String,
    pub change_quantity: BigDecimal,
    pub before_quantity: BigDecimal,
    pub after_quantity: BigDecimal,
    pub reference_type: Option<String>,
    pub reference_id: Option<String>,
    pub remark: Option<String>,
    pub created_by: Option<String>,
    pub created_at: DateTime<Utc>,
}

pub async fn get_inventory_logs_handler(
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

    let logs = match sqlx::query_as::<_, (Uuid, Uuid, Uuid, String, BigDecimal, BigDecimal, BigDecimal, Option<String>, Option<Uuid>, Option<String>, Option<Uuid>, DateTime<Utc>)>(
        "SELECT id, product_id, warehouse_id, change_type, change_quantity, before_quantity, after_quantity, reference_type, reference_id, remark, created_by, created_at FROM erp_inventory_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(page_size)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => {
            let mut result = Vec::new();
            for r in records {
                let product_name = sqlx::query_scalar::<_, String>("SELECT name FROM erp_products WHERE id = $1")
                    .bind(r.1)
                    .fetch_optional(&state.db)
                    .await
                    .ok()
                    .flatten();

                let warehouse_name = sqlx::query_scalar::<_, String>("SELECT name FROM erp_warehouses WHERE id = $1")
                    .bind(r.2)
                    .fetch_optional(&state.db)
                    .await
                    .ok()
                    .flatten();

                result.push(InventoryLog {
                    id: r.0.to_string(),
                    product_id: r.1.to_string(),
                    product_name,
                    warehouse_id: r.2.to_string(),
                    warehouse_name,
                    change_type: r.3,
                    change_quantity: r.4,
                    before_quantity: r.5,
                    after_quantity: r.6,
                    reference_type: r.7,
                    reference_id: r.8.map(|id| id.to_string()),
                    remark: r.9,
                    created_by: r.10.map(|id| id.to_string()),
                    created_at: r.11,
                });
            }
            result
        },
        Err(e) => {
            eprintln!("Error fetching inventory logs: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, Json(ApiResponse::success(logs)))
}
