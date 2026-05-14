use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json as AxumJson,
};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::errors::ApiResponse;
use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_employees: i64,
    pub active_employees: i64,
    pub today_attendance: i64,
    pub on_leave_today: i64,
    pub pending_approvals: i64,
    pub total_departments: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductionTrend {
    pub date: String,
    pub production: f64,
    pub qualified: f64,
    pub unqualified: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepartmentDistribution {
    pub name: String,
    pub value: i64,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttendanceSummary {
    pub date: String,
    pub normal: i64,
    pub late: i64,
    pub absent: i64,
    pub on_leave: i64,
}

pub async fn get_dashboard_stats_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let today = Utc::now().format("%Y-%m-%d").to_string();

    let total_employees: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE status != 'archived'")
            .fetch_one(&state.db)
            .await
            .unwrap_or(Some(0))
            .unwrap_or(0);

    let active_employees: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM users WHERE is_active = true AND status != 'archived'",
    )
    .fetch_one(&state.db)
    .await
    .unwrap_or(Some(0))
    .unwrap_or(0);

    let today_attendance: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM attendance_records WHERE attendance_date = $1::date",
    )
    .bind(&today)
    .fetch_one(&state.db)
    .await
    .unwrap_or(Some(0))
    .unwrap_or(0);

    let on_leave_today: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM leave_requests WHERE status = 'approved' AND start_date <= $1::date AND end_date >= $1::date"
    )
    .bind(&today)
    .fetch_one(&state.db)
    .await
    .unwrap_or(Some(0))
    .unwrap_or(0);

    let pending_approvals: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM approval_tasks WHERE status IN ('pending', 'processing')",
    )
    .fetch_one(&state.db)
    .await
    .unwrap_or(Some(0))
    .unwrap_or(0);

    let total_departments: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM departments WHERE is_active = true")
            .fetch_one(&state.db)
            .await
            .unwrap_or(Some(0))
            .unwrap_or(0);

    let stats = DashboardStats {
        total_employees,
        active_employees,
        today_attendance,
        on_leave_today,
        pending_approvals,
        total_departments,
    };

    (StatusCode::OK, AxumJson(ApiResponse::success(stats)))
}

pub async fn get_production_trend_handler(
    State(_state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let days = params
        .get("days")
        .and_then(|p| p.parse::<i64>().ok())
        .unwrap_or(7);

    let mut trends = Vec::new();
    let now = Utc::now();

    for i in (0..days).rev() {
        let date = now - Duration::days(i);
        let base_production = 800.0 + (i as f64 * 50.0);
        let variation = ((i * 7) % 100) as f64;

        trends.push(ProductionTrend {
            date: date.format("%m-%d").to_string(),
            production: base_production + variation,
            qualified: (base_production + variation) * 0.96,
            unqualified: (base_production + variation) * 0.04,
        });
    }

    (StatusCode::OK, AxumJson(ApiResponse::success(trends)))
}

pub async fn get_department_distribution_handler(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    let distribution = match sqlx::query_as::<_, (String, Option<i64>)>(
        r#"SELECT d.name, COUNT(u.id) as user_count
           FROM departments d
           LEFT JOIN users u ON u.department_id = d.id AND u.status != 'archived'
           WHERE d.is_active = true
           GROUP BY d.id, d.name
           ORDER BY user_count DESC NULLS LAST"#,
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => {
            let colors = [
                "hsl(221, 83%, 53%)",
                "hsl(262, 83%, 58%)",
                "hsl(142, 71%, 36%)",
                "hsl(38, 92%, 50%)",
                "hsl(199, 89%, 48%)",
                "hsl(270, 91%, 75%)",
                "hsl(145, 81%, 55%)",
                "hsl(215, 16%, 46%)",
            ];
            records
                .into_iter()
                .enumerate()
                .map(|(i, r)| DepartmentDistribution {
                    name: r.0,
                    value: r.1.unwrap_or(0),
                    color: colors[i % colors.len()].to_string(),
                })
                .collect::<Vec<DepartmentDistribution>>()
        }
        Err(e) => {
            eprintln!("Error fetching department distribution: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, AxumJson(ApiResponse::success(distribution)))
}

pub async fn get_attendance_summary_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> impl IntoResponse {
    let days = params
        .get("days")
        .and_then(|p| p.parse::<i64>().ok())
        .unwrap_or(7);
    let now = Utc::now();

    let mut summary = Vec::new();

    for i in (0..days).rev() {
        let date = now - Duration::days(i);
        let date_str = date.format("%Y-%m-%d").to_string();

        let stats = match sqlx::query_as::<_, (i64, i64, i64, i64)>(
            r#"SELECT
                COALESCE(SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END), 0) as normal,
                COALESCE(SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END), 0) as late,
                COALESCE(SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END), 0) as absent,
                COALESCE(SUM(CASE WHEN status IN ('leave', 'on_leave') THEN 1 ELSE 0 END), 0) as on_leave
               FROM attendance_records WHERE attendance_date = $1::date"#
        )
        .bind(&date_str)
        .fetch_one(&state.db)
        .await
        {
            Ok(r) => (r.0, r.1, r.2, r.3),
            Err(_) => (0, 0, 0, 0),
        };

        summary.push(AttendanceSummary {
            date: date.format("%m-%d").to_string(),
            normal: stats.0,
            late: stats.1,
            absent: stats.2,
            on_leave: stats.3,
        });
    }

    (StatusCode::OK, AxumJson(ApiResponse::success(summary)))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalStats {
    pub pending: i64,
    pub approved_today: i64,
    pub rejected_today: i64,
    pub avg_processing_time: f64,
}

pub async fn get_approval_stats_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let today = Utc::now().format("%Y-%m-%d").to_string();

    let pending: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM approval_tasks WHERE status IN ('pending', 'processing')",
    )
    .fetch_one(&state.db)
    .await
    .unwrap_or(Some(0))
    .unwrap_or(0);

    let approved_today: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM approval_records WHERE action = 'approved' AND DATE(created_at) = $1::date"
    )
    .bind(&today)
    .fetch_one(&state.db)
    .await
    .unwrap_or(Some(0))
    .unwrap_or(0);

    let rejected_today: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM approval_records WHERE action = 'rejected' AND DATE(created_at) = $1::date"
    )
    .bind(&today)
    .fetch_one(&state.db)
    .await
    .unwrap_or(Some(0))
    .unwrap_or(0);

    let avg_processing_time: f64 = sqlx::query_scalar(
        "SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600), 0) FROM approval_tasks WHERE status IN ('approved', 'rejected')"
    )
    .fetch_one(&state.db)
    .await
    .unwrap_or(Some(0.0))
    .unwrap_or(0.0);

    let stats = ApprovalStats {
        pending,
        approved_today,
        rejected_today,
        avg_processing_time,
    };

    (StatusCode::OK, AxumJson(ApiResponse::success(stats)))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeaveTypeDistribution {
    pub name: String,
    pub value: i64,
}

pub async fn get_leave_type_distribution_handler(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    let distribution = match sqlx::query_as::<_, (String, i64)>(
        r#"SELECT leave_type, COUNT(*) as count
           FROM leave_requests
           WHERE status = 'approved'
           GROUP BY leave_type
           ORDER BY count DESC"#,
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(records) => records
            .into_iter()
            .map(|r| LeaveTypeDistribution {
                name: r.0,
                value: r.1,
            })
            .collect::<Vec<LeaveTypeDistribution>>(),
        Err(e) => {
            eprintln!("Error fetching leave type distribution: {}", e);
            vec![]
        }
    };

    (StatusCode::OK, AxumJson(ApiResponse::success(distribution)))
}
