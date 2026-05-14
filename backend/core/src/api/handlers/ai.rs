use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::info;

use crate::errors::ApiResponse;
use crate::services::image_generator::ImageGenerationRequest;
use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateImageRequest {
    pub prompt: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub num_images: Option<u32>,
    pub style: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateImageResponse {
    pub images: Vec<String>,
    pub backend: String,
    pub prompt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiServiceStatus {
    pub together_ai: bool,
    pub huggingface: bool,
    pub available_backends: Vec<String>,
}

pub async fn generate_image_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<GenerateImageRequest>,
) -> impl IntoResponse {
    info!("收到文生图请求: {}", req.prompt);

    if req.prompt.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<GenerateImageResponse>::error(
                "提示词不能为空",
            )),
        );
    }

    let request = ImageGenerationRequest {
        prompt: req.prompt.clone(),
        width: req.width,
        height: req.height,
        num_images: req.num_images,
        style: req.style,
    };

    match state.image_generator.generate_image(request).await {
        Ok(response) => (
            StatusCode::OK,
            Json(ApiResponse::success(GenerateImageResponse {
                images: response.images,
                backend: response.backend,
                prompt: response.prompt,
            })),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<GenerateImageResponse>::error(e.to_string())),
        ),
    }
}

pub async fn get_ai_status_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let together_ai = !state.config.together_api_key.is_empty();
    let huggingface = !state.config.huggingface_api_key.is_empty();

    let mut available_backends = Vec::new();
    if together_ai {
        available_backends.push("TogetherAI".to_string());
    }
    if huggingface {
        available_backends.push("HuggingFace".to_string());
    }
    available_backends.push("Placeholder".to_string());

    let status = AiServiceStatus {
        together_ai,
        huggingface,
        available_backends,
    };

    (StatusCode::OK, Json(ApiResponse::success(status)))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizeDocumentRequest {
    pub content: String,
    pub doc_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizeDocumentResponse {
    pub suggested: String,
    pub improved: bool,
}

pub async fn optimize_document_handler(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<OptimizeDocumentRequest>,
) -> impl IntoResponse {
    info!("收到文档优化请求");

    let doc_type = req.doc_type.unwrap_or_else(|| "user_guide".to_string());
    
    let optimized_content = match doc_type.as_str() {
        "user_guide" => format!(
            "# 文档内容\n\n{}\n\n---\n\n**优化建议：**\n- 建议添加目录结构\n- 增加代码示例\n- 添加相关链接\n- 考虑分章节说明",
            req.content
        ),
        "article" => format!(
            "# 文章内容\n\n{}\n\n---\n\n**优化建议：**\n- 建议添加引言部分\n- 增加相关图片\n- 添加引用来源\n- 考虑添加作者信息",
            req.content
        ),
        "report" => format!(
            "# 报告内容\n\n{}\n\n---\n\n**优化建议：**\n- 建议添加摘要\n- 增加数据图表\n- 添加附录说明\n- 考虑添加目录",
            req.content
        ),
        _ => format!(
            "# 优化后内容\n\n{}\n\n---\n\n**优化建议：**\n- 根据文档类型进行针对性优化\n- 添加必要的格式和结构",
            req.content
        ),
    };

    let response = OptimizeDocumentResponse {
        suggested: optimized_content,
        improved: true,
    };

    (StatusCode::OK, Json(ApiResponse::success(response)))
}
