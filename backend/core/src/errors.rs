use crate::services::contract_service::ContractServiceError;
use crate::services::dict_service::DictServiceError;
use axum::{http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};

#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("数据库错误: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Redis错误: {0}")]
    RedisError(#[from] redis::RedisError),

    #[error("外部服务错误: {0}")]
    ExternalService(String),

    #[error("认证错误: {0}")]
    AuthenticationError(String),

    #[error("授权错误: {0}")]
    AuthorizationError(String),

    #[error("验证错误: {0}")]
    ValidationError(String),

    #[error("未找到: {0}")]
    NotFound(String),

    #[error("内部服务器错误")]
    InternalServerError,

    #[error("请求参数错误: {0}")]
    BadRequest(String),

    #[error("字典服务错误: {0}")]
    DictServiceError(String),

    #[error("合同服务错误: {0}")]
    ContractServiceError(String),
}

impl From<DictServiceError> for AppError {
    fn from(err: DictServiceError) -> Self {
        AppError::DictServiceError(err.to_string())
    }
}

impl From<ContractServiceError> for AppError {
    fn from(err: ContractServiceError) -> Self {
        AppError::ContractServiceError(err.to_string())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let status = match self {
            AppError::DatabaseError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::RedisError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::ExternalService(_) => StatusCode::BAD_GATEWAY,
            AppError::AuthenticationError(_) => StatusCode::UNAUTHORIZED,
            AppError::AuthorizationError(_) => StatusCode::FORBIDDEN,
            AppError::ValidationError(_) => StatusCode::BAD_REQUEST,
            AppError::NotFound(_) => StatusCode::NOT_FOUND,
            AppError::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
            AppError::DictServiceError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::ContractServiceError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };

        let body = serde_json::json!({
            "success": false,
            "data": null,
            "error": self.to_string(),
        });

        (status, axum::Json(body)).into_response()
    }
}

pub type Result<T, E = AppError> = std::result::Result<T, E>;

#[derive(Serialize, Deserialize, Debug)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(error: impl ToString) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error.to_string()),
        }
    }
}
