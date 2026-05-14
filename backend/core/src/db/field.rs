use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct FieldRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub department_id: Option<Uuid>,
    pub record_type: String,
    pub task_title: Option<String>,
    pub task_description: Option<String>,
    pub latitude: bigdecimal::BigDecimal,
    pub longitude: bigdecimal::BigDecimal,
    pub location_name: Option<String>,
    pub address: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFieldRecord {
    pub user_id: String,
    pub department_id: Option<String>,
    pub record_type: String,
    pub task_title: Option<String>,
    pub task_description: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub location_name: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateFieldRecord {
    pub status: Option<String>,
    pub task_title: Option<String>,
    pub task_description: Option<String>,
    pub location_name: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PhotoEvidence {
    pub id: Uuid,
    pub record_id: Uuid,
    pub file_name: String,
    pub file_path: String,
    pub file_size: Option<i64>,
    pub content_type: Option<String>,
    pub description: Option<String>,
    pub latitude: Option<bigdecimal::BigDecimal>,
    pub longitude: Option<bigdecimal::BigDecimal>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePhotoEvidence {
    pub record_id: Uuid,
    pub file_name: String,
    pub file_path: String,
    pub file_size: Option<i64>,
    pub content_type: Option<String>,
    pub description: Option<String>,
    pub latitude: Option<bigdecimal::BigDecimal>,
    pub longitude: Option<bigdecimal::BigDecimal>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AudioEvidence {
    pub id: Uuid,
    pub record_id: Uuid,
    pub file_name: String,
    pub file_path: String,
    pub file_size: Option<i64>,
    pub duration: Option<i64>,
    pub content_type: Option<String>,
    pub description: Option<String>,
    pub latitude: Option<bigdecimal::BigDecimal>,
    pub longitude: Option<bigdecimal::BigDecimal>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAudioEvidence {
    pub record_id: Uuid,
    pub file_name: String,
    pub file_path: String,
    pub file_size: Option<i64>,
    pub duration: Option<i64>,
    pub content_type: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldRecordWithEvidences {
    pub record: FieldRecord,
    pub photos: Vec<PhotoEvidence>,
    pub audios: Vec<AudioEvidence>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldRecordQuery {
    pub user_id: Option<String>,
    pub department_id: Option<String>,
    pub record_type: Option<String>,
    pub status: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

pub type DatabasePool = crate::db::DbPool;