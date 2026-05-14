use crate::db::gis::*;
use crate::db::DbPool;
use bigdecimal::BigDecimal;
use std::str::FromStr;
use uuid::Uuid;

fn f64_to_bigdecimal(f: Option<f64>) -> Option<BigDecimal> {
    f.and_then(|f| BigDecimal::from_str(&f.to_string()).ok())
}

pub async fn get_customers(
    pool: &DbPool,
    status: Option<&str>,
    customer_type: Option<&str>,
) -> Result<Vec<GisCustomer>, sqlx::Error> {
    let mut sql = String::from(
        "SELECT id, name, longitude, latitude, customer_type, contact_person, contact_phone, address, level, status, created_at, updated_at FROM gis_customers WHERE 1=1"
    );

    if status.is_some() {
        sql.push_str(" AND status = $1");
    }
    if customer_type.is_some() {
        if status.is_some() {
            sql.push_str(" AND customer_type = $2");
        } else {
            sql.push_str(" AND customer_type = $1");
        }
    }
    sql.push_str(" ORDER BY created_at DESC");

    let mut query = sqlx::query_as::<_, GisCustomer>(&sql);

    if let Some(s) = status {
        query = query.bind(s);
    }
    if let Some(t) = customer_type {
        query = query.bind(t);
    }

    query.fetch_all(pool).await
}

pub async fn get_customer_by_id(
    pool: &DbPool,
    id: &str,
) -> Result<Option<GisCustomer>, sqlx::Error> {
    sqlx::query_as::<_, GisCustomer>(
        "SELECT id, name, longitude, latitude, customer_type, contact_person, contact_phone, address, level, status, created_at, updated_at FROM gis_customers WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn create_customer(
    pool: &DbPool,
    data: CreateGisCustomer,
) -> Result<GisCustomer, sqlx::Error> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now();

    sqlx::query_as::<_, GisCustomer>(
        r#"
        INSERT INTO gis_customers (id, name, longitude, latitude, customer_type, contact_person, contact_phone, address, level, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, $10)
        RETURNING id, name, longitude, latitude, customer_type, contact_person, contact_phone, address, level, status, created_at, updated_at
        "#
    )
    .bind(&id)
    .bind(&data.name)
    .bind(data.longitude)
    .bind(data.latitude)
    .bind(&data.customer_type)
    .bind(&data.contact_person)
    .bind(&data.contact_phone)
    .bind(&data.address)
    .bind(&data.level)
    .bind(now)
    .fetch_one(pool)
    .await
}

pub async fn update_customer(
    pool: &DbPool,
    id: &str,
    data: UpdateGisCustomer,
) -> Result<GisCustomer, sqlx::Error> {
    let now = chrono::Utc::now();

    sqlx::query_as::<_, GisCustomer>(
        r#"
        UPDATE gis_customers SET
            name = COALESCE($2, name),
            longitude = COALESCE($3, longitude),
            latitude = COALESCE($4, latitude),
            customer_type = COALESCE($5, customer_type),
            contact_person = COALESCE($6, contact_person),
            contact_phone = COALESCE($7, contact_phone),
            address = COALESCE($8, address),
            level = COALESCE($9, level),
            status = COALESCE($10, status),
            updated_at = $11
        WHERE id = $1
        RETURNING id, name, longitude, latitude, customer_type, contact_person, contact_phone, address, level, status, created_at, updated_at
        "#
    )
    .bind(id)
    .bind(&data.name)
    .bind(data.longitude)
    .bind(data.latitude)
    .bind(&data.customer_type)
    .bind(&data.contact_person)
    .bind(&data.contact_phone)
    .bind(&data.address)
    .bind(&data.level)
    .bind(&data.status)
    .bind(now)
    .fetch_one(pool)
    .await
}

pub async fn delete_customer(pool: &DbPool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM gis_customers WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_projects(
    pool: &DbPool,
    status: Option<&str>,
    project_type: Option<&str>,
) -> Result<Vec<GisProject>, sqlx::Error> {
    let mut sql = String::from(
        "SELECT id, name, longitude, latitude, project_type, status, customer_id, start_date, end_date, budget, description, created_at, updated_at FROM gis_projects WHERE 1=1"
    );

    if status.is_some() {
        sql.push_str(" AND status = $1");
    }
    if project_type.is_some() {
        if status.is_some() {
            sql.push_str(" AND project_type = $2");
        } else {
            sql.push_str(" AND project_type = $1");
        }
    }
    sql.push_str(" ORDER BY created_at DESC");

    let mut query = sqlx::query_as::<_, GisProjectDb>(&sql);

    if let Some(s) = status {
        query = query.bind(s);
    }
    if let Some(t) = project_type {
        query = query.bind(t);
    }

    let db_projects = query.fetch_all(pool).await?;
    Ok(db_projects.into_iter().map(GisProject::from).collect())
}

pub async fn get_project_by_id(pool: &DbPool, id: &str) -> Result<Option<GisProject>, sqlx::Error> {
    let result = sqlx::query_as::<_, GisProjectDb>(
        "SELECT id, name, longitude, latitude, project_type, status, customer_id, start_date, end_date, budget, description, created_at, updated_at FROM gis_projects WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(result.map(GisProject::from))
}

pub async fn create_project(
    pool: &DbPool,
    data: CreateGisProject,
) -> Result<GisProject, sqlx::Error> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now();
    let budget_decimal = f64_to_bigdecimal(data.budget);

    let db_project = sqlx::query_as::<_, GisProjectDb>(
        r#"
        INSERT INTO gis_projects (id, name, longitude, latitude, project_type, status, customer_id, start_date, end_date, budget, description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'planning', $6, $7, $8, $9, $10, $11, $11)
        RETURNING id, name, longitude, latitude, project_type, status, customer_id, start_date, end_date, budget, description, created_at, updated_at
        "#
    )
    .bind(&id)
    .bind(&data.name)
    .bind(data.longitude)
    .bind(data.latitude)
    .bind(&data.project_type)
    .bind(&data.customer_id)
    .bind(data.start_date)
    .bind(data.end_date)
    .bind(budget_decimal)
    .bind(&data.description)
    .bind(now)
    .fetch_one(pool)
    .await?;

    Ok(GisProject::from(db_project))
}

pub async fn update_project(
    pool: &DbPool,
    id: &str,
    data: UpdateGisProject,
) -> Result<GisProject, sqlx::Error> {
    let now = chrono::Utc::now();
    let budget_decimal = f64_to_bigdecimal(data.budget);

    let db_project = sqlx::query_as::<_, GisProjectDb>(
        r#"
        UPDATE gis_projects SET
            name = COALESCE($2, name),
            longitude = COALESCE($3, longitude),
            latitude = COALESCE($4, latitude),
            project_type = COALESCE($5, project_type),
            status = COALESCE($6, status),
            customer_id = COALESCE($7, customer_id),
            start_date = COALESCE($8, start_date),
            end_date = COALESCE($9, end_date),
            budget = COALESCE($10, budget),
            description = COALESCE($11, description),
            updated_at = $12
        WHERE id = $1
        RETURNING id, name, longitude, latitude, project_type, status, customer_id, start_date, end_date, budget, description, created_at, updated_at
        "#
    )
    .bind(id)
    .bind(&data.name)
    .bind(data.longitude)
    .bind(data.latitude)
    .bind(&data.project_type)
    .bind(&data.status)
    .bind(&data.customer_id)
    .bind(data.start_date)
    .bind(data.end_date)
    .bind(budget_decimal)
    .bind(&data.description)
    .bind(now)
    .fetch_one(pool)
    .await?;

    Ok(GisProject::from(db_project))
}

pub async fn delete_project(pool: &DbPool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM gis_projects WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_warehouses(
    pool: &DbPool,
    status: Option<&str>,
    warehouse_type: Option<&str>,
) -> Result<Vec<GisWarehouse>, sqlx::Error> {
    let mut sql = String::from(
        "SELECT id, name, longitude, latitude, warehouse_type, capacity, address, manager_name, manager_phone, status, created_at, updated_at FROM gis_warehouses WHERE 1=1"
    );

    if status.is_some() {
        sql.push_str(" AND status = $1");
    }
    if warehouse_type.is_some() {
        if status.is_some() {
            sql.push_str(" AND warehouse_type = $2");
        } else {
            sql.push_str(" AND warehouse_type = $1");
        }
    }
    sql.push_str(" ORDER BY created_at DESC");

    let mut query = sqlx::query_as::<_, GisWarehouse>(&sql);

    if let Some(s) = status {
        query = query.bind(s);
    }
    if let Some(t) = warehouse_type {
        query = query.bind(t);
    }

    query.fetch_all(pool).await
}

pub async fn get_warehouse_by_id(
    pool: &DbPool,
    id: &str,
) -> Result<Option<GisWarehouse>, sqlx::Error> {
    sqlx::query_as::<_, GisWarehouse>(
        "SELECT id, name, longitude, latitude, warehouse_type, capacity, address, manager_name, manager_phone, status, created_at, updated_at FROM gis_warehouses WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn create_warehouse(
    pool: &DbPool,
    data: CreateGisWarehouse,
) -> Result<GisWarehouse, sqlx::Error> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now();

    sqlx::query_as::<_, GisWarehouse>(
        r#"
        INSERT INTO gis_warehouses (id, name, longitude, latitude, warehouse_type, capacity, address, manager_name, manager_phone, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, $10)
        RETURNING id, name, longitude, latitude, warehouse_type, capacity, address, manager_name, manager_phone, status, created_at, updated_at
        "#
    )
    .bind(&id)
    .bind(&data.name)
    .bind(data.longitude)
    .bind(data.latitude)
    .bind(&data.warehouse_type)
    .bind(&data.capacity)
    .bind(&data.address)
    .bind(&data.manager_name)
    .bind(&data.manager_phone)
    .bind(now)
    .fetch_one(pool)
    .await
}

pub async fn update_warehouse(
    pool: &DbPool,
    id: &str,
    data: UpdateGisWarehouse,
) -> Result<GisWarehouse, sqlx::Error> {
    let now = chrono::Utc::now();

    sqlx::query_as::<_, GisWarehouse>(
        r#"
        UPDATE gis_warehouses SET
            name = COALESCE($2, name),
            longitude = COALESCE($3, longitude),
            latitude = COALESCE($4, latitude),
            warehouse_type = COALESCE($5, warehouse_type),
            capacity = COALESCE($6, capacity),
            address = COALESCE($7, address),
            manager_name = COALESCE($8, manager_name),
            manager_phone = COALESCE($9, manager_phone),
            status = COALESCE($10, status),
            updated_at = $11
        WHERE id = $1
        RETURNING id, name, longitude, latitude, warehouse_type, capacity, address, manager_name, manager_phone, status, created_at, updated_at
        "#
    )
    .bind(id)
    .bind(&data.name)
    .bind(data.longitude)
    .bind(data.latitude)
    .bind(&data.warehouse_type)
    .bind(&data.capacity)
    .bind(&data.address)
    .bind(&data.manager_name)
    .bind(&data.manager_phone)
    .bind(&data.status)
    .bind(now)
    .fetch_one(pool)
    .await
}

pub async fn delete_warehouse(pool: &DbPool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM gis_warehouses WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_personnel(
    pool: &DbPool,
    status: Option<&str>,
    personnel_type: Option<&str>,
) -> Result<Vec<GisPersonnel>, sqlx::Error> {
    let mut sql = String::from(
        "SELECT id, name, longitude, latitude, personnel_type, position, department, phone, status, last_location_time, created_at, updated_at FROM gis_personnel WHERE 1=1"
    );

    if status.is_some() {
        sql.push_str(" AND status = $1");
    }
    if personnel_type.is_some() {
        if status.is_some() {
            sql.push_str(" AND personnel_type = $2");
        } else {
            sql.push_str(" AND personnel_type = $1");
        }
    }
    sql.push_str(" ORDER BY created_at DESC");

    let mut query = sqlx::query_as::<_, GisPersonnel>(&sql);

    if let Some(s) = status {
        query = query.bind(s);
    }
    if let Some(t) = personnel_type {
        query = query.bind(t);
    }

    query.fetch_all(pool).await
}

pub async fn get_personnel_by_id(
    pool: &DbPool,
    id: &str,
) -> Result<Option<GisPersonnel>, sqlx::Error> {
    sqlx::query_as::<_, GisPersonnel>(
        "SELECT id, name, longitude, latitude, personnel_type, position, department, phone, status, last_location_time, created_at, updated_at FROM gis_personnel WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn create_personnel(
    pool: &DbPool,
    data: CreateGisPersonnel,
) -> Result<GisPersonnel, sqlx::Error> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now();

    sqlx::query_as::<_, GisPersonnel>(
        r#"
        INSERT INTO gis_personnel (id, name, longitude, latitude, personnel_type, position, department, phone, status, last_location_time, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $10)
        RETURNING id, name, longitude, latitude, personnel_type, position, department, phone, status, last_location_time, created_at, updated_at
        "#
    )
    .bind(&id)
    .bind(&data.name)
    .bind(data.longitude)
    .bind(data.latitude)
    .bind(&data.personnel_type)
    .bind(&data.position)
    .bind(&data.department)
    .bind(&data.phone)
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await
}

pub async fn update_personnel(
    pool: &DbPool,
    id: &str,
    data: UpdateGisPersonnel,
) -> Result<GisPersonnel, sqlx::Error> {
    let now = chrono::Utc::now();

    sqlx::query_as::<_, GisPersonnel>(
        r#"
        UPDATE gis_personnel SET
            name = COALESCE($2, name),
            longitude = COALESCE($3, longitude),
            latitude = COALESCE($4, latitude),
            personnel_type = COALESCE($5, personnel_type),
            position = COALESCE($6, position),
            department = COALESCE($7, department),
            phone = COALESCE($8, phone),
            status = COALESCE($9, status),
            last_location_time = COALESCE($10, last_location_time),
            updated_at = $11
        WHERE id = $1
        RETURNING id, name, longitude, latitude, personnel_type, position, department, phone, status, last_location_time, created_at, updated_at
        "#
    )
    .bind(id)
    .bind(&data.name)
    .bind(data.longitude)
    .bind(data.latitude)
    .bind(&data.personnel_type)
    .bind(&data.position)
    .bind(&data.department)
    .bind(&data.phone)
    .bind(&data.status)
    .bind(data.last_location_time)
    .bind(now)
    .fetch_one(pool)
    .await
}

pub async fn delete_personnel(pool: &DbPool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM gis_personnel WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_personnel_location(
    pool: &DbPool,
    id: &str,
    longitude: f64,
    latitude: f64,
) -> Result<GisPersonnel, sqlx::Error> {
    let now = chrono::Utc::now();

    sqlx::query_as::<_, GisPersonnel>(
        r#"
        UPDATE gis_personnel SET
            longitude = $2,
            latitude = $3,
            last_location_time = $4,
            updated_at = $4
        WHERE id = $1
        RETURNING id, name, longitude, latitude, personnel_type, position, department, phone, status, last_location_time, created_at, updated_at
        "#
    )
    .bind(id)
    .bind(longitude)
    .bind(latitude)
    .bind(now)
    .fetch_one(pool)
    .await
}

pub async fn create_marker(
    pool: &DbPool,
    data: CreateGisMarker,
) -> Result<GisMarker, sqlx::Error> {
    let id = Uuid::new_v4();
    let now = chrono::Utc::now();
    
    let user_id = data.user_id.and_then(|id| Uuid::parse_str(&id).ok());
    let project_id = data.project_id.and_then(|id| Uuid::parse_str(&id).ok());
    let tags_json = data.tags.map(|t| sqlx::types::Json(t));

    sqlx::query_as::<_, GisMarker>(
        r#"
        INSERT INTO gis_markers (id, title, description, longitude, latitude, marker_type, icon, color, user_id, project_id, layer, tags, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', $13, $13)
        RETURNING id, title, description, longitude, latitude, marker_type, icon, color, user_id, project_id, layer, tags, status, created_at, updated_at
        "#
    )
    .bind(id)
    .bind(data.title)
    .bind(data.description)
    .bind(data.longitude)
    .bind(data.latitude)
    .bind(data.marker_type)
    .bind(data.icon)
    .bind(data.color)
    .bind(user_id)
    .bind(project_id)
    .bind(data.layer)
    .bind(tags_json)
    .bind(now)
    .fetch_one(pool)
    .await
}

pub async fn get_marker(pool: &DbPool, id: Uuid) -> Result<Option<GisMarker>, sqlx::Error> {
    sqlx::query_as::<_, GisMarker>(
        "SELECT id, title, description, longitude, latitude, marker_type, icon, color, user_id, project_id, layer, tags, status, created_at, updated_at FROM gis_markers WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn get_markers(
    pool: &DbPool,
    params: MarkerSearchParams,
) -> Result<Vec<GisMarker>, sqlx::Error> {
    let mut sql = String::from(
        "SELECT id, title, description, longitude, latitude, marker_type, icon, color, user_id, project_id, layer, tags, status, created_at, updated_at FROM gis_markers WHERE 1=1"
    );
    
    let mut bindings: Vec<sqlx::types::Json<serde_json::Value>> = Vec::new();
    let mut param_count = 0;

    if let Some(marker_type) = params.marker_type {
        param_count += 1;
        sql.push_str(&format!(" AND marker_type = ${}", param_count));
        bindings.push(sqlx::types::Json(serde_json::Value::String(marker_type)));
    }

    if let Some(layer) = params.layer {
        param_count += 1;
        sql.push_str(&format!(" AND layer = ${}", param_count));
        bindings.push(sqlx::types::Json(serde_json::Value::String(layer)));
    }

    if let Some(project_id) = params.project_id {
        if let Ok(project_uuid) = Uuid::parse_str(&project_id) {
            param_count += 1;
            sql.push_str(&format!(" AND project_id = ${}", param_count));
            bindings.push(sqlx::types::Json(serde_json::Value::String(project_uuid.to_string())));
        }
    }

    if let Some(status) = params.status {
        param_count += 1;
        sql.push_str(&format!(" AND status = ${}", param_count));
        bindings.push(sqlx::types::Json(serde_json::Value::String(status)));
    }

    if let Some(bounds) = params.bounds {
        param_count += 1;
        sql.push_str(&format!(" AND longitude >= ${}", param_count));
        bindings.push(sqlx::types::Json(serde_json::Value::Number(serde_json::Number::from_f64(bounds.min_longitude).unwrap())));
        
        param_count += 1;
        sql.push_str(&format!(" AND longitude <= ${}", param_count));
        bindings.push(sqlx::types::Json(serde_json::Value::Number(serde_json::Number::from_f64(bounds.max_longitude).unwrap())));
        
        param_count += 1;
        sql.push_str(&format!(" AND latitude >= ${}", param_count));
        bindings.push(sqlx::types::Json(serde_json::Value::Number(serde_json::Number::from_f64(bounds.min_latitude).unwrap())));
        
        param_count += 1;
        sql.push_str(&format!(" AND latitude <= ${}", param_count));
        bindings.push(sqlx::types::Json(serde_json::Value::Number(serde_json::Number::from_f64(bounds.max_latitude).unwrap())));
    }

    sql.push_str(" ORDER BY created_at DESC");

    let page_size = params.page_size.unwrap_or(50);
    let offset = ((params.page.unwrap_or(1) - 1) * page_size) as i64;
    
    param_count += 1;
    sql.push_str(&format!(" LIMIT ${} OFFSET ${}", param_count, param_count + 1));

    let mut query = sqlx::query_as::<_, GisMarker>(&sql);
    
    for binding in bindings {
        query = query.bind(binding);
    }
    query = query.bind(page_size).bind(offset);

    query.fetch_all(pool).await
}

pub async fn update_marker(
    pool: &DbPool,
    id: Uuid,
    data: UpdateGisMarker,
) -> Result<GisMarker, sqlx::Error> {
    let now = chrono::Utc::now();
    let project_id = data.project_id.and_then(|id| Uuid::parse_str(&id).ok());

    sqlx::query_as::<_, GisMarker>(
        r#"
        UPDATE gis_markers SET
            title = COALESCE($2, title),
            description = COALESCE($3, description),
            longitude = COALESCE($4, longitude),
            latitude = COALESCE($5, latitude),
            marker_type = COALESCE($6, marker_type),
            icon = COALESCE($7, icon),
            color = COALESCE($8, color),
            project_id = COALESCE($9, project_id),
            layer = COALESCE($10, layer),
            tags = COALESCE($11, tags),
            status = COALESCE($12, status),
            updated_at = $13
        WHERE id = $1
        RETURNING id, title, description, longitude, latitude, marker_type, icon, color, user_id, project_id, layer, tags, status, created_at, updated_at
        "#
    )
    .bind(id)
    .bind(data.title)
    .bind(data.description)
    .bind(data.longitude)
    .bind(data.latitude)
    .bind(data.marker_type)
    .bind(data.icon)
    .bind(data.color)
    .bind(project_id)
    .bind(data.layer)
    .bind(data.tags)
    .bind(data.status)
    .bind(now)
    .fetch_one(pool)
    .await
}

pub async fn delete_marker(pool: &DbPool, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM gis_markers WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn search_nearby_markers(
    pool: &DbPool,
    params: NearbySearchParams,
) -> Result<Vec<MarkerWithDistance>, sqlx::Error> {
    let radius = params.radius.unwrap_or(1000.0);
    let limit = params.limit.unwrap_or(20);
    
    let sql = r#"
        SELECT 
            id, title, description, longitude, latitude, marker_type, icon, color,
            (6371000 * acos(cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)))) as distance
        FROM gis_markers
        WHERE status = 'active'
        AND (6371000 * acos(cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)))) <= $3
        ORDER BY distance
        LIMIT $4
    "#;

    let mut query = sqlx::query_as::<_, MarkerWithDistance>(sql)
        .bind(params.latitude)
        .bind(params.longitude)
        .bind(radius)
        .bind(limit);

    if let Some(marker_type) = params.marker_type {
        query = query.bind(marker_type);
    }

    query.fetch_all(pool).await
}

pub async fn get_marker_types(pool: &DbPool) -> Result<Vec<String>, sqlx::Error> {
    let sql = "SELECT DISTINCT marker_type FROM gis_markers WHERE status = 'active' ORDER BY marker_type";
    
    sqlx::query_scalar(sql)
        .fetch_all(pool)
        .await
}

pub async fn get_layers(pool: &DbPool) -> Result<Vec<String>, sqlx::Error> {
    let sql = "SELECT DISTINCT layer FROM gis_markers WHERE layer IS NOT NULL ORDER BY layer";
    
    sqlx::query_scalar(sql)
        .fetch_all(pool)
        .await
}