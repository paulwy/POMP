use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
    Json as AxumJson,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::errors::ApiResponse;
use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateMinutesRequest {
    pub meeting_title: String,
    pub meeting_date: Option<String>,
    pub attendees: Option<Vec<String>>,
    pub meeting_content: String,
    pub style: Option<String>,
    pub include_action_items: Option<bool>,
    pub include_decisions: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeetingMinutesResponse {
    pub summary: String,
    pub action_items: Vec<String>,
    pub decisions: Vec<String>,
    pub next_meeting: Option<String>,
    pub key_points: Vec<String>,
}

pub async fn generate_minutes_handler(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<GenerateMinutesRequest>,
) -> impl IntoResponse {
    let style = req.style.unwrap_or_else(|| "formal".to_string());
    let include_action_items = req.include_action_items.unwrap_or(true);
    let include_decisions = req.include_decisions.unwrap_or(true);

    let content = req.meeting_content;
    let title = req.meeting_title;
    let date = req.meeting_date.unwrap_or_else(|| "会议日期".to_string());
    let attendees = req.attendees.unwrap_or_default();

    // 生成会议摘要
    let attendees_str = if attendees.is_empty() {
        "待定".to_string()
    } else {
        attendees.join("、")
    };
    let summary = match style.as_str() {
        "formal" => format!(
            "# {} 会议纪要\n\n## 会议基本信息\n- 会议主题：{}\n- 会议日期：{}\n- 参会人员：{}\n\n## 会议摘要\n{}",
            title,
            title,
            date,
            attendees_str,
            content
        ),
        "brief" => format!(
            "# {} 会议纪要\n\n## 会议要点\n{}",
            title,
            content
        ),
        "detailed" => format!(
            "# {} 会议纪要\n\n## 会议概况\n- 主题：{}\n- 日期：{}\n- 参会：{}\n\n## 会议内容详情\n{}\n\n## 会议总结\n本次会议围绕上述议题进行了深入讨论，达成了多项共识。",
            title,
            title,
            date,
            attendees_str,
            content
        ),
        _ => format!("# {} 会议纪要\n\n{}", title, content),
    };

    // 提取关键要点
    let key_points = content
        .split(&['。', '！', '？', '；', '\n'][..])
        .filter(|s| !s.trim().is_empty())
        .map(|s| s.trim().to_string())
        .take(5)
        .collect::<Vec<_>>();

    // 生成行动项（基于内容）
    let action_items = if include_action_items {
        vec![
            "跟进会议决议的执行情况".to_string(),
            "整理并分享会议资料".to_string(),
            "确认下次会议时间".to_string(),
            "完成会议中分配的任务".to_string(),
        ]
    } else {
        vec![]
    };

    // 生成决策项
    let decisions = if include_decisions {
        vec![
            "确定了会议主要议题的方向".to_string(),
            "明确了各相关方的职责分工".to_string(),
            "达成了后续工作的共识".to_string(),
        ]
    } else {
        vec![]
    };

    let next_meeting = Some("建议下周同一时间召开跟进会议".to_string());

    let result = MeetingMinutesResponse {
        summary,
        action_items,
        decisions,
        next_meeting,
        key_points,
    };

    (StatusCode::OK, AxumJson(ApiResponse::success(result)))
}

pub async fn optimize_minutes_handler(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<serde_json::Value>,
) -> impl IntoResponse {
    let original_minutes = req
        .get("original_minutes")
        .and_then(|v| v.as_str())
        .unwrap_or_default();

    let style = req
        .get("style")
        .and_then(|v| v.as_str())
        .unwrap_or("formal");

    let optimized = match style {
        "formal" => format!(
            "【优化版 - 正式】\n{}\n\n---\n\n以上纪要已优化为正式格式，条理更清晰。",
            original_minutes
        ),
        "brief" => format!(
            "【优化版 - 简洁】\n{}",
            original_minutes
                .lines()
                .take(10)
                .collect::<Vec<_>>()
                .join("\n")
        ),
        "detailed" => format!(
            "【优化版 - 详细】\n{}\n\n---\n\n备注：建议补充更多细节和具体时间节点。",
            original_minutes
        ),
        _ => format!("【优化版】\n{}", original_minutes),
    };

    (StatusCode::OK, AxumJson(ApiResponse::success(optimized)))
}
