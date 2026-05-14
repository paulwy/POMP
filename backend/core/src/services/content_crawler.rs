use reqwest::Client;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use tracing::info;

use crate::errors::{AppError, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrawlRequest {
    pub url: String,
    pub enable_ai_summary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrawlResult {
    pub url: String,
    pub title: Option<String>,
    pub content: Option<String>,
    pub images: Vec<String>,
    pub summary: Option<String>,
    pub status: String,
}

pub struct ContentCrawlerService {
    client: Client,
}

impl Default for ContentCrawlerService {
    fn default() -> Self {
        Self::new()
    }
}

impl ContentCrawlerService {
    pub fn new() -> Self {
        let client = Client::builder()
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");

        Self { client }
    }

    pub async fn crawl_url(&self, request: CrawlRequest) -> Result<CrawlResult> {
        info!("开始抓取URL: {}", request.url);

        let response = self
            .client
            .get(&request.url)
            .send()
            .await
            .map_err(|e| AppError::ExternalService(format!("请求失败: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::ExternalService(format!(
                "HTTP错误: {}",
                response.status()
            )));
        }

        let body = response
            .text()
            .await
            .map_err(|e| AppError::ExternalService(format!("读取响应失败: {}", e)))?;

        let html = Html::parse_document(&body);

        let title = self.extract_title(&html);
        let content = self.extract_content(&html);
        let images = self.extract_images(&html, &request.url);

        info!(
            "抓取完成: URL={}, Title={}",
            request.url,
            title.clone().unwrap_or_default()
        );

        Ok(CrawlResult {
            url: request.url,
            title,
            content,
            images,
            summary: None,
            status: "success".to_string(),
        })
    }

    fn extract_title(&self, html: &Html) -> Option<String> {
        let selector = Selector::parse("title").ok()?;
        html.select(&selector).next().map(|el| el.text().collect())
    }

    fn extract_content(&self, html: &Html) -> Option<String> {
        let selectors = [
            "article",
            "main",
            ".article-content",
            ".post-content",
            "div.content",
            "div.main-content",
        ];

        for selector_str in selectors {
            if let Ok(selector) = Selector::parse(selector_str) {
                if let Some(element) = html.select(&selector).next() {
                    let text: String = element.text().collect();
                    if text.len() > 100 {
                        return Some(text);
                    }
                }
            }
        }

        let body_selector = Selector::parse("body").ok()?;
        html.select(&body_selector)
            .next()
            .map(|el| el.text().collect())
    }

    fn extract_images(&self, html: &Html, base_url: &str) -> Vec<String> {
        let selector = match Selector::parse("img") {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };

        let mut images = Vec::new();

        for img in html.select(&selector) {
            if let Some(src) = img.value().attr("src") {
                let url = if src.starts_with("http") {
                    src.to_string()
                } else {
                    match url::Url::parse(base_url) {
                        Ok(base) => base.join(src).map(|u| u.to_string()).unwrap_or_default(),
                        Err(_) => continue,
                    }
                };
                if !url.is_empty() {
                    images.push(url);
                }
            }
        }

        images
    }
}
