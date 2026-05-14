use axum::{
    extract::{Multipart, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::errors::ApiResponse;
use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaFile {
    pub file_id: String,
    pub file_name: String,
    pub file_type: String,
    pub file_size: i64,
    pub url: String,
    pub uploaded_by: String,
    pub uploaded_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadMediaResponse {
    pub success: bool,
    pub file_url: String,
    pub message: String,
}

pub async fn upload_media_handler(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let file_id = Uuid::new_v4();
    let mut file_name = String::new();
    let mut file_type = String::new();
    let mut file_size = 0i64;
    let mut file_data: Option<Vec<u8>> = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        if field.name() == Some("file") {
            file_name = field.file_name().unwrap_or("unknown").to_string();
            let content_type = field.content_type().unwrap_or("application/octet-stream");
            file_type = content_type.to_string();
            if let Ok(data) = field.bytes().await {
                file_size = data.len() as i64;
                file_data = Some(data.to_vec());
            }
        }
    }

    let upload_dir = std::path::Path::new("uploads");
    if !upload_dir.exists() {
        std::fs::create_dir_all(upload_dir).ok();
    }

    let file_extension = file_name.rsplit('.').next().unwrap_or("bin");
    let stored_file_name = format!("{}.{}", file_id, file_extension);
    let file_path = upload_dir.join(&stored_file_name);

    if let Some(data) = file_data {
        std::fs::write(&file_path, &data).ok();
    }

    let file_url = format!("/uploads/{}", stored_file_name);

    match sqlx::query!(
        r#"INSERT INTO media_files (id, file_name, file_type, file_size, file_path, url, uploaded_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"#,
        file_id,
        file_name,
        file_type,
        file_size,
        file_path.to_string_lossy().to_string(),
        file_url,
        "system",
        Utc::now()
    )
    .execute(&state.db)
    .await
    {
        Ok(_) => {
            let response = UploadMediaResponse {
                success: true,
                file_url: file_url.clone(),
                message: "上传成功".to_string(),
            };
            (StatusCode::OK, Json(ApiResponse::success(response)))
        }
        Err(e) => {
            tracing::error!("Error saving media file: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("保存文件失败".to_string())))
        }
    }
}

pub async fn get_media_handler(
    State(state): State<Arc<AppState>>,
    Query(_params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    match sqlx::query!(
        r#"SELECT id, file_name, file_type, file_size, url, uploaded_by, created_at FROM media_files ORDER BY created_at DESC LIMIT 100"#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => {
            let media_list: Vec<MediaFile> = records
                .into_iter()
                .map(|r| MediaFile {
                    file_id: r.id.to_string(),
                    file_name: r.file_name,
                    file_type: r.file_type.unwrap_or_default(),
                    file_size: r.file_size.unwrap_or(0),
                    url: r.url.unwrap_or_default(),
                    uploaded_by: r.uploaded_by.unwrap_or_default(),
                    uploaded_at: r.created_at.unwrap_or_else(Utc::now),
                })
                .collect();
            (StatusCode::OK, Json(ApiResponse::success(media_list)))
        }
        Err(e) => {
            tracing::error!("Error fetching media files: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error("获取媒体文件失败".to_string())))
        }
    }
}
