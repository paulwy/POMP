use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use bigdecimal::{BigDecimal, FromPrimitive, ToPrimitive};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::errors::ApiResponse;
use crate::AppState;
use crate::db::field::{AudioEvidence, CreateFieldRecord, FieldRecord, PhotoEvidence};
use crate::db::field_repo;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldRecordResponse {
    pub id: String,
    pub user_id: String,
    pub department_id: Option<String>,
    pub record_type: String,
    pub task_title: Option<String>,
    pub task_description: Option<String>,
    pub latitude: f64,
    pub longitude: f64,
    pub location_name: Option<String>,
    pub address: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhotoEvidenceResponse {
    pub id: String,
    pub record_id: String,
    pub file_name: String,
    pub file_path: String,
    pub file_size: Option<i64>,
    pub content_type: Option<String>,
    pub description: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioEvidenceResponse {
    pub id: String,
    pub record_id: String,
    pub file_name: String,
    pub file_path: String,
    pub file_size: Option<i64>,
    pub duration: Option<i64>,
    pub content_type: Option<String>,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateRecordRequest {
    pub record_type: String,
    pub department_id: Option<String>,
    pub task_title: Option<String>,
    pub task_description: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub location_name: Option<String>,
    pub address: Option<String>,
}

pub async fn create_record(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateRecordRequest>,
) -> impl IntoResponse {
    let user_id = "a0049509-3f20-46ad-adc0-416b3ba1c0a0".to_string();

    let create_record = CreateFieldRecord {
        user_id,
        department_id: req.department_id,
        record_type: req.record_type,
        task_title: req.task_title,
        task_description: req.task_description,
        latitude: req.latitude,
        longitude: req.longitude,
        location_name: req.location_name,
        address: req.address,
    };

    match field_repo::create_field_record(&state.db, create_record).await {
        Ok(record) => {
            let response_record = map_record_to_response(record);
            (StatusCode::CREATED, Json(ApiResponse::success(response_record)))
        }
        Err(e) => {
            tracing::error!("Create field record error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("创建外勤记录失败".to_string())))
        }
    }
}

pub async fn get_user_records(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let page = params
        .get("page")
        .and_then(|p| p.parse::<i32>().ok());
    let page_size = params
        .get("page_size")
        .and_then(|p| p.parse::<i32>().ok());
    let status = params.get("status").map(|s| s.to_string());

    let user_id = Uuid::parse_str("a0049509-3f20-46ad-adc0-416b3ba1c0a0").unwrap();

    match field_repo::get_user_field_records(&state.db, user_id, status, page, page_size).await {
        Ok(records) => {
            let response_records: Vec<FieldRecordResponse> = records.into_iter().map(map_record_to_response).collect();
            (
                StatusCode::OK,
                Json(ApiResponse::success(serde_json::json!({
                    "data": response_records,
                    "total": response_records.len(),
                    "page": page.unwrap_or(1),
                    "page_size": page_size.unwrap_or(20),
                }))),
            )
        }
        Err(e) => {
            tracing::error!("Get user field records error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::success(serde_json::json!({
                    "data": [],
                    "total": 0,
                    "page": page.unwrap_or(1),
                    "page_size": page_size.unwrap_or(20),
                }))),
            )
        }
    }
}

pub async fn get_all_records(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let page = params
        .get("page")
        .and_then(|p| p.parse::<i32>().ok());
    let page_size = params
        .get("page_size")
        .and_then(|p| p.parse::<i32>().ok());
    let status = params.get("status").map(|s| s.to_string());

    match field_repo::get_all_field_records(&state.db, status, page, page_size).await {
        Ok(records) => {
            let response_records: Vec<FieldRecordResponse> = records.into_iter().map(map_record_to_response).collect();
            (
                StatusCode::OK,
                Json(ApiResponse::success(serde_json::json!({
                    "data": response_records,
                    "total": response_records.len(),
                    "page": page.unwrap_or(1),
                    "page_size": page_size.unwrap_or(20),
                }))),
            )
        }
        Err(e) => {
            tracing::error!("Get all field records error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::success(serde_json::json!({
                    "data": [],
                    "total": 0,
                    "page": page.unwrap_or(1),
                    "page_size": page_size.unwrap_or(20),
                }))),
            )
        }
    }
}

pub async fn get_record(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("无效的记录ID".to_string()))),
    };

    match field_repo::get_field_record(&state.db, uuid).await {
        Ok(record) => {
            let response_record = map_record_to_response(record);
            (StatusCode::OK, Json(ApiResponse::success(response_record)))
        }
        Err(e) => {
            tracing::error!("Get field record error: {}", e);
            (StatusCode::NOT_FOUND, Json(ApiResponse::error("外勤记录不存在".to_string())))
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateRecordRequest {
    pub status: Option<String>,
    pub task_title: Option<String>,
    pub task_description: Option<String>,
    pub location_name: Option<String>,
    pub address: Option<String>,
}

pub async fn update_record(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<UpdateRecordRequest>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("无效的记录ID".to_string()))),
    };

    let update = crate::db::field::UpdateFieldRecord {
        status: req.status,
        task_title: req.task_title,
        task_description: req.task_description,
        location_name: req.location_name,
        address: req.address,
    };

    match field_repo::update_field_record(&state.db, uuid, update).await {
        Ok(record) => {
            let response_record = map_record_to_response(record);
            (StatusCode::OK, Json(ApiResponse::success(response_record)))
        }
        Err(e) => {
            tracing::error!("Update field record error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("更新外勤记录失败".to_string())))
        }
    }
}

pub async fn delete_record(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let uuid = match Uuid::parse_str(&id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("无效的记录ID".to_string()))),
    };

    match field_repo::delete_field_record(&state.db, uuid).await {
        Ok(_) => {
            (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({"message": "外勤记录已删除"}))))
        }
        Err(e) => {
            tracing::error!("Delete field record error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("删除外勤记录失败".to_string())))
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct UploadPhotoRequest {
    pub file_name: String,
    pub file_size: Option<i64>,
    pub content_type: Option<String>,
    pub description: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

pub async fn upload_photo(
    State(state): State<Arc<AppState>>,
    Path(record_id): Path<String>,
    Json(req): Json<UploadPhotoRequest>,
) -> impl IntoResponse {
    let record_uuid = match Uuid::parse_str(&record_id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("无效的记录ID".to_string()))),
    };

    let file_path = format!("/uploads/photos/{}/{}_{}", record_id, Uuid::new_v4(), req.file_name);

    let latitude = req.latitude.and_then(|v| BigDecimal::from_f64(v));
    let longitude = req.longitude.and_then(|v| BigDecimal::from_f64(v));

    match field_repo::add_photo_evidence(
        &state.db,
        record_uuid,
        req.file_name,
        file_path,
        req.file_size,
        req.content_type,
        req.description,
        latitude,
        longitude,
    ).await {
        Ok(photo) => {
            let response_photo = map_photo_to_response(photo);
            (StatusCode::CREATED, Json(ApiResponse::success(response_photo)))
        }
        Err(e) => {
            tracing::error!("Create photo evidence error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("上传照片失败".to_string())))
        }
    }
}

pub async fn delete_photo(
    State(state): State<Arc<AppState>>,
    Path((_record_id, photo_id)): Path<(String, String)>,
) -> impl IntoResponse {
    let photo_uuid = match Uuid::parse_str(&photo_id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("无效的照片ID".to_string()))),
    };

    match field_repo::delete_photo_evidence(&state.db, photo_uuid).await {
        Ok(_) => {
            (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({"message": "照片已删除", "id": photo_id}))))
        }
        Err(e) => {
            tracing::error!("Delete photo evidence error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("删除照片失败".to_string())))
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct UploadAudioRequest {
    pub file_name: String,
    pub file_size: Option<i64>,
    pub duration: Option<i64>,
    pub content_type: Option<String>,
    pub description: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

pub async fn upload_audio(
    State(state): State<Arc<AppState>>,
    Path(record_id): Path<String>,
    Json(req): Json<UploadAudioRequest>,
) -> impl IntoResponse {
    let record_uuid = match Uuid::parse_str(&record_id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("无效的记录ID".to_string()))),
    };

    let file_path = format!("/uploads/audios/{}/{}_{}", record_id, Uuid::new_v4(), req.file_name);

    let lat = req.latitude.and_then(|v| BigDecimal::from_f64(v));
    let lng = req.longitude.and_then(|v| BigDecimal::from_f64(v));

    match field_repo::add_audio_evidence(
        &state.db,
        record_uuid,
        req.file_name,
        file_path,
        req.file_size,
        req.duration,
        req.content_type,
        req.description,
        lat,
        lng,
    ).await {
        Ok(audio) => {
            let response_audio = map_audio_to_response(audio);
            (StatusCode::CREATED, Json(ApiResponse::success(response_audio)))
        }
        Err(e) => {
            tracing::error!("Create audio evidence error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("上传录音失败".to_string())))
        }
    }
}

pub async fn delete_audio(
    State(state): State<Arc<AppState>>,
    Path((_record_id, audio_id)): Path<(String, String)>,
) -> impl IntoResponse {
    let audio_uuid = match Uuid::parse_str(&audio_id) {
        Ok(u) => u,
        Err(_) => return (StatusCode::BAD_REQUEST, Json(ApiResponse::error("无效的录音ID".to_string()))),
    };

    match field_repo::delete_audio_evidence(&state.db, audio_uuid).await {
        Ok(_) => {
            (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({"message": "录音已删除", "id": audio_id}))))
        }
        Err(e) => {
            tracing::error!("Delete audio evidence error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("删除录音失败".to_string())))
        }
    }
}

fn map_record_to_response(record: FieldRecord) -> FieldRecordResponse {
    FieldRecordResponse {
        id: record.id.to_string(),
        user_id: record.user_id.to_string(),
        department_id: record.department_id.map(|id| id.to_string()),
        record_type: record.record_type,
        task_title: record.task_title,
        task_description: record.task_description,
        latitude: record.latitude.to_f64().unwrap_or(0.0),
        longitude: record.longitude.to_f64().unwrap_or(0.0),
        location_name: record.location_name,
        address: record.address,
        status: record.status,
        created_at: record.created_at,
        updated_at: record.updated_at,
    }
}

fn map_photo_to_response(photo: PhotoEvidence) -> PhotoEvidenceResponse {
    PhotoEvidenceResponse {
        id: photo.id.to_string(),
        record_id: photo.record_id.to_string(),
        file_name: photo.file_name,
        file_path: photo.file_path,
        file_size: photo.file_size,
        content_type: photo.content_type,
        description: photo.description,
        latitude: photo.latitude.map(|v| v.to_f64().unwrap_or(0.0)),
        longitude: photo.longitude.map(|v| v.to_f64().unwrap_or(0.0)),
        created_at: photo.created_at,
    }
}

fn map_audio_to_response(audio: AudioEvidence) -> AudioEvidenceResponse {
    AudioEvidenceResponse {
        id: audio.id.to_string(),
        record_id: audio.record_id.to_string(),
        file_name: audio.file_name,
        file_path: audio.file_path,
        file_size: audio.file_size,
        duration: audio.duration,
        content_type: audio.content_type,
        description: audio.description,
        created_at: audio.created_at,
    }
}