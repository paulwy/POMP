use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use bigdecimal::BigDecimal;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct GisCustomer {
    pub id: String,
    pub name: String,
    pub longitude: f64,
    pub latitude: f64,
    pub customer_type: Option<String>,
    pub contact_person: Option<String>,
    pub contact_phone: Option<String>,
    pub address: Option<String>,
    pub level: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateGisCustomer {
    pub name: String,
    pub longitude: f64,
    pub latitude: f64,
    pub customer_type: Option<String>,
    pub contact_person: Option<String>,
    pub contact_phone: Option<String>,
    pub address: Option<String>,
    pub level: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateGisCustomer {
    pub name: Option<String>,
    pub longitude: Option<f64>,
    pub latitude: Option<f64>,
    pub customer_type: Option<String>,
    pub contact_person: Option<String>,
    pub contact_phone: Option<String>,
    pub address: Option<String>,
    pub level: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GisProject {
    pub id: String,
    pub name: String,
    pub longitude: f64,
    pub latitude: f64,
    pub project_type: Option<String>,
    pub status: String,
    pub customer_id: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub budget: Option<f64>,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow)]
pub struct GisProjectDb {
    pub id: String,
    pub name: String,
    pub longitude: f64,
    pub latitude: f64,
    pub project_type: Option<String>,
    pub status: String,
    pub customer_id: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub budget: Option<BigDecimal>,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<GisProjectDb> for GisProject {
    fn from(db: GisProjectDb) -> Self {
        Self {
            id: db.id,
            name: db.name,
            longitude: db.longitude,
            latitude: db.latitude,
            project_type: db.project_type,
            status: db.status,
            customer_id: db.customer_id,
            start_date: db.start_date,
            end_date: db.end_date,
            budget: db.budget.map(|d| {
                use bigdecimal::ToPrimitive;
                d.to_f64().unwrap_or(0.0)
            }),
            description: db.description,
            created_at: db.created_at,
            updated_at: db.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateGisProject {
    pub name: String,
    pub longitude: f64,
    pub latitude: f64,
    pub project_type: Option<String>,
    pub customer_id: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub budget: Option<f64>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateGisProject {
    pub name: Option<String>,
    pub longitude: Option<f64>,
    pub latitude: Option<f64>,
    pub project_type: Option<String>,
    pub status: Option<String>,
    pub customer_id: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub budget: Option<f64>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct GisWarehouse {
    pub id: String,
    pub name: String,
    pub longitude: f64,
    pub latitude: f64,
    pub warehouse_type: Option<String>,
    pub capacity: Option<String>,
    pub address: Option<String>,
    pub manager_name: Option<String>,
    pub manager_phone: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateGisWarehouse {
    pub name: String,
    pub longitude: f64,
    pub latitude: f64,
    pub warehouse_type: Option<String>,
    pub capacity: Option<String>,
    pub address: Option<String>,
    pub manager_name: Option<String>,
    pub manager_phone: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateGisWarehouse {
    pub name: Option<String>,
    pub longitude: Option<f64>,
    pub latitude: Option<f64>,
    pub warehouse_type: Option<String>,
    pub capacity: Option<String>,
    pub address: Option<String>,
    pub manager_name: Option<String>,
    pub manager_phone: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct GisPersonnel {
    pub id: String,
    pub name: String,
    pub longitude: f64,
    pub latitude: f64,
    pub personnel_type: String,
    pub position: Option<String>,
    pub department: Option<String>,
    pub phone: Option<String>,
    pub status: String,
    pub last_location_time: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateGisPersonnel {
    pub name: String,
    pub longitude: f64,
    pub latitude: f64,
    pub personnel_type: String,
    pub position: Option<String>,
    pub department: Option<String>,
    pub phone: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateGisPersonnel {
    pub name: Option<String>,
    pub longitude: Option<f64>,
    pub latitude: Option<f64>,
    pub personnel_type: Option<String>,
    pub position: Option<String>,
    pub department: Option<String>,
    pub phone: Option<String>,
    pub status: Option<String>,
    pub last_location_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct GisLocation {
    pub id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub longitude: f64,
    pub latitude: f64,
    pub address: Option<String>,
    pub location_time: DateTime<Utc>,
    pub remarks: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateGisLocation {
    pub entity_type: String,
    pub entity_id: String,
    pub longitude: f64,
    pub latitude: f64,
    pub address: Option<String>,
    pub location_time: Option<DateTime<Utc>>,
    pub remarks: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct GisMarker {
    pub id: Uuid,
    pub title: Option<String>,
    pub description: Option<String>,
    pub longitude: f64,
    pub latitude: f64,
    pub marker_type: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub user_id: Option<Uuid>,
    pub project_id: Option<Uuid>,
    pub layer: Option<String>,
    pub tags: Option<Vec<String>>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateGisMarker {
    pub title: Option<String>,
    pub description: Option<String>,
    pub longitude: f64,
    pub latitude: f64,
    pub marker_type: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub user_id: Option<String>,
    pub project_id: Option<String>,
    pub layer: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateGisMarker {
    pub title: Option<String>,
    pub description: Option<String>,
    pub longitude: Option<f64>,
    pub latitude: Option<f64>,
    pub marker_type: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub project_id: Option<String>,
    pub layer: Option<String>,
    pub tags: Option<Vec<String>>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarkerSearchParams {
    pub marker_type: Option<String>,
    pub layer: Option<String>,
    pub project_id: Option<String>,
    pub status: Option<String>,
    pub page: Option<i32>,
    pub page_size: Option<i32>,
    pub bounds: Option<GeoBounds>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeoBounds {
    pub min_longitude: f64,
    pub min_latitude: f64,
    pub max_longitude: f64,
    pub max_latitude: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MarkerWithDistance {
    pub id: Uuid,
    pub title: Option<String>,
    pub description: Option<String>,
    pub longitude: f64,
    pub latitude: f64,
    pub marker_type: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub distance: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NearbySearchParams {
    pub longitude: f64,
    pub latitude: f64,
    pub radius: Option<f64>,
    pub marker_type: Option<String>,
    pub limit: Option<i32>,
}