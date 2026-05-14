pub mod cms;
pub mod cms_repo;
pub mod contract;
pub mod organization;
pub mod contract_repo;
pub mod dict;
pub mod dict_repo;
pub mod field;
pub mod field_repo;
pub mod gis;
pub mod project;
pub mod project_repo;
pub mod gis_repo;
pub mod help;
pub mod help_repo;
pub mod material_library;
pub mod role;
pub mod role_repo;
pub mod schedule;
pub mod schedule_repo;
pub mod user;
pub mod user_repo;
pub mod workflow;
pub mod workflow_engine;
pub mod workflow_engine_repo;
pub mod workflow_repo;
pub mod templates;

use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};

pub type DbPool = Pool<Postgres>;

pub async fn create_db_pool(database_url: &str) -> anyhow::Result<DbPool> {
    let pool = PgPoolOptions::new()
        .max_connections(50)
        .connect(database_url)
        .await?;

    Ok(pool)
}

pub async fn test_db_connection(pool: &DbPool) -> anyhow::Result<()> {
    sqlx::query("SELECT 1").execute(pool).await?;
    Ok(())
}
