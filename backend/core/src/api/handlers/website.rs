use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get_service,
};
use chrono::{Datelike, Utc};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::Mutex;
use walkdir::WalkDir;

use crate::errors::ApiResponse;
use crate::services::cloudflare_publisher::{CloudflareConfig, CloudflarePublisher};
use crate::AppState;
use tower_http::services::ServeDir;

lazy_static::lazy_static! {
    static ref PREVIEW_STATE: Mutex<Option<PreviewState>> = Mutex::new(None);
}

struct PreviewState {
    port: u16,
    path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WebsiteSettings {
    pub site_name: String,
    pub site_description: String,
    pub logo_url: String,
    pub primary_color: String,
    pub secondary_color: String,
    pub contact_email: String,
    pub contact_phone: String,
    pub contact_address: String,
    pub social_links: std::collections::HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebsiteDeployment {
    pub id: String,
    pub status: String,
    pub target: String,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub url: Option<String>,
    pub error_message: Option<String>,
    pub triggered_by: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWebsiteSettings {
    pub site_name: String,
    pub site_description: String,
    pub logo_url: String,
    pub primary_color: String,
    pub secondary_color: String,
    pub contact_email: String,
    pub contact_phone: String,
    pub contact_address: String,
    pub social_links: std::collections::HashMap<String, String>,
}

#[derive(Debug, Deserialize)]
pub struct DeployWebsiteRequest {
    pub target: String,
    pub commit_message: Option<String>,
    pub settings: Option<WebsiteSettings>,
}

#[derive(Debug, Deserialize)]
pub struct GenerateWebsiteRequest {
    pub settings: Option<WebsiteSettings>,
}

pub async fn get_website_settings_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match sqlx::query!(
        r#"SELECT id, site_name, site_description, logo_url, primary_color, secondary_color, contact_email, contact_phone, contact_address, social_links FROM site_settings LIMIT 1"#
    )
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some(r)) => {
            let settings = WebsiteSettings {
                site_name: r.site_name,
                site_description: r.site_description.unwrap_or_default(),
                logo_url: r.logo_url.unwrap_or_default(),
                primary_color: r.primary_color.unwrap_or_else(|| "#3b82f6".to_string()),
                secondary_color: r.secondary_color.unwrap_or_else(|| "#1e40af".to_string()),
                contact_email: r.contact_email.unwrap_or_default(),
                contact_phone: r.contact_phone.unwrap_or_default(),
                contact_address: r.contact_address.unwrap_or_default(),
                social_links: r.social_links.map(|s| {
                    serde_json::from_value(s).unwrap_or_default()
                }).unwrap_or_default(),
            };
            (StatusCode::OK, axum::Json(ApiResponse::success(settings)))
        }
        Ok(None) => {
            let settings = WebsiteSettings {
                site_name: "三楷深发科技".to_string(),
                site_description: "专业的科技服务提供商".to_string(),
                logo_url: "/assets/logo.png".to_string(),
                primary_color: "#3b82f6".to_string(),
                secondary_color: "#1e40af".to_string(),
                contact_email: "contact@example.com".to_string(),
                contact_phone: "400-XXX-XXXX".to_string(),
                contact_address: "河北省石家庄市".to_string(),
                social_links: std::collections::HashMap::new(),
            };
            (StatusCode::OK, axum::Json(ApiResponse::success(settings)))
        }
        Err(e) => {
            tracing::error!("Error fetching website settings: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, axum::Json(ApiResponse::error("获取网站设置失败".to_string())))
        }
    }
}

pub async fn update_website_settings_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<UpdateWebsiteSettings>,
) -> impl IntoResponse {
    let social_links_json =
        serde_json::to_value(&req.social_links).unwrap_or(serde_json::json!({}));

    match sqlx::query!(
        r#"UPDATE site_settings SET 
            site_name = $1, 
            site_description = $2, 
            logo_url = $3, 
            primary_color = $4, 
            secondary_color = $5, 
            contact_email = $6, 
            contact_phone = $7, 
            contact_address = $8, 
            social_links = $9,
            updated_at = $10
        WHERE id = (SELECT id FROM site_settings LIMIT 1)"#,
        req.site_name,
        req.site_description,
        req.logo_url,
        req.primary_color,
        req.secondary_color,
        req.contact_email,
        req.contact_phone,
        req.contact_address,
        social_links_json,
        Utc::now()
    )
    .execute(&state.db)
    .await
    {
        Ok(result) => {
            if result.rows_affected() == 0 {
                sqlx::query!(
                    r#"INSERT INTO site_settings (site_name, site_description, logo_url, primary_color, secondary_color, contact_email, contact_phone, contact_address, social_links) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)"#,
                    req.site_name,
                    req.site_description,
                    req.logo_url,
                    req.primary_color,
                    req.secondary_color,
                    req.contact_email,
                    req.contact_phone,
                    req.contact_address,
                    social_links_json
                )
                .execute(&state.db)
                .await
                .ok();
            }
            let settings = WebsiteSettings {
                site_name: req.site_name,
                site_description: req.site_description,
                logo_url: req.logo_url,
                primary_color: req.primary_color,
                secondary_color: req.secondary_color,
                contact_email: req.contact_email,
                contact_phone: req.contact_phone,
                contact_address: req.contact_address,
                social_links: req.social_links,
            };
            (StatusCode::OK, axum::Json(ApiResponse::success(settings)))
        }
        Err(e) => {
            tracing::error!("Error updating website settings: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                axum::Json(ApiResponse::error("更新网站设置失败".to_string())),
            )
        }
    }
}

pub async fn generate_website_handler(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<GenerateWebsiteRequest>,
) -> impl IntoResponse {
    let settings = req.settings.unwrap_or_default();

    let result = serde_json::json!({
        "status": "generated",
        "output_path": "/tmp/website-output",
        "site_name": settings.site_name,
    });

    (StatusCode::OK, axum::Json(ApiResponse::success(result)))
}

async fn find_available_port(start_port: u16) -> Option<u16> {
    for port in start_port..start_port + 100 {
        match tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port)).await {
            Ok(_) => return Some(port),
            Err(_) => continue,
        }
    }
    None
}

pub async fn preview_website_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<GenerateWebsiteRequest>,
) -> impl IntoResponse {
    let settings = req.settings.unwrap_or_default();

    let preview_port = match find_available_port(8081).await {
        Some(port) => port,
        None => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                axum::Json(ApiResponse::error("无法找到可用的预览端口".to_string())),
            );
        }
    };

    let preview_url = format!("http://localhost:{}", preview_port);

    let temp_dir = tempfile::tempdir().unwrap();
    let output_path = temp_dir.path().to_path_buf();
    let output_path_str = output_path.to_string_lossy().to_string();

    let articles = get_public_articles(&state.db).await.unwrap_or_default();

    generate_static_website(&output_path, &settings, &articles);

    *PREVIEW_STATE.lock().unwrap() = Some(PreviewState {
        port: preview_port,
        path: output_path_str.clone(),
    });

    tokio::spawn(async move {
        let _temp_dir = temp_dir;
        let listener =
            match tokio::net::TcpListener::bind(format!("127.0.0.1:{}", preview_port)).await {
                Ok(l) => l,
                Err(e) => {
                    eprintln!("Failed to bind preview server: {}", e);
                    return;
                }
            };

        let app =
            axum::Router::new().fallback_service(get_service(ServeDir::new(&output_path_str)));

        if let Err(e) = axum::serve(listener, app).await {
            eprintln!("Preview server error: {}", e);
        }
    });

    tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;

    let result = serde_json::json!({
        "status": "preview_ready",
        "preview_url": preview_url,
        "output_path": output_path.to_str(),
    });

    (StatusCode::OK, axum::Json(ApiResponse::success(result)))
}

#[derive(Debug, Clone, Serialize)]
struct ArticleSummary {
    id: String,
    title: String,
    summary: String,
    cover_image: Option<String>,
    published_at: Option<String>,
}

async fn get_public_articles(db: &sqlx::PgPool) -> Result<Vec<ArticleSummary>, sqlx::Error> {
    let articles = sqlx::query!(
        r#"SELECT id, title, summary, cover_image, published_at 
           FROM cms_articles 
           WHERE status = 'published' 
           ORDER BY is_top DESC, published_at DESC 
           LIMIT 6"#
    )
    .fetch_all(db)
    .await?;

    let result: Vec<ArticleSummary> = articles
        .into_iter()
        .map(|a| ArticleSummary {
            id: a.id.to_string(),
            title: a.title,
            summary: a.summary.unwrap_or_default(),
            cover_image: a.cover_image,
            published_at: a.published_at.map(|dt| dt.format("%Y-%m-%d").to_string()),
        })
        .collect();

    Ok(result)
}

fn generate_static_website(output_path: &std::path::Path, settings: &WebsiteSettings, articles: &[ArticleSummary]) {
    std::fs::create_dir_all(output_path).unwrap();

    let articles_html = if articles.is_empty() {
        r#"
            <div class="card">
                <h3>暂无文章</h3>
                <p>暂无发布的文章内容。</p>
            </div>
        "#.to_string()
    } else {
        articles
            .iter()
            .map(|article| format!(
                r#"
            <article class="card">
                {}
                <h3>{}</h3>
                <p>{}</p>
                {}
            </article>
                "#,
                if let Some(img) = &article.cover_image {
                    format!("<img src=\"{}\" alt=\"{}\" class=\"article-cover\" />", img, article.title)
                } else {
                    "".to_string()
                },
                article.title,
                article.summary,
                if let Some(date) = &article.published_at {
                    format!("<p class=\"article-date\">发布于 {}</p>", date)
                } else {
                    "".to_string()
                }
            ))
            .collect::<Vec<_>>()
            .join("\n")
    };

    let html_content = format!(
        r#"
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{}</title>
    <meta name="description" content="{}">
    <style>
        :root {{
            --primary-color: {};
            --secondary-color: {};
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
        }}
        header {{
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }}
        h1 {{
            margin: 0;
            font-size: 1.8rem;
        }}
        .hero {{
            text-align: center;
            padding: 4rem 2rem;
            background: #f8fafc;
        }}
        .hero h2 {{
            color: var(--primary-color);
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }}
        .content {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            margin-top: 2rem;
        }}
        .card {{
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
        }}
        .card h3 {{
            color: var(--secondary-color);
            margin-top: 0;
        }}
        .article-cover {{
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-radius: 4px;
            margin-bottom: 1rem;
        }}
        .article-date {{
            font-size: 0.85rem;
            color: #6b7280;
            margin-top: 1rem;
        }}
        footer {{
            background: #1e293b;
            color: white;
            text-align: center;
            padding: 2rem;
            margin-top: 4rem;
        }}
        .contact {{
            margin-top: 1rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }}
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>{}</h1>
        </div>
    </header>
    
    <main>
        <section class="hero">
            <h2>欢迎来到 {}</h2>
            <p>{}</p>
        </section>
        
        <div class="container">
            <h2 style="color: var(--primary-color);">最新文章</h2>
            <div class="content">
                {}
            </div>
        </div>
        
        <div class="container content" style="grid-template-columns: repeat(3, 1fr);">
            <div class="card">
                <h3>关于我们</h3>
                <p>我们是一家专业的科技服务提供商，致力于为客户提供优质的产品和服务。</p>
            </div>
            <div class="card">
                <h3>核心业务</h3>
                <p>涵盖多个领域，包括技术咨询、产品开发、系统集成等服务。</p>
            </div>
            <div class="card">
                <h3>联系我们</h3>
                <p>邮箱: {}<br>电话: {}<br>地址: {}</p>
            </div>
        </div>
    </main>
    
    <footer>
        <p>&copy; {} {} - 版权所有</p>
        <div class="contact">
            <p>联系邮箱: {} | 联系电话: {}</p>
        </div>
    </footer>
</body>
</html>
        "#,
        settings.site_name,
        settings.site_description,
        settings.primary_color,
        settings.secondary_color,
        settings.site_name,
        settings.site_name,
        settings.site_description,
        articles_html,
        settings.contact_email,
        settings.contact_phone,
        settings.contact_address,
        chrono::Utc::now().year(),
        settings.site_name,
        settings.contact_email,
        settings.contact_phone,
    );

    std::fs::write(output_path.join("index.html"), html_content).unwrap();

    let assets_dir = output_path.join("assets");
    std::fs::create_dir_all(&assets_dir).unwrap();

    let css_content = r#"
* {
    box-sizing: border-box;
}
body {
    line-height: 1.6;
}
"#;
    std::fs::write(assets_dir.join("style.css"), css_content).unwrap();

    let js_content = r#"
document.addEventListener('DOMContentLoaded', () => {
    console.log('Website loaded successfully');
});
"#;
    std::fs::write(assets_dir.join("main.js"), js_content).unwrap();
}

fn create_zip_archive(source_dir: &Path) -> Result<PathBuf, anyhow::Error> {
    let zip_path = tempfile::NamedTempFile::new()?
        .into_temp_path()
        .to_path_buf();
    let zip_file = std::fs::File::create(&zip_path)?;

    let mut zip = zip::ZipWriter::new(zip_file);
    let options = zip::write::FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    for entry in WalkDir::new(source_dir) {
        let entry = entry?;
        let path = entry.path();
        let name = path.strip_prefix(source_dir).unwrap();

        if path.is_file() {
            zip.start_file(name.to_string_lossy(), options)?;
            let content = std::fs::read(path)?;
            use std::io::Write;
            zip.write_all(&content)?;
        } else if !name.as_os_str().is_empty() {
            zip.add_directory(name.to_string_lossy(), options)?;
        }
    }

    zip.finish()?;

    Ok(zip_path)
}

pub async fn deploy_website_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<DeployWebsiteRequest>,
) -> impl IntoResponse {
    let settings = req.settings.clone().unwrap_or_default();

    let account_id = match std::env::var("CLOUDFLARE_ACCOUNT_ID") {
        Ok(v) if !v.is_empty() => v,
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiResponse::error(
                    "Cloudflare ACCOUNT_ID 未配置".to_string(),
                )),
            );
        }
    };

    let api_token = match std::env::var("CLOUDFLARE_API_TOKEN") {
        Ok(v) if !v.is_empty() => v,
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiResponse::error(
                    "Cloudflare API_TOKEN 未配置".to_string(),
                )),
            );
        }
    };

    let project_name = match std::env::var("CLOUDFLARE_PROJECT_NAME") {
        Ok(v) if !v.is_empty() => v,
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                axum::Json(ApiResponse::error(
                    "Cloudflare PROJECT_NAME 未配置".to_string(),
                )),
            );
        }
    };

    let temp_dir = match tempfile::tempdir() {
        Ok(d) => d,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                axum::Json(ApiResponse::error(format!("创建临时目录失败: {}", e))),
            );
        }
    };

    let output_path = temp_dir.path().to_path_buf();
    let articles = get_public_articles(&state.db).await.unwrap_or_default();
    generate_static_website(&output_path, &settings, &articles);

    let zip_path = match create_zip_archive(&output_path) {
        Ok(p) => p,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                axum::Json(ApiResponse::error(format!("创建压缩包失败: {}", e))),
            );
        }
    };

    let cloudflare_config = CloudflareConfig {
        account_id,
        api_token,
        project_name,
        production_branch: Some("main".to_string()),
    };

    let publisher = CloudflarePublisher::new(cloudflare_config);

    let deployment_response = match publisher
        .deploy_archive(&zip_path, req.commit_message)
        .await
    {
        Ok(d) => d,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                axum::Json(ApiResponse::error(format!("部署失败: {}", e))),
            );
        }
    };

    let deployment = WebsiteDeployment {
        id: deployment_response.id,
        status: deployment_response.status,
        target: req.target,
        started_at: Utc::now().to_rfc3339(),
        completed_at: Some(Utc::now().to_rfc3339()),
        url: deployment_response.url,
        error_message: None,
        triggered_by: "admin".to_string(),
    };

    (
        StatusCode::CREATED,
        axum::Json(ApiResponse::success(deployment)),
    )
}

pub async fn get_website_deployments_handler(
    State(_state): State<Arc<AppState>>,
) -> impl IntoResponse {
    let deployments = vec![WebsiteDeployment {
        id: "d001".to_string(),
        status: "success".to_string(),
        target: "cloudflare".to_string(),
        started_at: (Utc::now() - chrono::Duration::days(3)).to_rfc3339(),
        completed_at: Some((Utc::now() - chrono::Duration::days(3)).to_rfc3339()),
        url: Some("https://example.com".to_string()),
        error_message: None,
        triggered_by: "user1".to_string(),
    }];
    (
        StatusCode::OK,
        axum::Json(ApiResponse::success(deployments)),
    )
}
