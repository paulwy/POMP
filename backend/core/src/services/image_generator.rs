use crate::config::Config;
use crate::errors::{AppError, Result};
use base64::Engine;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{error, info};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ImageBackend {
    TogetherAI,
    HuggingFace,
    Placeholder,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageGenerationRequest {
    pub prompt: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub num_images: Option<u32>,
    pub style: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageGenerationResponse {
    pub images: Vec<String>,
    pub backend: String,
    pub prompt: String,
}

#[derive(Debug, thiserror::Error)]
pub enum ImageGeneratorError {
    #[error("后端不可用: {0}")]
    BackendUnavailable(String),
    #[error("API请求失败: {0}")]
    ApiRequestFailed(String),
    #[error("API响应解析失败: {0}")]
    ResponseParseFailed(String),
    #[error("没有可用的后端")]
    NoAvailableBackend,
}

#[derive(Debug, Serialize, Deserialize)]
struct TogetherAIRequest {
    model: String,
    prompt: String,
    width: u32,
    height: u32,
    steps: u32,
    n: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct TogetherAIResponse {
    data: Option<Vec<TogetherAIImage>>,
    error: Option<TogetherAIError>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TogetherAIImage {
    url: String,
    b64_json: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TogetherAIError {
    message: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct HuggingFaceRequest {
    inputs: String,
    parameters: serde_json::Value,
}

pub struct ImageGenerator {
    config: Config,
    client: Client,
}

impl ImageGenerator {
    pub fn new(config: Config) -> Self {
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(60))
            .build()
            .unwrap_or_else(|_| Client::new());
        Self { config, client }
    }

    pub async fn generate_image(
        &self,
        request: ImageGenerationRequest,
    ) -> Result<ImageGenerationResponse> {
        let backends = self.get_available_backends();
        let width = request.width.unwrap_or(1024);
        let height = request.height.unwrap_or(1024);
        let num_images = request.num_images.unwrap_or(1);

        for &backend in &backends {
            match self
                .generate_with_backend(&request, backend, width, height, num_images)
                .await
            {
                Ok(response) => return Ok(response),
                Err(e) => {
                    error!("后端 {} 失败: {}", self.backend_name(backend), e);
                    continue;
                }
            }
        }

        Err(AppError::ExternalService(
            "所有AI图像生成服务都不可用，请检查API密钥配置".to_string(),
        ))
    }

    fn get_available_backends(&self) -> Vec<ImageBackend> {
        let mut backends = Vec::new();

        if !self.config.together_api_key.is_empty() {
            backends.push(ImageBackend::TogetherAI);
        }

        if !self.config.huggingface_api_key.is_empty() {
            backends.push(ImageBackend::HuggingFace);
        }

        backends.push(ImageBackend::Placeholder);

        backends
    }

    fn backend_name(&self, backend: ImageBackend) -> &'static str {
        match backend {
            ImageBackend::TogetherAI => "TogetherAI",
            ImageBackend::HuggingFace => "HuggingFace",
            ImageBackend::Placeholder => "Placeholder",
        }
    }

    async fn generate_with_backend(
        &self,
        request: &ImageGenerationRequest,
        backend: ImageBackend,
        width: u32,
        height: u32,
        num_images: u32,
    ) -> std::result::Result<ImageGenerationResponse, ImageGeneratorError> {
        match backend {
            ImageBackend::TogetherAI => {
                self.generate_with_together(request, width, height, num_images)
                    .await
            }
            ImageBackend::HuggingFace => {
                self.generate_with_huggingface(request, width, height, num_images)
                    .await
            }
            ImageBackend::Placeholder => Ok(self.generate_placeholder(request, width, height)),
        }
    }

    async fn generate_with_together(
        &self,
        request: &ImageGenerationRequest,
        width: u32,
        height: u32,
        num_images: u32,
    ) -> std::result::Result<ImageGenerationResponse, ImageGeneratorError> {
        let url = format!("{}/v1/images/generations", self.config.together_api_url);

        let req_body = TogetherAIRequest {
            model: self.config.ai_image_model.clone(),
            prompt: request.prompt.clone(),
            width,
            height,
            steps: 4,
            n: num_images,
        };

        info!("调用 TogetherAI API: {}", url);

        let response = self
            .client
            .post(&url)
            .bearer_auth(&self.config.together_api_key)
            .json(&req_body)
            .send()
            .await
            .map_err(|e| ImageGeneratorError::ApiRequestFailed(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("TogetherAI API 错误 ({}): {}", status, text);
            return Err(ImageGeneratorError::ApiRequestFailed(format!(
                "HTTP {}: {}",
                status, text
            )));
        }

        let together_response: TogetherAIResponse = response
            .json()
            .await
            .map_err(|e| ImageGeneratorError::ResponseParseFailed(e.to_string()))?;

        if let Some(err) = together_response.error {
            return Err(ImageGeneratorError::ApiRequestFailed(err.message));
        }

        let images = together_response
            .data
            .ok_or_else(|| ImageGeneratorError::ResponseParseFailed("没有返回数据".to_string()))?
            .into_iter()
            .map(|img| img.url)
            .collect();

        Ok(ImageGenerationResponse {
            images,
            backend: "TogetherAI".to_string(),
            prompt: request.prompt.clone(),
        })
    }

    async fn generate_with_huggingface(
        &self,
        request: &ImageGenerationRequest,
        width: u32,
        height: u32,
        _num_images: u32,
    ) -> std::result::Result<ImageGenerationResponse, ImageGeneratorError> {
        let model = "stabilityai/stable-diffusion-xl-base-1.0";
        let url = format!("{}/models/{}", self.config.huggingface_api_url, model);

        let req_body = HuggingFaceRequest {
            inputs: request.prompt.clone(),
            parameters: serde_json::json!({
                "width": width,
                "height": height,
                "num_inference_steps": 20,
            }),
        };

        info!("调用 HuggingFace API: {}", url);

        let response = self
            .client
            .post(&url)
            .bearer_auth(&self.config.huggingface_api_key)
            .json(&req_body)
            .send()
            .await
            .map_err(|e| ImageGeneratorError::ApiRequestFailed(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            error!("HuggingFace API 错误 ({}): {}", status, text);
            return Err(ImageGeneratorError::ApiRequestFailed(format!(
                "HTTP {}: {}",
                status, text
            )));
        }

        let bytes = response
            .bytes()
            .await
            .map_err(|e| ImageGeneratorError::ResponseParseFailed(e.to_string()))?;

        let b64_image = base64::engine::general_purpose::STANDARD.encode(&bytes);
        let data_url = format!("data:image/png;base64,{}", b64_image);

        Ok(ImageGenerationResponse {
            images: vec![data_url],
            backend: "HuggingFace".to_string(),
            prompt: request.prompt.clone(),
        })
    }

    fn generate_placeholder(
        &self,
        request: &ImageGenerationRequest,
        width: u32,
        height: u32,
    ) -> ImageGenerationResponse {
        let color = Self::string_to_color(&request.prompt);
        let placeholder = format!(
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='{}' height='{}'%3E%3Crect fill='{}' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='24'%3E{}%3C/text%3E%3C/svg%3E",
            width,
            height,
            color,
            urlencoding::encode(&request.prompt[..request.prompt.len().min(20)])
        );

        ImageGenerationResponse {
            images: vec![placeholder],
            backend: "Placeholder".to_string(),
            prompt: request.prompt.clone(),
        }
    }

    fn string_to_color(s: &str) -> String {
        let hash = s
            .bytes()
            .fold(0u32, |acc, b| acc.wrapping_mul(31).wrapping_add(b as u32));
        let r = (hash & 0xFF) as u8;
        let g = ((hash >> 8) & 0xFF) as u8;
        let b = ((hash >> 16) & 0xFF) as u8;
        format!("#{:02x}{:02x}{:02x}", r, g, b)
    }
}
