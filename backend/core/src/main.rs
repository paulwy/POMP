use sksfems_backend::{routes, AppState, Config};
use sksfems_backend::db::create_db_pool;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv::dotenv().ok();
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::load()?;
    let db_pool = create_db_pool(&config.database_url).await?;

    let state = Arc::new(AppState {
        config: Arc::new(config.clone()),
        db: db_pool.clone(),
        redis: Arc::new(redis::Client::open(config.redis_url.clone())?),
        image_generator: Arc::new(sksfems_backend::services::image_generator::ImageGenerator::new(config.clone())),
        text_generator: Arc::new(sksfems_backend::services::text_generator::TextGenerator::new(config.clone())),
        field_service: Arc::new(sksfems_backend::services::field_service::FieldService::new(db_pool.clone(), config.clone())),
        dict_service: Arc::new(sksfems_backend::services::dict_service::DictService::new(db_pool.clone())),
        help_service: Arc::new(sksfems_backend::services::help_service::HelpService::new(db_pool.clone())),
        contract_service: Arc::new(sksfems_backend::services::contract_service::ContractService::new(db_pool.clone())),
    });

    let app = routes(state).layer(
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any),
    );

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], config.server_port));
    tracing::info!("Listening on 0.0.0.0:{}", config.server_port);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
