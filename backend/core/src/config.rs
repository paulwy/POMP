use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    #[serde(default = "default_server_port")]
    pub server_port: u16,

    #[serde(default = "default_database_url")]
    pub database_url: String,

    #[serde(default = "default_redis_url")]
    pub redis_url: String,

    #[serde(default = "default_jwt_secret")]
    pub jwt_secret: String,

    #[serde(default = "default_jwt_expire_hours")]
    pub jwt_expire_hours: i64,

    #[serde(default)]
    pub together_api_key: String,

    #[serde(default = "default_together_api_url")]
    pub together_api_url: String,

    #[serde(default)]
    pub huggingface_api_key: String,

    #[serde(default = "default_huggingface_api_url")]
    pub huggingface_api_url: String,

    #[serde(default = "default_ai_image_model")]
    pub ai_image_model: String,

    #[serde(default = "default_ai_image_size")]
    pub ai_image_size: String,

    #[serde(default = "default_ai_image_quality")]
    pub ai_image_quality: String,

    #[serde(default = "default_ollama_api_url")]
    pub ollama_api_url: String,

    #[serde(default = "default_ollama_model")]
    pub ollama_model: String,
}

fn default_server_port() -> u16 {
    3000
}

fn default_database_url() -> String {
    "postgres://postgres:postgres@localhost:5432/pomp".to_string()
}

fn default_redis_url() -> String {
    "redis://localhost:6379".to_string()
}

fn default_jwt_secret() -> String {
    "sksfems_secret_key_12345".to_string()
}

fn default_jwt_expire_hours() -> i64 {
    24
}

fn default_together_api_url() -> String {
    "https://api.together.xyz".to_string()
}

fn default_huggingface_api_url() -> String {
    "https://api-inference.huggingface.co".to_string()
}

fn default_ai_image_model() -> String {
    "black-forest-labs/FLUX.1-schnell-Free".to_string()
}

fn default_ai_image_size() -> String {
    "1024x1024".to_string()
}

fn default_ai_image_quality() -> String {
    "standard".to_string()
}

fn default_ollama_api_url() -> String {
    "http://localhost:11434".to_string()
}

fn default_ollama_model() -> String {
    "llama2".to_string()
}

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR")
            .map(std::path::PathBuf::from)
            .ok();

        let project_root = manifest_dir
            .as_ref()
            .and_then(|p| p.ancestors().nth(1))
            .map(|p| p.to_path_buf())
            .or_else(|| std::env::current_dir().ok())
            .unwrap_or_else(|| std::path::PathBuf::from("."));

        let env_path = project_root.join(".env");
        dotenv::from_path(&env_path).ok();

        let config = envy::from_env::<Self>()?;
        Ok(config)
    }
}
