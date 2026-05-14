use reqwest::{multipart, Client};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone)]
pub struct CloudflareConfig {
    pub account_id: String,
    pub api_token: String,
    pub project_name: String,
    pub production_branch: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeploymentResponse {
    pub id: String,
    pub status: String,
    pub url: Option<String>,
}

#[derive(Debug, Serialize)]
struct CreateDeploymentRequest {
    pub project_name: String,
    pub manifest: Manifest,
}

#[derive(Debug, Serialize)]
struct Manifest {
    pub version: String,
    pub build_config: BuildConfig,
    pub metadata: Metadata,
}

#[derive(Debug, Serialize)]
struct BuildConfig {
    pub build_command: String,
    pub destination_dir: String,
    pub root_dir: String,
    pub web_analytics_tag: Option<String>,
    pub web_analytics_token: Option<String>,
}

#[derive(Debug, Serialize)]
struct Metadata {
    pub branch: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct CloudflareApiResponse<T> {
    pub result: T,
    pub success: bool,
    pub errors: Vec<serde_json::Value>,
    pub messages: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct CreateDeploymentResponse {
    pub id: String,
    pub url: Option<String>,
    pub latest_stage: LatestStage,
}

#[derive(Debug, Serialize, Deserialize)]
struct LatestStage {
    pub status: String,
}

pub struct CloudflarePublisher {
    config: CloudflareConfig,
    client: Client,
}

impl CloudflarePublisher {
    pub fn new(config: CloudflareConfig) -> Self {
        Self {
            config,
            client: Client::new(),
        }
    }

    pub async fn deploy_archive(
        &self,
        zip_path: &Path,
        _commit_message: Option<String>,
    ) -> Result<DeploymentResponse, anyhow::Error> {
        let account_id = &self.config.account_id;
        let project_name = &self.config.project_name;
        let branch = self
            .config
            .production_branch
            .clone()
            .unwrap_or_else(|| "main".to_string());

        let upload_url = format!(
            "https://api.cloudflare.com/client/v4/accounts/{}/pages/projects/{}/deployments",
            account_id, project_name
        );

        let file = tokio::fs::read(zip_path).await?;

        let manifest = Manifest {
            version: "1".to_string(),
            build_config: BuildConfig {
                build_command: "".to_string(),
                destination_dir: "".to_string(),
                root_dir: "".to_string(),
                web_analytics_tag: None,
                web_analytics_token: None,
            },
            metadata: Metadata { branch },
        };

        let manifest_json = serde_json::to_string(&manifest)?;

        let form = multipart::Form::new()
            .part("manifest", multipart::Part::text(manifest_json))
            .part(
                "content",
                multipart::Part::bytes(file)
                    .file_name("archive.zip")
                    .mime_str("application/zip")?,
            );

        let response = self
            .client
            .post(&upload_url)
            .header("Authorization", format!("Bearer {}", self.config.api_token))
            .multipart(form)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow::anyhow!("Deployment failed: {}", error_text));
        }

        let status = response.status();
        let response_text = response.text().await?;

        tracing::info!("Cloudflare response status: {}", status);
        tracing::info!("Cloudflare response body: {}", response_text);

        let api_response: CloudflareApiResponse<CreateDeploymentResponse> =
            match serde_json::from_str(&response_text) {
                Ok(d) => d,
                Err(e) => {
                    return Err(anyhow::anyhow!(
                        "Failed to parse deployment response: {}, body: {}",
                        e,
                        response_text
                    ));
                }
            };

        if !api_response.success {
            return Err(anyhow::anyhow!(
                "Deployment failed: {:?}",
                api_response.errors
            ));
        }

        Ok(DeploymentResponse {
            id: api_response.result.id,
            status: api_response.result.latest_stage.status,
            url: api_response.result.url,
        })
    }

    pub async fn get_deployments(&self) -> Result<Vec<DeploymentResponse>, anyhow::Error> {
        let account_id = &self.config.account_id;
        let project_name = &self.config.project_name;

        let url = format!(
            "https://api.cloudflare.com/client/v4/accounts/{}/pages/projects/{}/deployments",
            account_id, project_name
        );

        let response = self
            .client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_token))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow::anyhow!("Failed to get deployments: {}", error_text));
        }

        let response_text = response.text().await?;
        let list_response: CloudflareApiResponse<Vec<CreateDeploymentResponse>> =
            match serde_json::from_str(&response_text) {
                Ok(d) => d,
                Err(e) => {
                    return Err(anyhow::anyhow!(
                        "Failed to parse deployments response: {}, body: {}",
                        e,
                        response_text
                    ));
                }
            };

        if !list_response.success {
            return Err(anyhow::anyhow!(
                "Failed to get deployments: {:?}",
                list_response.errors
            ));
        }

        Ok(list_response
            .result
            .into_iter()
            .map(|d| DeploymentResponse {
                id: d.id,
                status: d.latest_stage.status,
                url: d.url,
            })
            .collect())
    }
}
