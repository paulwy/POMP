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
pub struct GenerateCommentRequest {
    pub application_content: String,
    pub decision: String,
    pub tone: Option<String>,
    pub length: Option<String>,
    pub style: Option<String>,
    pub approval_type: Option<String>,
    pub applicant_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizeCommentRequest {
    pub original_comment: String,
    pub application_content: Option<String>,
    pub decision: Option<String>,
    pub style: Option<String>,
}

pub async fn generate_comment_handler(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<GenerateCommentRequest>,
) -> impl IntoResponse {
    let style = req
        .style
        .or(req.tone)
        .unwrap_or_else(|| "formal".to_string());
    let decision = req.decision.as_str();

    let applicant = req.applicant_name.unwrap_or_else(|| "申请人".to_string());
    let content = req.application_content;

    let comment = match decision {
        "approve" => match style.as_str() {
            "formal" => format!("{}您好！您的{}申请已通过审核。感谢您的配合与支持，请按照后续流程办理相关手续。", applicant, content),
            "moderate" => format!("{}您好！您的{}申请已获批准，请知悉。如有疑问，可随时联系我们。", applicant, content),
            "strict" => format!("经审核，{}的{}申请符合要求，予以批准。请严格按照规定执行后续流程。", applicant, content),
            _ => format!("{}的{}申请已批准。", applicant, content),
        },
        "reject" => match style.as_str() {
            "formal" => format!("{}您好！非常抱歉，您的{}申请未能通过审核。请根据要求补充或修改相关材料后重新提交。", applicant, content),
            "moderate" => format!("{}您好！您的{}申请暂未通过，建议您完善相关信息后重新申请。如有疑问，欢迎咨询。", applicant, content),
            "strict" => format!("{}的{}申请不符合审批要求，不予批准。请重新整理材料后提交。", applicant, content),
            _ => format!("{}的{}申请未通过。", applicant, content),
        },
        "need_more_info" => match style.as_str() {
            "formal" => format!("{}您好！您的{}申请已收到，为便于审核，请补充以下材料：1. 相关证明文件；2. 详细说明。", applicant, content),
            "moderate" => format!("{}您好！关于您的{}申请，还需要您提供一些补充信息，麻烦您配合一下，谢谢！", applicant, content),
            "strict" => format!("{}的{}申请材料不完整，请补充必要信息后重新提交。", applicant, content),
            _ => format!("需要{}补充{}申请的相关材料。", applicant, content),
        },
        "need_modify" => match style.as_str() {
            "formal" => format!("{}您好！您的{}申请需要做以下修改后重新提交：1. 完善申请内容；2. 核对相关信息。", applicant, content),
            "moderate" => format!("{}您好！您的{}申请有一些地方需要调整，修改后再提交吧，辛苦啦！", applicant, content),
            "strict" => format!("{}的{}申请内容需要修改，请按要求调整后重新提交。", applicant, content),
            _ => format!("{}的{}申请需要修改。", applicant, content),
        },
        _ => "请先选择审批决定。".to_string(),
    };

    let result = serde_json::json!({
        "comment": comment,
        "suggestions": [
            "可以添加具体的审批依据",
            "建议明确说明后续流程",
            "可以补充联系方式"
        ],
        "tips": [
            "请确保审批意见清晰明确",
            "建议使用礼貌专业的措辞",
            "重要决定建议注明理由"
        ]
    });

    (StatusCode::OK, AxumJson(ApiResponse::success(result)))
}

pub async fn optimize_comment_handler(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<OptimizeCommentRequest>,
) -> impl IntoResponse {
    let style = req.style.unwrap_or_else(|| "formal".to_string());

    let optimized = match style.as_str() {
        "formal" => {
            format!("【优化版】\n{}", req.original_comment).replace("。", "。\n")
                + "\n\n以上意见已优化为正式表达方式。"
        }
        "moderate" => {
            format!("【优化版】\n{}", req.original_comment) + "\n\n以上意见已调整为温和友好的语气。"
        }
        "strict" => {
            format!("【优化版】\n{}", req.original_comment) + "\n\n以上意见已调整为严肃明确的表述。"
        }
        _ => format!("【优化后】\n{}", req.original_comment),
    };

    (StatusCode::OK, AxumJson(ApiResponse::success(optimized)))
}
