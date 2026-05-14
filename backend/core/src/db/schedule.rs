use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ScheduleEvent {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub event_type: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub is_all_day: bool,
    pub location: Option<String>,
    pub organizer_id: Uuid,
    pub participant_ids: serde_json::Value,
    pub reminder_minutes: Option<i32>,
    pub is_recurring: bool,
    pub recurrence_rule: Option<String>,
    pub status: String,
    pub color: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateScheduleEvent {
    pub title: String,
    pub description: Option<String>,
    pub event_type: Option<String>,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub is_all_day: Option<bool>,
    pub location: Option<String>,
    pub organizer_id: Uuid,
    pub participant_ids: Option<Vec<Uuid>>,
    pub reminder_minutes: Option<i32>,
    pub is_recurring: Option<bool>,
    pub recurrence_rule: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateScheduleEvent {
    pub title: Option<String>,
    pub description: Option<String>,
    pub event_type: Option<String>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub is_all_day: Option<bool>,
    pub location: Option<String>,
    pub participant_ids: Option<Vec<Uuid>>,
    pub reminder_minutes: Option<i32>,
    pub is_recurring: Option<bool>,
    pub recurrence_rule: Option<String>,
    pub status: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduleQueryParams {
    pub organizer_id: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub status: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}
