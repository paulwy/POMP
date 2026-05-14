use crate::config::Config;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{error, info};

#[derive(Debug, Serialize, Deserialize)]
pub struct TextGenerationRequest {
    pub prompt: String,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub model: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TextGenerationResponse {
    pub text: String,
    pub backend: String,
    pub model: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
    options: OllamaOptions,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaOptions {
    temperature: f32,
    num_predict: i32,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaResponse {
    response: String,
}

pub struct TextGenerator {
    config: Config,
    client: Client,
}

impl TextGenerator {
    pub fn new(config: Config) -> Self {
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(120))
            .build()
            .unwrap_or_else(|_| Client::new());
        
        Self {
            config,
            client,
        }
    }

    pub async fn generate_text(
        &self,
        request: TextGenerationRequest,
    ) -> anyhow::Result<TextGenerationResponse> {
        let model = request.model.clone()
            .unwrap_or_else(|| self.config.ollama_model.clone());
        let max_tokens = request.max_tokens.unwrap_or(500);
        let temperature = request.temperature.unwrap_or(0.7);
        let endpoint = &self.config.ollama_api_url;

        info!("使用本地 AI 生成文本，模型: {}, 端点: {}", model, endpoint);

        let ollama_request = OllamaRequest {
            model: model.clone(),
            prompt: request.prompt,
            stream: false,
            options: OllamaOptions {
                temperature,
                num_predict: max_tokens as i32,
            },
        };

        let client = &self.client;
        let url = format!("{}/api/generate", endpoint);
        
        let response = client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&ollama_request)
            .send()
            .await?;

        if response.status().is_success() {
            let ollama_response: OllamaResponse = response.json().await?;
            return Ok(TextGenerationResponse {
                text: ollama_response.response,
                backend: "LocalAI".to_string(),
                model,
            });
        } else {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            error!("本地 AI API 错误: {} - {}", status, body);
            return Err(anyhow::anyhow!(
                "Local AI API error: {} - {}",
                status,
                body
            ));
        }
    }

    pub fn is_available(&self) -> bool {
        !self.config.ollama_api_url.is_empty()
    }
}
