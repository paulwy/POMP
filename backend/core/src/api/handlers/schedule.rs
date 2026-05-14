use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::db::schedule::{CreateScheduleEvent, ScheduleEvent, UpdateScheduleEvent};
use crate::db::schedule_repo::{
    create_schedule_event, delete_schedule_event, get_schedule_event_by_id, get_schedule_events,
    update_schedule_event,
};
use crate::errors::ApiResponse;
use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduleQueryParams {
    pub organizer_id: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub status: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateScheduleEventRequest {
    pub title: String,
    pub description: Option<String>,
    pub event_type: Option<String>,
    pub start_time: String,
    pub end_time: String,
    pub is_all_day: Option<bool>,
    pub location: Option<String>,
    pub organizer_id: String,
    pub participant_ids: Option<Vec<String>>,
    pub reminder_minutes: Option<i32>,
    pub is_recurring: Option<bool>,
    pub recurrence_rule: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateScheduleEventRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub event_type: Option<String>,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub is_all_day: Option<bool>,
    pub location: Option<String>,
    pub participant_ids: Option<Vec<String>>,
    pub reminder_minutes: Option<i32>,
    pub is_recurring: Option<bool>,
    pub recurrence_rule: Option<String>,
    pub status: Option<String>,
    pub color: Option<String>,
}

pub async fn get_schedule_events_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ScheduleQueryParams>,
) -> impl IntoResponse {
    use chrono::DateTime;
    use chrono::Utc;

    let start_date = params.start_date.and_then(|d| {
        DateTime::parse_from_rfc3339(&d)
            .ok()
            .map(|dt| dt.with_timezone(&Utc))
    });
    let end_date = params.end_date.and_then(|d| {
        DateTime::parse_from_rfc3339(&d)
            .ok()
            .map(|dt| dt.with_timezone(&Utc))
    });

    let search_params = crate::db::schedule::ScheduleQueryParams {
        organizer_id: params.organizer_id,
        start_date,
        end_date,
        status: params.status,
        page: params.page,
        page_size: params.page_size,
    };

    match get_schedule_events(&state.db, search_params).await {
        Ok(events) => (StatusCode::OK, Json(ApiResponse::success(events))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Vec<ScheduleEvent>>::error(e.to_string())),
        ),
    }
}

pub async fn get_schedule_event_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let event_id = match Uuid::parse_str(&id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<Option<ScheduleEvent>>::error(
                    "Invalid ID format".to_string(),
                )),
            );
        }
    };

    match get_schedule_event_by_id(&state.db, event_id).await {
        Ok(event) => (StatusCode::OK, Json(ApiResponse::success(event))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<Option<ScheduleEvent>>::error(e.to_string())),
        ),
    }
}

pub async fn create_schedule_event_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateScheduleEventRequest>,
) -> impl IntoResponse {
    use chrono::DateTime;
    use chrono::Utc;

    let organizer_id = match Uuid::parse_str(&req.organizer_id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<ScheduleEvent>::error(
                    "Invalid organizer ID format".to_string(),
                )),
            );
        }
    };

    let start_time = match DateTime::parse_from_rfc3339(&req.start_time) {
        Ok(dt) => dt.with_timezone(&Utc),
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<ScheduleEvent>::error(
                    "Invalid start time format".to_string(),
                )),
            );
        }
    };

    let end_time = match DateTime::parse_from_rfc3339(&req.end_time) {
        Ok(dt) => dt.with_timezone(&Utc),
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<ScheduleEvent>::error(
                    "Invalid end time format".to_string(),
                )),
            );
        }
    };

    let participant_ids = req.participant_ids.map(|ids| {
        ids.iter()
            .filter_map(|id| Uuid::parse_str(id).ok())
            .collect()
    });

    let create_req = CreateScheduleEvent {
        title: req.title,
        description: req.description,
        event_type: req.event_type,
        start_time,
        end_time,
        is_all_day: req.is_all_day,
        location: req.location,
        organizer_id,
        participant_ids,
        reminder_minutes: req.reminder_minutes,
        is_recurring: req.is_recurring,
        recurrence_rule: req.recurrence_rule,
        color: req.color,
    };

    match create_schedule_event(&state.db, create_req).await {
        Ok(event) => (StatusCode::CREATED, Json(ApiResponse::success(event))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<ScheduleEvent>::error(e.to_string())),
        ),
    }
}

pub async fn update_schedule_event_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<UpdateScheduleEventRequest>,
) -> impl IntoResponse {
    let event_id = match Uuid::parse_str(&id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<ScheduleEvent>::error(
                    "Invalid ID format".to_string(),
                )),
            );
        }
    };

    use chrono::DateTime;
    use chrono::Utc;

    let start_time = req.start_time.and_then(|d| {
        DateTime::parse_from_rfc3339(&d)
            .ok()
            .map(|dt| dt.with_timezone(&Utc))
    });
    let end_time = req.end_time.and_then(|d| {
        DateTime::parse_from_rfc3339(&d)
            .ok()
            .map(|dt| dt.with_timezone(&Utc))
    });

    let participant_ids = req.participant_ids.map(|ids| {
        ids.iter()
            .filter_map(|id| Uuid::parse_str(id).ok())
            .collect()
    });

    let update_req = UpdateScheduleEvent {
        title: req.title,
        description: req.description,
        event_type: req.event_type,
        start_time,
        end_time,
        is_all_day: req.is_all_day,
        location: req.location,
        participant_ids,
        reminder_minutes: req.reminder_minutes,
        is_recurring: req.is_recurring,
        recurrence_rule: req.recurrence_rule,
        status: req.status,
        color: req.color,
    };

    match update_schedule_event(&state.db, event_id, update_req).await {
        Ok(event) => (StatusCode::OK, Json(ApiResponse::success(event))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<ScheduleEvent>::error(e.to_string())),
        ),
    }
}

pub async fn delete_schedule_event_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let event_id = match Uuid::parse_str(&id) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<bool>::error("Invalid ID format".to_string())),
            );
        }
    };

    match delete_schedule_event(&state.db, event_id).await {
        Ok(deleted) => (StatusCode::OK, Json(ApiResponse::success(deleted))),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<bool>::error(e.to_string())),
        ),
    }
}
