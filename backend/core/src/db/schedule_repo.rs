use crate::db::schedule::{
    CreateScheduleEvent, ScheduleEvent, ScheduleQueryParams, UpdateScheduleEvent,
};
use crate::db::DbPool;
use anyhow::Result;
use chrono::Utc;
use sqlx::{query, query_as};
use uuid::Uuid;

pub async fn get_schedule_events(
    pool: &DbPool,
    params: ScheduleQueryParams,
) -> Result<Vec<ScheduleEvent>> {
    let sql = r#"
        SELECT id, title, description, event_type, start_time, end_time, is_all_day, location, 
               organizer_id, participant_ids, reminder_minutes, is_recurring, recurrence_rule, 
               status, color, created_at, updated_at
        FROM schedule_events
        WHERE ($1::UUID IS NULL OR organizer_id = $1)
          AND ($2::TIMESTAMPTZ IS NULL OR start_time >= $2)
          AND ($3::TIMESTAMPTZ IS NULL OR end_time <= $3)
          AND ($4::TEXT IS NULL OR status = $4)
        ORDER BY start_time DESC
        LIMIT $5 OFFSET $6
    "#;

    let organizer_id = params.organizer_id.and_then(|id| Uuid::parse_str(&id).ok());
    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(50);
    let offset = (page - 1) * page_size;

    let events = query_as::<_, ScheduleEvent>(sql)
        .bind(organizer_id)
        .bind(params.start_date)
        .bind(params.end_date)
        .bind(params.status)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

    Ok(events)
}

pub async fn get_schedule_event_by_id(pool: &DbPool, id: Uuid) -> Result<Option<ScheduleEvent>> {
    let sql = r#"
        SELECT id, title, description, event_type, start_time, end_time, is_all_day, location, 
               organizer_id, participant_ids, reminder_minutes, is_recurring, recurrence_rule, 
               status, color, created_at, updated_at
        FROM schedule_events
        WHERE id = $1
    "#;

    let event = query_as::<_, ScheduleEvent>(sql)
        .bind(id)
        .fetch_optional(pool)
        .await?;

    Ok(event)
}

pub async fn create_schedule_event(
    pool: &DbPool,
    event: CreateScheduleEvent,
) -> Result<ScheduleEvent> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    let event_type = event.event_type.unwrap_or("meeting".to_string());
    let is_all_day = event.is_all_day.unwrap_or(false);
    let is_recurring = event.is_recurring.unwrap_or(false);
    let status = "active".to_string();
    let color = event.color.unwrap_or("#3B82F6".to_string());
    let participant_ids = serde_json::to_value(event.participant_ids.unwrap_or_default())?;

    let sql = r#"
        INSERT INTO schedule_events (
            id, title, description, event_type, start_time, end_time, is_all_day, location, 
            organizer_id, participant_ids, reminder_minutes, is_recurring, recurrence_rule, 
            status, color, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id, title, description, event_type, start_time, end_time, is_all_day, location, 
                  organizer_id, participant_ids, reminder_minutes, is_recurring, recurrence_rule, 
                  status, color, created_at, updated_at
    "#;

    let new_event = query_as::<_, ScheduleEvent>(sql)
        .bind(id)
        .bind(event.title)
        .bind(event.description)
        .bind(event_type)
        .bind(event.start_time)
        .bind(event.end_time)
        .bind(is_all_day)
        .bind(event.location)
        .bind(event.organizer_id)
        .bind(participant_ids)
        .bind(event.reminder_minutes)
        .bind(is_recurring)
        .bind(event.recurrence_rule)
        .bind(status)
        .bind(color)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await?;

    Ok(new_event)
}

pub async fn update_schedule_event(
    pool: &DbPool,
    id: Uuid,
    update: UpdateScheduleEvent,
) -> Result<ScheduleEvent> {
    let sql = r#"
        UPDATE schedule_events
        SET title = COALESCE($1, title),
            description = COALESCE($2, description),
            event_type = COALESCE($3, event_type),
            start_time = COALESCE($4, start_time),
            end_time = COALESCE($5, end_time),
            is_all_day = COALESCE($6, is_all_day),
            location = COALESCE($7, location),
            participant_ids = COALESCE($8, participant_ids),
            reminder_minutes = COALESCE($9, reminder_minutes),
            is_recurring = COALESCE($10, is_recurring),
            recurrence_rule = COALESCE($11, recurrence_rule),
            status = COALESCE($12, status),
            color = COALESCE($13, color),
            updated_at = NOW()
        WHERE id = $14
        RETURNING id, title, description, event_type, start_time, end_time, is_all_day, location, 
                  organizer_id, participant_ids, reminder_minutes, is_recurring, recurrence_rule, 
                  status, color, created_at, updated_at
    "#;

    let participant_ids = update
        .participant_ids
        .and_then(|ids| serde_json::to_value(ids).ok());

    let updated_event = query_as::<_, ScheduleEvent>(sql)
        .bind(update.title)
        .bind(update.description)
        .bind(update.event_type)
        .bind(update.start_time)
        .bind(update.end_time)
        .bind(update.is_all_day)
        .bind(update.location)
        .bind(participant_ids)
        .bind(update.reminder_minutes)
        .bind(update.is_recurring)
        .bind(update.recurrence_rule)
        .bind(update.status)
        .bind(update.color)
        .bind(id)
        .fetch_one(pool)
        .await?;

    Ok(updated_event)
}

pub async fn delete_schedule_event(pool: &DbPool, id: Uuid) -> Result<bool> {
    let sql = "DELETE FROM schedule_events WHERE id = $1";
    let result = query(sql).bind(id).execute(pool).await?;
    Ok(result.rows_affected() > 0)
}
