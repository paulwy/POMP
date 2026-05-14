
use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use crate::errors::ApiResponse;
use crate::AppState;
use std::sync::Arc;

/// 网站设置验证辅助工具
/// 仅用于数据验证，不修改现有逻辑
pub mod validation {
    use super::*;
    use serde::Deserialize;

    #[derive(Debug, Deserialize)]
    pub struct SettingsValidationRequest {
        pub site_name: String,
        pub primary_color: String,
        pub contact_email: String,
    }

    /// 验证网站设置格式
    pub async fn validate_settings(
        State(_state): State<Arc<AppState>>,
        Json(req): Json<SettingsValidationRequest>,
    ) -> impl IntoResponse {
        let mut errors = Vec::new();

        // 验证网站名称
        if req.site_name.trim().is_empty() {
            errors.push("网站名称不能为空".to_string());
        } else if req.site_name.len() > 100 {
            errors.push("网站名称不能超过100个字符".to_string());
        }

        // 验证颜色格式
        if !req.primary_color.starts_with('#') || 
           (req.primary_color.len() != 7 && req.primary_color.len() != 4) {
            errors.push("颜色格式不正确，应为 #RRGGBB 或 #RGB".to_string());
        }

        // 验证邮箱格式
        if !req.contact_email.contains('@') {
            errors.push("邮箱格式不正确".to_string());
        }

        if errors.is_empty() {
            (StatusCode::OK, Json(ApiResponse::success(serde_json::json!({
                "valid": true,
                "message": "设置格式验证通过"
            }))))
        } else {
            (StatusCode::BAD_REQUEST, Json(ApiResponse::error(format!(
                "设置验证失败: {}", errors.join(", ")
            ))))
        }
    }
}

/// 网站设置模板管理
/// 提供预设模板，不影响现有设置逻辑
pub mod templates {
    use super::*;
    use serde::Serialize;

    #[derive(Debug, Serialize)]
    pub struct WebsiteTemplate {
        pub id: String,
        pub name: String,
        pub description: String,
        pub settings: serde_json::Value,
    }

    /// 获取预设模板列表
    pub async fn get_templates(
        State(_state): State<Arc<AppState>>,
    ) -> impl IntoResponse {
        let templates = vec![
            WebsiteTemplate {
                id: "corporate".to_string(),
                name: "企业官网模板".to_string(),
                description: "专业的企业官网设计".to_string(),
                settings: serde_json::json!({
                    "primary_color": "#2563eb",
                    "secondary_color": "#1e40af",
                    "site_description": "专业的科技服务提供商"
                }),
            },
            WebsiteTemplate {
                id: "startup".to_string(),
                name: "创业公司模板".to_string(),
                description: "现代、活力的创业公司风格".to_string(),
                settings: serde_json::json!({
                    "primary_color": "#8b5cf6",
                    "secondary_color": "#7c3aed",
                    "site_description": "创新驱动的科技公司"
                }),
            },
            WebsiteTemplate {
                id: "minimal".to_string(),
                name: "极简风格模板".to_string(),
                description: "简洁优雅的设计风格".to_string(),
                settings: serde_json::json!({
                    "primary_color": "#334155",
                    "secondary_color": "#1e293b",
                    "site_description": "专注于核心业务"
                }),
            },
        ];

        (StatusCode::OK, Json(ApiResponse::success(templates)))
    }
}

/// 网站健康检查和统计
/// 独立的监控功能
pub mod health {
    use super::*;
    use chrono::Utc;

    /// 获取网站服务状态
    pub async fn get_service_status(
        State(_state): State<Arc<AppState>>,
    ) -> impl IntoResponse {
        let status = serde_json::json!({
            "service": "website",
            "status": "healthy",
            "timestamp": Utc::now().to_rfc3339(),
            "features": {
                "generation": true,
                "preview": true,
                "cloudflare_deploy": true
            }
        });

        (StatusCode::OK, Json(ApiResponse::success(status)))
    }
}
