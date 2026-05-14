use crate::config::Config;
use crate::db::field::{
    AudioEvidence, CreateFieldRecord, FieldRecord, FieldRecordWithEvidences, PhotoEvidence,
    UpdateFieldRecord,
};
use crate::db::field_repo::{
    add_audio_evidence, add_photo_evidence, create_field_record, delete_audio_evidence,
    delete_field_record, delete_photo_evidence, get_all_field_records, get_audio_evidences,
    get_field_record_with_evidences, get_photo_evidences, get_user_field_records,
    update_field_record,
};
use crate::db::DbPool;
use crate::errors::{AppError, Result};
use bigdecimal::{BigDecimal, FromPrimitive};
use std::path::Path;
use uuid::Uuid;

pub struct FieldService {
    pool: DbPool,
    config: Config,
}

impl FieldService {
    pub fn new(pool: DbPool, config: Config) -> Self {
        Self { pool, config }
    }

    pub async fn create_record(
        &self,
        record: CreateFieldRecord,
    ) -> Result<FieldRecord> {
        let record = create_field_record(&self.pool, record)
            .await
            .map_err(AppError::DatabaseError)?;
        Ok(record)
    }

    pub async fn get_record(&self, id: Uuid) -> Result<FieldRecordWithEvidences> {
        let record = get_field_record_with_evidences(&self.pool, id)
            .await
            .map_err(AppError::DatabaseError)?;
        Ok(record)
    }

    pub async fn get_user_records(
        &self,
        user_id: Uuid,
        status: Option<String>,
        page: Option<i32>,
        page_size: Option<i32>,
    ) -> Result<Vec<FieldRecord>> {
        let records = get_user_field_records(&self.pool, user_id, status, page, page_size)
            .await
            .map_err(AppError::DatabaseError)?;
        Ok(records)
    }

    pub async fn get_all_records(
        &self,
        status: Option<String>,
        page: Option<i32>,
        page_size: Option<i32>,
    ) -> Result<Vec<FieldRecord>> {
        let records = get_all_field_records(&self.pool, status, page, page_size)
            .await
            .map_err(AppError::DatabaseError)?;
        Ok(records)
    }

    pub async fn update_record(&self, id: Uuid, update: UpdateFieldRecord) -> Result<FieldRecord> {
        let record = update_field_record(&self.pool, id, update)
            .await
            .map_err(AppError::DatabaseError)?;
        Ok(record)
    }

    pub async fn delete_record(&self, id: Uuid) -> Result<()> {
        delete_field_record(&self.pool, id)
            .await
            .map_err(AppError::DatabaseError)?;
        Ok(())
    }

    pub async fn upload_photo_evidence(
        &self,
        field_record_id: Uuid,
        file_data: &[u8],
        file_name: &str,
        content_type: &str,
        description: Option<String>,
        latitude: Option<f64>,
        longitude: Option<f64>,
    ) -> Result<PhotoEvidence> {
        let storage_path = Path::new("./storage/field_photos");
        if !storage_path.exists() {
            std::fs::create_dir_all(storage_path).map_err(|_| AppError::InternalServerError)?;
        }

        let file_ext = Path::new(file_name)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("jpg");
        let new_file_name = format!("{}.{}", Uuid::new_v4(), file_ext);
        let file_path = storage_path.join(&new_file_name);

        std::fs::write(&file_path, file_data).map_err(|_| AppError::InternalServerError)?;

        let lat = latitude.map(|v| BigDecimal::from_f64(v).unwrap_or_default());
        let lng = longitude.map(|v| BigDecimal::from_f64(v).unwrap_or_default());

        let evidence = add_photo_evidence(
            &self.pool,
            field_record_id,
            new_file_name.clone(),
            file_path.to_string_lossy().to_string(),
            Some(file_data.len() as i64),
            Some(content_type.to_string()),
            description,
            lat,
            lng,
        )
        .await
        .map_err(AppError::DatabaseError)?;

        Ok(evidence)
    }

    pub async fn get_photos(&self, field_record_id: Uuid) -> Result<Vec<PhotoEvidence>> {
        let photos = get_photo_evidences(&self.pool, field_record_id)
            .await
            .map_err(AppError::DatabaseError)?;
        Ok(photos)
    }

    pub async fn delete_photo(&self, id: Uuid) -> Result<()> {
        delete_photo_evidence(&self.pool, id)
            .await
            .map_err(AppError::DatabaseError)?;
        Ok(())
    }

    pub async fn upload_audio_evidence(
        &self,
        field_record_id: Uuid,
        file_data: &[u8],
        file_name: &str,
        content_type: &str,
        duration: Option<i32>,
        description: Option<String>,
        latitude: Option<f64>,
        longitude: Option<f64>,
    ) -> Result<AudioEvidence> {
        let storage_path = Path::new("./storage/field_audios");
        if !storage_path.exists() {
            std::fs::create_dir_all(storage_path).map_err(|_| AppError::InternalServerError)?;
        }

        let file_ext = Path::new(file_name)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("mp3");
        let new_file_name = format!("{}.{}", Uuid::new_v4(), file_ext);
        let file_path = storage_path.join(&new_file_name);

        std::fs::write(&file_path, file_data).map_err(|_| AppError::InternalServerError)?;

        let lat = latitude.map(|v| BigDecimal::from_f64(v).unwrap_or_default());
        let lng = longitude.map(|v| BigDecimal::from_f64(v).unwrap_or_default());

        let evidence = add_audio_evidence(
            &self.pool,
            field_record_id,
            new_file_name.clone(),
            file_path.to_string_lossy().to_string(),
            Some(file_data.len() as i64),
            duration.map(|v| v as i64),
            Some(content_type.to_string()),
            description,
            lat,
            lng,
        )
        .await
        .map_err(AppError::DatabaseError)?;

        Ok(evidence)
    }

    pub async fn get_audios(&self, field_record_id: Uuid) -> Result<Vec<AudioEvidence>> {
        let audios = get_audio_evidences(&self.pool, field_record_id)
            .await
            .map_err(AppError::DatabaseError)?;
        Ok(audios)
    }

    pub async fn delete_audio(&self, id: Uuid) -> Result<()> {
        delete_audio_evidence(&self.pool, id)
            .await
            .map_err(AppError::DatabaseError)?;
        Ok(())
    }

    pub async fn get_photo_file_path(&self, file_path: &str) -> Result<std::path::PathBuf> {
        let path = Path::new(file_path);
        if path.exists() {
            Ok(path.to_path_buf())
        } else {
            Err(AppError::NotFound("照片文件不存在".to_string()))
        }
    }

    pub async fn get_audio_file_path(&self, file_path: &str) -> Result<std::path::PathBuf> {
        let path = Path::new(file_path);
        if path.exists() {
            Ok(path.to_path_buf())
        } else {
            Err(AppError::NotFound("音频文件不存在".to_string()))
        }
    }
}
