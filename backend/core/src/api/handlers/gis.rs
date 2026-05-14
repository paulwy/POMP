use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::db::gis::*;
use crate::db::gis_repo;
use crate::errors::{ApiResponse, AppError};
use crate::AppState;

#[derive(Deserialize)]
pub struct GisQueryParams {
    pub status: Option<String>,
    pub marker_type: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateLocationRequest {
    pub longitude: f64,
    pub latitude: f64,
}

#[derive(Deserialize)]
pub struct MarkerQueryParams {
    pub marker_type: Option<String>,
    pub layer: Option<String>,
    pub project_id: Option<String>,
    pub status: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

#[derive(Deserialize)]
pub struct NearbyQueryParams {
    pub longitude: f64,
    pub latitude: f64,
    pub radius: Option<f64>,
    pub marker_type: Option<String>,
    pub limit: Option<i32>,
}

pub async fn get_customers_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<GisQueryParams>,
) -> Result<Json<ApiResponse<Vec<GisCustomer>>>, AppError> {
    let customers = gis_repo::get_customers(
        &state.db,
        params.status.as_deref(),
        params.marker_type.as_deref(),
    )
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(customers)))
}

pub async fn get_customer_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<GisCustomer>>, AppError> {
    let customer = gis_repo::get_customer_by_id(&state.db, &id)
        .await
        .map_err(AppError::DatabaseError)?;

    match customer {
        Some(c) => Ok(Json(ApiResponse::success(c))),
        None => Err(AppError::NotFound("Customer not found".to_string())),
    }
}

pub async fn create_customer_handler(
    State(state): State<Arc<AppState>>,
    Json(data): Json<CreateGisCustomer>,
) -> Result<(StatusCode, Json<ApiResponse<GisCustomer>>), AppError> {
    let customer = gis_repo::create_customer(&state.db, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(customer))))
}

pub async fn update_customer_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(data): Json<UpdateGisCustomer>,
) -> Result<Json<ApiResponse<GisCustomer>>, AppError> {
    let customer = gis_repo::update_customer(&state.db, &id, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(customer)))
}

pub async fn delete_customer_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    gis_repo::delete_customer(&state.db, &id)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_projects_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<GisQueryParams>,
) -> Result<Json<ApiResponse<Vec<GisProject>>>, AppError> {
    let projects = gis_repo::get_projects(
        &state.db,
        params.status.as_deref(),
        params.marker_type.as_deref(),
    )
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(projects)))
}

pub async fn get_project_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<GisProject>>, AppError> {
    let project = gis_repo::get_project_by_id(&state.db, &id)
        .await
        .map_err(AppError::DatabaseError)?;

    match project {
        Some(p) => Ok(Json(ApiResponse::success(p))),
        None => Err(AppError::NotFound("Project not found".to_string())),
    }
}

pub async fn create_project_handler(
    State(state): State<Arc<AppState>>,
    Json(data): Json<CreateGisProject>,
) -> Result<(StatusCode, Json<ApiResponse<GisProject>>), AppError> {
    let project = gis_repo::create_project(&state.db, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(project))))
}

pub async fn update_project_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(data): Json<UpdateGisProject>,
) -> Result<Json<ApiResponse<GisProject>>, AppError> {
    let project = gis_repo::update_project(&state.db, &id, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(project)))
}

pub async fn delete_project_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    gis_repo::delete_project(&state.db, &id)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_warehouses_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<GisQueryParams>,
) -> Result<Json<ApiResponse<Vec<GisWarehouse>>>, AppError> {
    let warehouses = gis_repo::get_warehouses(
        &state.db,
        params.status.as_deref(),
        params.marker_type.as_deref(),
    )
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(warehouses)))
}

pub async fn get_warehouse_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<GisWarehouse>>, AppError> {
    let warehouse = gis_repo::get_warehouse_by_id(&state.db, &id)
        .await
        .map_err(AppError::DatabaseError)?;

    match warehouse {
        Some(w) => Ok(Json(ApiResponse::success(w))),
        None => Err(AppError::NotFound("Warehouse not found".to_string())),
    }
}

pub async fn create_warehouse_handler(
    State(state): State<Arc<AppState>>,
    Json(data): Json<CreateGisWarehouse>,
) -> Result<(StatusCode, Json<ApiResponse<GisWarehouse>>), AppError> {
    let warehouse = gis_repo::create_warehouse(&state.db, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(warehouse))))
}

pub async fn update_warehouse_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(data): Json<UpdateGisWarehouse>,
) -> Result<Json<ApiResponse<GisWarehouse>>, AppError> {
    let warehouse = gis_repo::update_warehouse(&state.db, &id, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(warehouse)))
}

pub async fn delete_warehouse_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    gis_repo::delete_warehouse(&state.db, &id)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_personnel_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<GisQueryParams>,
) -> Result<Json<ApiResponse<Vec<GisPersonnel>>>, AppError> {
    let personnel = gis_repo::get_personnel(
        &state.db,
        params.status.as_deref(),
        params.marker_type.as_deref(),
    )
    .await
    .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(personnel)))
}

pub async fn get_personnel_by_id_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<GisPersonnel>>, AppError> {
    let personnel = gis_repo::get_personnel_by_id(&state.db, &id)
        .await
        .map_err(AppError::DatabaseError)?;

    match personnel {
        Some(p) => Ok(Json(ApiResponse::success(p))),
        None => Err(AppError::NotFound("Personnel not found".to_string())),
    }
}

pub async fn create_personnel_handler(
    State(state): State<Arc<AppState>>,
    Json(data): Json<CreateGisPersonnel>,
) -> Result<(StatusCode, Json<ApiResponse<GisPersonnel>>), AppError> {
    let personnel = gis_repo::create_personnel(&state.db, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(personnel))))
}

pub async fn update_personnel_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(data): Json<UpdateGisPersonnel>,
) -> Result<Json<ApiResponse<GisPersonnel>>, AppError> {
    let personnel = gis_repo::update_personnel(&state.db, &id, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(personnel)))
}

pub async fn delete_personnel_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    gis_repo::delete_personnel(&state.db, &id)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn update_personnel_location_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(data): Json<UpdateLocationRequest>,
) -> Result<Json<ApiResponse<GisPersonnel>>, AppError> {
    let personnel =
        gis_repo::update_personnel_location(&state.db, &id, data.longitude, data.latitude)
            .await
            .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(personnel)))
}

pub async fn create_marker_handler(
    State(state): State<Arc<AppState>>,
    Json(data): Json<CreateGisMarker>,
) -> Result<(StatusCode, Json<ApiResponse<GisMarker>>), AppError> {
    let marker = gis_repo::create_marker(&state.db, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(marker))))
}

pub async fn get_marker_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<GisMarker>>, AppError> {
    let marker_id = Uuid::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid marker ID".to_string()))?;
    
    let marker = gis_repo::get_marker(&state.db, marker_id)
        .await
        .map_err(AppError::DatabaseError)?;

    match marker {
        Some(m) => Ok(Json(ApiResponse::success(m))),
        None => Err(AppError::NotFound("Marker not found".to_string())),
    }
}

pub async fn get_markers_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<MarkerQueryParams>,
) -> Result<Json<ApiResponse<Vec<GisMarker>>>, AppError> {
    let search_params = MarkerSearchParams {
        marker_type: params.marker_type,
        layer: params.layer,
        project_id: params.project_id,
        status: params.status,
        page: params.page,
        page_size: params.page_size,
        bounds: None,
    };
    
    let markers = gis_repo::get_markers(&state.db, search_params)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(markers)))
}

pub async fn update_marker_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(data): Json<UpdateGisMarker>,
) -> Result<Json<ApiResponse<GisMarker>>, AppError> {
    let marker_id = Uuid::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid marker ID".to_string()))?;
    
    let marker = gis_repo::update_marker(&state.db, marker_id, data)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(marker)))
}

pub async fn delete_marker_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let marker_id = Uuid::parse_str(&id)
        .map_err(|_| AppError::BadRequest("Invalid marker ID".to_string()))?;
    
    gis_repo::delete_marker(&state.db, marker_id)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn search_nearby_markers_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<NearbyQueryParams>,
) -> Result<Json<ApiResponse<Vec<MarkerWithDistance>>>, AppError> {
    let search_params = NearbySearchParams {
        longitude: params.longitude,
        latitude: params.latitude,
        radius: params.radius,
        marker_type: params.marker_type,
        limit: params.limit,
    };
    
    let markers = gis_repo::search_nearby_markers(&state.db, search_params)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(markers)))
}

pub async fn get_marker_types_handler(
    State(state): State<Arc<AppState>>,
) -> Result<Json<ApiResponse<Vec<String>>>, AppError> {
    let types = gis_repo::get_marker_types(&state.db)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(types)))
}

pub async fn get_layers_handler(
    State(state): State<Arc<AppState>>,
) -> Result<Json<ApiResponse<Vec<String>>>, AppError> {
    let layers = gis_repo::get_layers(&state.db)
        .await
        .map_err(AppError::DatabaseError)?;

    Ok(Json(ApiResponse::success(layers)))
}