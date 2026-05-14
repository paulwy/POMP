use crate::db::templates::{
    create_template, delete_template, get_template, get_template_by_code,
    get_template_categories, get_templates, init_default_templates, record_template_usage,
    update_template, toggle_favorite, get_favorite_templates,
    create_version, get_versions, get_version, rollback_to_version, delete_version,
    get_template_permissions, add_template_permission, remove_template_permission, check_user_access,
    CreateTemplate, Template, UpdateTemplate, TemplateVersion, TemplatePermission,
};
use crate::errors::{AppError, Result};
use crate::state::AppState;
use axum::extract::{Path, Query, State};
use axum::Json;
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct TemplatesQuery {
    pub category: Option<String>,
    pub template_type: Option<String>,
    pub is_active: Option<bool>,
    pub user_id: Option<Uuid>,
}

pub async fn get_templates_handler(
    State(state): State<Arc<AppState>>,
    Query(query): Query<TemplatesQuery>,
) -> Result<Json<Vec<serde_json::Value>>> {
    let templates = get_templates(
        &state.db,
        query.category.as_deref(),
        query.template_type.as_deref(),
        query.is_active,
        query.user_id,
    )
    .await?;
    Ok(Json(templates.into_iter().map(|t| serde_json::json!({
        "template": t.template,
        "usage_count": t.usage_count,
        "is_favorite": t.is_favorite
    })).collect()))
}

pub async fn get_template_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Template>> {
    let template = get_template(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Template not found".to_string()))?;
    Ok(Json(template))
}

pub async fn get_template_by_code_handler(
    State(state): State<Arc<AppState>>,
    Path(code): Path<String>,
) -> Result<Json<Template>> {
    let template = get_template_by_code(&state.db, &code)
        .await?
        .ok_or_else(|| AppError::NotFound("Template not found".to_string()))?;
    Ok(Json(template))
}

pub async fn create_template_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateTemplate>,
) -> Result<Json<Template>> {
    // 检查代码是否已存在
    if let Some(_) = get_template_by_code(&state.db, &req.code).await? {
        return Err(AppError::BadRequest("Template code already exists".to_string()));
    }
    
    let template = create_template(&state.db, req).await?;
    Ok(Json(template))
}

pub async fn update_template_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateTemplate>,
) -> Result<Json<Template>> {
    let template = update_template(&state.db, id, req).await?;
    Ok(Json(template))
}

pub async fn delete_template_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let deleted = delete_template(&state.db, id).await?;
    if !deleted {
        return Err(AppError::NotFound("Template not found or cannot be deleted".to_string()));
    }
    Ok(Json(serde_json::json!({"success": true})))
}

pub async fn get_template_categories_handler(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<String>>> {
    let categories = get_template_categories(&state.db).await?;
    Ok(Json(categories))
}

pub async fn record_template_usage_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RecordUsageRequest>,
) -> Result<Json<serde_json::Value>> {
    record_template_usage(
        &state.db,
        req.template_id,
        req.business_type.as_deref(),
        req.business_id,
        req.used_by,
    )
    .await?;
    Ok(Json(serde_json::json!({"success": true})))
}

pub async fn init_default_templates_handler(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>> {
    init_default_templates(&state.db).await?;
    Ok(Json(serde_json::json!({"success": true})))
}

#[derive(Debug, Deserialize)]
pub struct RecordUsageRequest {
    pub template_id: Uuid,
    pub business_type: Option<String>,
    pub business_id: Option<Uuid>,
    pub used_by: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct ToggleFavoriteRequest {
    pub template_id: Uuid,
    pub user_id: Uuid,
}

pub async fn toggle_favorite_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ToggleFavoriteRequest>,
) -> Result<Json<serde_json::Value>> {
    let is_favorite = toggle_favorite(&state.db, req.template_id, req.user_id).await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "is_favorite": is_favorite
    })))
}

#[derive(Debug, Deserialize)]
pub struct FavoritesQuery {
    pub user_id: Uuid,
    pub category: Option<String>,
}

pub async fn get_favorites_handler(
    State(state): State<Arc<AppState>>,
    Query(query): Query<FavoritesQuery>,
) -> Result<Json<Vec<Template>>> {
    let templates = get_favorite_templates(&state.db, query.user_id, query.category.as_deref()).await?;
    Ok(Json(templates))
}

#[derive(Debug, Deserialize)]
pub struct CreateVersionRequest {
    pub version_name: Option<String>,
    pub description: Option<String>,
    pub created_by: Option<Uuid>,
}

pub async fn create_version_handler(
    State(state): State<Arc<AppState>>,
    Path(template_id): Path<Uuid>,
    Json(req): Json<CreateVersionRequest>,
) -> Result<Json<TemplateVersion>> {
    let template = get_template(&state.db, template_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Template not found".to_string()))?;
    
    let version = create_version(
        &state.db,
        template_id,
        template.content,
        req.version_name,
        req.description,
        req.created_by,
    ).await?;
    
    Ok(Json(version))
}

pub async fn get_versions_handler(
    State(state): State<Arc<AppState>>,
    Path(template_id): Path<Uuid>,
) -> Result<Json<Vec<TemplateVersion>>> {
    let versions = get_versions(&state.db, template_id).await?;
    Ok(Json(versions))
}

pub async fn get_version_handler(
    State(state): State<Arc<AppState>>,
    Path((template_id, version_number)): Path<(Uuid, i32)>,
) -> Result<Json<TemplateVersion>> {
    let version = get_version(&state.db, template_id, version_number)
        .await?
        .ok_or_else(|| AppError::NotFound("Version not found".to_string()))?;
    Ok(Json(version))
}

pub async fn rollback_version_handler(
    State(state): State<Arc<AppState>>,
    Path((template_id, version_number)): Path<(Uuid, i32)>,
) -> Result<Json<Template>> {
    let template = rollback_to_version(&state.db, template_id, version_number).await?;
    Ok(Json(template))
}

pub async fn delete_version_handler(
    State(state): State<Arc<AppState>>,
    Path((template_id, version_number)): Path<(Uuid, i32)>,
) -> Result<Json<serde_json::Value>> {
    let deleted = delete_version(&state.db, template_id, version_number).await?;
    if !deleted {
        return Err(AppError::NotFound("Version not found".to_string()));
    }
    Ok(Json(serde_json::json!({"success": true})))
}

pub async fn get_permissions_handler(
    State(state): State<Arc<AppState>>,
    Path(template_id): Path<Uuid>,
) -> Result<Json<Vec<TemplatePermission>>> {
    let permissions = get_template_permissions(&state.db, template_id).await?;
    Ok(Json(permissions))
}

#[derive(Debug, Deserialize)]
pub struct AddPermissionRequest {
    pub permission_type: String,
    pub target_id: String,
    pub target_name: Option<String>,
    pub access_level: String,
}

pub async fn add_permission_handler(
    State(state): State<Arc<AppState>>,
    Path(template_id): Path<Uuid>,
    Json(req): Json<AddPermissionRequest>,
) -> Result<Json<TemplatePermission>> {
    let permission = add_template_permission(
        &state.db,
        template_id,
        &req.permission_type,
        &req.target_id,
        req.target_name.as_deref(),
        &req.access_level,
    ).await?;
    Ok(Json(permission))
}

pub async fn remove_permission_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let deleted = remove_template_permission(&state.db, id).await?;
    if !deleted {
        return Err(AppError::NotFound("Permission not found".to_string()));
    }
    Ok(Json(serde_json::json!({"success": true})))
}

#[derive(Debug, Deserialize)]
pub struct CheckAccessRequest {
    pub user_id: Uuid,
    pub required_level: String,
}

pub async fn check_access_handler(
    State(state): State<Arc<AppState>>,
    Path(template_id): Path<Uuid>,
    Json(req): Json<CheckAccessRequest>,
) -> Result<Json<serde_json::Value>> {
    let has_access = check_user_access(&state.db, template_id, req.user_id, &req.required_level).await?;
    Ok(Json(serde_json::json!({"has_access": has_access})))
}
