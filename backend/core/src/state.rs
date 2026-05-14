use crate::config::Config;
use crate::db::user::CreateUser;
use crate::db::user_repo;
use crate::db::DbPool;
use crate::services::contract_service::ContractService;
use crate::services::dict_service::DictService;
use crate::services::field_service::FieldService;
use crate::services::help_service::HelpService;
use crate::services::image_generator::ImageGenerator;
use crate::services::text_generator::TextGenerator;
use bcrypt::{hash, DEFAULT_COST};
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub db: DbPool,
    pub redis: Arc<redis::Client>,
    pub image_generator: Arc<ImageGenerator>,
    pub text_generator: Arc<TextGenerator>,
    pub field_service: Arc<FieldService>,
    pub dict_service: Arc<DictService>,
    pub help_service: Arc<HelpService>,
    pub contract_service: Arc<ContractService>,
}

impl AppState {
    pub fn builder() -> AppStateBuilder {
        AppStateBuilder::new()
    }
}

pub struct AppStateBuilder {
    config: Option<Config>,
    db: Option<DbPool>,
    redis: Option<redis::Client>,
}

impl Default for AppStateBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl AppStateBuilder {
    pub fn new() -> Self {
        Self {
            config: None,
            db: None,
            redis: None,
        }
    }

    pub fn config(mut self, config: Config) -> Self {
        self.config = Some(config);
        self
    }

    pub fn db(mut self, db: DbPool) -> Self {
        self.db = Some(db);
        self
    }

    pub fn redis(mut self, redis: redis::Client) -> Self {
        self.redis = Some(redis);
        self
    }

    pub async fn build(self) -> anyhow::Result<Arc<AppState>> {
        let config = self
            .config
            .ok_or_else(|| anyhow::anyhow!("Config is required"))?;
        let image_generator = ImageGenerator::new(config.clone());
        let text_generator = TextGenerator::new(config.clone());
        let db = self
            .db
            .ok_or_else(|| anyhow::anyhow!("DbPool is required"))?;
        let field_service = FieldService::new(db.clone(), config.clone());
        let dict_service = DictService::new(db.clone());
        let help_service = HelpService::new(db.clone());
        let contract_service = ContractService::new(db.clone());

        let state = AppState {
            config: Arc::new(config),
            db: db.clone(),
            redis: Arc::new(
                self.redis
                    .ok_or_else(|| anyhow::anyhow!("Redis client is required"))?,
            ),
            image_generator: Arc::new(image_generator),
            text_generator: Arc::new(text_generator),
            field_service: Arc::new(field_service),
            dict_service: Arc::new(dict_service),
            help_service: Arc::new(help_service),
            contract_service: Arc::new(contract_service),
        };

        tracing::info!("Initializing default help content...");
        if let Err(e) = state.help_service.init_default_help_content().await {
            tracing::warn!(
                "Failed to initialize help content (may already exist): {}",
                e
            );
        } else {
            tracing::info!("Help content initialization completed");
        }

        // 初始化默认用户
        tracing::info!("Initializing default users...");
        if let Err(e) = init_default_users(&db).await {
            tracing::warn!(
                "Failed to initialize default users (may already exist): {}",
                e
            );
        } else {
            tracing::info!("Default users initialization completed");
        }

        Ok(Arc::new(state))
    }
}

async fn init_default_users(db: &DbPool) -> anyhow::Result<()> {
    // 定义默认用户
    let default_users = vec![
        (
            "testuser",
            "testuser123",
            Some("testuser@example.com".to_string()),
            Some("测试用户".to_string()),
            false,
        ),
        (
            "user1",
            "user123",
            Some("user1@example.com".to_string()),
            Some("用户1".to_string()),
            false,
        ),
        (
            "user2",
            "user123",
            Some("user2@example.com".to_string()),
            Some("用户2".to_string()),
            false,
        ),
    ];

    for (username, password, email, name, is_superuser) in default_users {
        if !user_repo::check_username_exists(db, username).await? {
            let password_hash = hash(password, DEFAULT_COST)?;
            let create_user = CreateUser {
                username: username.to_string(),
                email,
                password_hash,
                name,
                phone: None,
                avatar: None,
                is_superuser,
                is_active: true,
                status: "approved".to_string(),
            };
            user_repo::create_user(db, create_user).await?;
            tracing::info!("Created default user: {}", username);
        }
    }

    Ok(())
}
