use crate::db::field::{
    AudioEvidence, CreateAudioEvidence, CreateFieldRecord, CreatePhotoEvidence, FieldRecord,
    FieldRecordWithEvidences, PhotoEvidence, UpdateFieldRecord,
};
use crate::db::DbPool;
use bigdecimal::{BigDecimal, FromPrimitive};
use chrono::Utc;
use sqlx::{query, query_as};
use uuid::Uuid;

pub async fn create_field_record(
    pool: &DbPool,
    record: CreateFieldRecord,
) -> sqlx::Result<FieldRecord> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    
    let latitude = record.latitude.and_then(|v| BigDecimal::from_f64(v)).ok_or(sqlx::Error::RowNotFound)?;
    let longitude = record.longitude.and_then(|v| BigDecimal::from_f64(v)).ok_or(sqlx::Error::RowNotFound)?;

    let sql = r#"
        INSERT INTO field_records (
            id, user_id, department_id, record_type, task_title, task_description,
            latitude, longitude, location_name, address, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed', $11, $12)
        RETURNING *
    "#;

    let record = query_as::<_, FieldRecord>(sql)
        .bind(id)
        .bind(Uuid::parse_str(&record.user_id).unwrap_or_default())
        .bind(record.department_id.map(|s| Uuid::parse_str(&s).ok()))
        .bind(record.record_type)
        .bind(record.task_title)
        .bind(record.task_description)
        .bind(latitude)
        .bind(longitude)
        .bind(record.location_name)
        .bind(record.address)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await?;

    Ok(record)
}

pub async fn get_field_record(pool: &DbPool, id: Uuid) -> sqlx::Result<FieldRecord> {
    let sql = r#"
        SELECT * FROM field_records WHERE id = $1
    "#;

    let record = query_as::<_, FieldRecord>(sql)
        .bind(id)
        .fetch_one(pool)
        .await?;

    Ok(record)
}

pub async fn get_field_record_with_evidences(
    pool: &DbPool,
    id: Uuid,
) -> sqlx::Result<FieldRecordWithEvidences> {
    let record = get_field_record(pool, id).await?;
    let photos = get_photo_evidences(pool, id).await?;
    let audios = get_audio_evidences(pool, id).await?;

    Ok(FieldRecordWithEvidences {
        record,
        photos,
        audios,
    })
}

pub async fn get_user_field_records(
    pool: &DbPool,
    user_id: Uuid,
    status: Option<String>,
    page: Option<i32>,
    page_size: Option<i32>,
) -> sqlx::Result<Vec<FieldRecord>> {
    let limit = page_size.unwrap_or(20);
    let offset = ((page.unwrap_or(1) - 1) * limit) as i64;

    let records = if let Some(s) = status {
        let sql = r#"
            SELECT * FROM field_records
            WHERE user_id = $1 AND status = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
        "#;
        query_as::<_, FieldRecord>(sql)
            .bind(user_id)
            .bind(s)
            .bind(limit as i64)
            .bind(offset)
            .fetch_all(pool)
            .await?
    } else {
        let sql = r#"
            SELECT * FROM field_records
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        "#;
        query_as::<_, FieldRecord>(sql)
            .bind(user_id)
            .bind(limit as i64)
            .bind(offset)
            .fetch_all(pool)
            .await?
    };

    Ok(records)
}

pub async fn get_all_field_records(
    pool: &DbPool,
    status: Option<String>,
    page: Option<i32>,
    page_size: Option<i32>,
) -> sqlx::Result<Vec<FieldRecord>> {
    let limit = page_size.unwrap_or(20);
    let offset = ((page.unwrap_or(1) - 1) * limit) as i64;

    let records = if let Some(s) = status {
        let sql = r#"
            SELECT * FROM field_records
            WHERE status = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        "#;
        query_as::<_, FieldRecord>(sql)
            .bind(s)
            .bind(limit as i64)
            .bind(offset)
            .fetch_all(pool)
            .await?
    } else {
        let sql = r#"
            SELECT * FROM field_records
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        "#;
        query_as::<_, FieldRecord>(sql)
            .bind(limit as i64)
            .bind(offset)
            .fetch_all(pool)
            .await?
    };

    Ok(records)
}

pub async fn update_field_record(
    pool: &DbPool,
    id: Uuid,
    update: UpdateFieldRecord,
) -> sqlx::Result<FieldRecord> {
    let sql = r#"
        UPDATE field_records
        SET 
            status = COALESCE($2, status),
            task_title = COALESCE($3, task_title),
            task_description = COALESCE($4, task_description),
            location_name = COALESCE($5, location_name),
            address = COALESCE($6, address),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
    "#;

    let record = query_as::<_, FieldRecord>(sql)
        .bind(id)
        .bind(update.status)
        .bind(update.task_title)
        .bind(update.task_description)
        .bind(update.location_name)
        .bind(update.address)
        .fetch_one(pool)
        .await?;

    Ok(record)
}

pub async fn delete_field_record(pool: &DbPool, id: Uuid) -> sqlx::Result<()> {
    query(r#"DELETE FROM field_records WHERE id = $1"#)
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn add_photo_evidence(
    pool: &DbPool,
    record_id: Uuid,
    file_name: String,
    file_path: String,
    file_size: Option<i64>,
    content_type: Option<String>,
    description: Option<String>,
    latitude: Option<bigdecimal::BigDecimal>,
    longitude: Option<bigdecimal::BigDecimal>,
) -> sqlx::Result<PhotoEvidence> {
    let id = Uuid::new_v4();
    let now = Utc::now();

    let sql = r#"
        INSERT INTO photo_evidences (
            id, record_id, file_name, file_path, file_size, 
            content_type, description, latitude, longitude, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    "#;

    let evidence = query_as::<_, PhotoEvidence>(sql)
        .bind(id)
        .bind(record_id)
        .bind(file_name)
        .bind(file_path)
        .bind(file_size)
        .bind(content_type)
        .bind(description)
        .bind(latitude)
        .bind(longitude)
        .bind(now)
        .fetch_one(pool)
        .await?;

    Ok(evidence)
}

pub async fn get_photo_evidences(
    pool: &DbPool,
    record_id: Uuid,
) -> sqlx::Result<Vec<PhotoEvidence>> {
    let sql = r#"
        SELECT * FROM photo_evidences
        WHERE record_id = $1
        ORDER BY created_at DESC
    "#;

    let evidences = query_as::<_, PhotoEvidence>(sql)
        .bind(record_id)
        .fetch_all(pool)
        .await?;

    Ok(evidences)
}

pub async fn delete_photo_evidence(pool: &DbPool, id: Uuid) -> sqlx::Result<()> {
    query(r#"DELETE FROM photo_evidences WHERE id = $1"#)
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}

pub async fn add_audio_evidence(
    pool: &DbPool,
    record_id: Uuid,
    file_name: String,
    file_path: String,
    file_size: Option<i64>,
    duration: Option<i64>,
    content_type: Option<String>,
    description: Option<String>,
    latitude: Option<bigdecimal::BigDecimal>,
    longitude: Option<bigdecimal::BigDecimal>,
) -> sqlx::Result<AudioEvidence> {
    let id = Uuid::new_v4();
    let now = Utc::now();

    let sql = r#"
        INSERT INTO audio_evidences (
            id, record_id, file_name, file_path, file_size, 
            duration, content_type, description, latitude, longitude, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
    "#;

    let evidence = query_as::<_, AudioEvidence>(sql)
        .bind(id)
        .bind(record_id)
        .bind(file_name)
        .bind(file_path)
        .bind(file_size)
        .bind(duration)
        .bind(content_type)
        .bind(description)
        .bind(latitude)
        .bind(longitude)
        .bind(now)
        .fetch_one(pool)
        .await?;

    Ok(evidence)
}

pub async fn get_audio_evidences(
    pool: &DbPool,
    record_id: Uuid,
) -> sqlx::Result<Vec<AudioEvidence>> {
    let sql = r#"
        SELECT * FROM audio_evidences
        WHERE record_id = $1
        ORDER BY created_at DESC
    "#;

    let evidences = query_as::<_, AudioEvidence>(sql)
        .bind(record_id)
        .fetch_all(pool)
        .await?;

    Ok(evidences)
}

pub async fn delete_audio_evidence(pool: &DbPool, id: Uuid) -> sqlx::Result<()> {
    query(r#"DELETE FROM audio_evidences WHERE id = $1"#)
        .bind(id)
        .execute(pool)
        .await?;

    Ok(())
}