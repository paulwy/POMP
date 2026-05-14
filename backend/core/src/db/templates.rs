use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Template {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub template_type: String,
    pub content: serde_json::Value,
    pub variables: Option<serde_json::Value>,
    pub version: String,
    pub is_active: bool,
    pub is_system: bool,
    pub is_default: bool,
    pub sort_order: i32,
    pub tags: Vec<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTemplate {
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub template_type: String,
    pub content: serde_json::Value,
    pub variables: Option<serde_json::Value>,
    pub version: Option<String>,
    pub is_active: Option<bool>,
    pub is_default: Option<bool>,
    pub sort_order: Option<i32>,
    pub tags: Option<Vec<String>>,
    pub created_by: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTemplate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub content: Option<serde_json::Value>,
    pub variables: Option<serde_json::Value>,
    pub version: Option<String>,
    pub is_active: Option<bool>,
    pub is_default: Option<bool>,
    pub sort_order: Option<i32>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TemplateUsage {
    pub id: Uuid,
    pub template_id: Uuid,
    pub business_type: Option<String>,
    pub business_id: Option<Uuid>,
    pub used_by: Option<Uuid>,
    pub usage_count: i32,
    pub last_used_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateWithStats {
    pub template: Template,
    pub usage_count: i64,
    pub is_favorite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
struct TemplateQueryRow {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub template_type: String,
    pub content: serde_json::Value,
    pub variables: Option<serde_json::Value>,
    pub version: String,
    pub is_active: bool,
    pub is_system: bool,
    pub is_default: bool,
    pub sort_order: i32,
    pub tags: Vec<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub usage_count: i64,
    pub is_favorite: bool,
}

pub async fn create_template(pool: &PgPool, req: CreateTemplate) -> Result<Template, sqlx::Error> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    
    let template = sqlx::query_as::<_, Template>(
        r#"
        INSERT INTO templates (
            id, code, name, description, category, template_type,
            content, variables, version, is_active, is_system, is_default,
            sort_order, tags, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, $11, $12, $13, $14, $15, $15)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&req.code)
    .bind(&req.name)
    .bind(&req.description)
    .bind(&req.category)
    .bind(&req.template_type)
    .bind(&req.content)
    .bind(&req.variables)
    .bind(req.version.unwrap_or_else(|| "1.0".to_string()))
    .bind(req.is_active.unwrap_or(true))
    .bind(req.is_default.unwrap_or(false))
    .bind(req.sort_order.unwrap_or(0))
    .bind(req.tags.unwrap_or_default())
    .bind(req.created_by)
    .bind(now)
    .fetch_one(pool)
    .await?;
    
    Ok(template)
}

pub async fn get_template(pool: &PgPool, id: Uuid) -> Result<Option<Template>, sqlx::Error> {
    let template = sqlx::query_as::<_, Template>(
        "SELECT * FROM templates WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    
    Ok(template)
}

pub async fn get_template_by_code(pool: &PgPool, code: &str) -> Result<Option<Template>, sqlx::Error> {
    let template = sqlx::query_as::<_, Template>(
        "SELECT * FROM templates WHERE code = $1",
    )
    .bind(code)
    .fetch_optional(pool)
    .await?;
    
    Ok(template)
}

pub async fn get_templates(
    pool: &PgPool,
    category: Option<&str>,
    template_type: Option<&str>,
    is_active: Option<bool>,
    user_id: Option<Uuid>,
) -> Result<Vec<TemplateWithStats>, sqlx::Error> {
    let user_id_val = user_id.unwrap_or_else(|| Uuid::nil());
    
    let mut conditions: Vec<String> = Vec::new();
    
    if category.is_some() {
        conditions.push("t.category = $2".to_string());
    }
    if template_type.is_some() {
        if category.is_some() {
            conditions.push("t.template_type = $3".to_string());
        } else {
            conditions.push("t.template_type = $2".to_string());
        }
    }
    if is_active.is_some() {
        let idx = conditions.len() + 2;
        conditions.push(format!("t.is_active = ${}", idx));
    }
    
    let where_clause = if conditions.is_empty() {
        "".to_string()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };
    
    let query = format!(
        r#"
        SELECT t.*, 
               COALESCE(u.usage_count, 0) as usage_count,
               CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorite
        FROM templates t
        LEFT JOIN (
            SELECT template_id, SUM(usage_count) as usage_count
            FROM template_usage
            GROUP BY template_id
        ) u ON t.id = u.template_id
        LEFT JOIN template_favorites f ON t.id = f.template_id AND f.user_id = $1
        {}
        ORDER BY t.sort_order ASC, t.created_at DESC
        "#,
        where_clause
    );
    
    let mut q = sqlx::query_as::<_, TemplateQueryRow>(&query).bind(user_id_val);
    
    if let Some(cat) = category {
        q = q.bind(cat);
    }
    if let Some(t) = template_type {
        q = q.bind(t);
    }
    if let Some(active) = is_active {
        q = q.bind(active);
    }
    
    let rows = q.fetch_all(pool).await?;
    
    let result: Vec<TemplateWithStats> = rows.into_iter()
        .map(|row| TemplateWithStats {
            template: Template {
                id: row.id,
                code: row.code,
                name: row.name,
                description: row.description,
                category: row.category,
                template_type: row.template_type,
                content: row.content,
                variables: row.variables,
                version: row.version,
                is_active: row.is_active,
                is_system: row.is_system,
                is_default: row.is_default,
                sort_order: row.sort_order,
                tags: row.tags,
                created_by: row.created_by,
                created_at: row.created_at,
                updated_at: row.updated_at,
            },
            usage_count: row.usage_count,
            is_favorite: row.is_favorite,
        })
        .collect();
    
    Ok(result)
}

pub async fn update_template(
    pool: &PgPool,
    id: Uuid,
    req: UpdateTemplate,
) -> Result<Template, sqlx::Error> {
    let template = sqlx::query_as::<_, Template>(
        r#"
        UPDATE templates
        SET 
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            category = COALESCE($4, category),
            content = COALESCE($5, content),
            variables = COALESCE($6, variables),
            version = COALESCE($7, version),
            is_active = COALESCE($8, is_active),
            is_default = COALESCE($9, is_default),
            sort_order = COALESCE($10, sort_order),
            tags = COALESCE($11, tags),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&req.name)
    .bind(&req.description)
    .bind(&req.category)
    .bind(&req.content)
    .bind(&req.variables)
    .bind(&req.version)
    .bind(req.is_active)
    .bind(req.is_default)
    .bind(req.sort_order)
    .bind(req.tags)
    .fetch_one(pool)
    .await?;
    
    Ok(template)
}

pub async fn delete_template(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM templates WHERE id = $1 AND is_system = false")
        .bind(id)
        .execute(pool)
        .await?;
    
    Ok(result.rows_affected() > 0)
}

pub async fn get_template_categories(pool: &PgPool) -> Result<Vec<String>, sqlx::Error> {
    let rows = sqlx::query_scalar::<_, String>(
        "SELECT DISTINCT category FROM templates ORDER BY category",
    )
    .fetch_all(pool)
    .await?;
    
    Ok(rows)
}

pub async fn record_template_usage(
    pool: &PgPool,
    template_id: Uuid,
    business_type: Option<&str>,
    business_id: Option<Uuid>,
    used_by: Option<Uuid>,
) -> Result<(), sqlx::Error> {
    let now = Utc::now();
    
    // 先检查是否已有记录
    let existing = sqlx::query_as::<_, TemplateUsage>(
        r#"
        SELECT * FROM template_usage 
        WHERE template_id = $1 
        AND business_type IS NOT DISTINCT FROM $2 
        AND business_id IS NOT DISTINCT FROM $3
        "#,
    )
    .bind(template_id)
    .bind(business_type)
    .bind(business_id)
    .fetch_optional(pool)
    .await?;
    
    if let Some(usage) = existing {
        // 更新使用计数
        sqlx::query(
            r#"
            UPDATE template_usage
            SET usage_count = usage_count + 1, last_used_at = $2, used_by = $3
            WHERE id = $1
            "#,
        )
        .bind(usage.id)
        .bind(now)
        .bind(used_by)
        .execute(pool)
        .await?;
    } else {
        // 创建新记录
        sqlx::query(
            r#"
            INSERT INTO template_usage (template_id, business_type, business_id, used_by, last_used_at)
            VALUES ($1, $2, $3, $4, $5)
            "#,
        )
        .bind(template_id)
        .bind(business_type)
        .bind(business_id)
        .bind(used_by)
        .bind(now)
        .execute(pool)
        .await?;
    }
    
    Ok(())
}

pub async fn toggle_favorite(
    pool: &PgPool,
    template_id: Uuid,
    user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    // 检查是否已收藏
    let existing = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM template_favorites WHERE template_id = $1 AND user_id = $2",
    )
    .bind(template_id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    
    if existing > 0 {
        // 取消收藏
        sqlx::query(
            "DELETE FROM template_favorites WHERE template_id = $1 AND user_id = $2",
        )
        .bind(template_id)
        .bind(user_id)
        .execute(pool)
        .await?;
        Ok(false)
    } else {
        // 添加收藏
        sqlx::query(
            "INSERT INTO template_favorites (template_id, user_id) VALUES ($1, $2)",
        )
        .bind(template_id)
        .bind(user_id)
        .execute(pool)
        .await?;
        Ok(true)
    }
}

pub async fn get_favorite_templates(
    pool: &PgPool,
    user_id: Uuid,
    category: Option<&str>,
) -> Result<Vec<Template>, sqlx::Error> {
    let mut query = String::from(
        "SELECT t.* FROM templates t INNER JOIN template_favorites f ON t.id = f.template_id WHERE f.user_id = $1"
    );
    
    if let Some(cat) = category {
        query.push_str(" AND t.category = $2");
    }
    
    query.push_str(" ORDER BY f.created_at DESC");
    
    let mut q = sqlx::query_as(&query).bind(user_id);
    if let Some(cat) = category {
        q = q.bind(cat);
    }
    
    let templates = q.fetch_all(pool).await?;
    Ok(templates)
}

pub async fn init_default_templates(pool: &PgPool) -> Result<(), sqlx::Error> {
    let count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM templates WHERE is_system = true")
        .fetch_one(pool)
        .await?;
    
    if count > 0 {
        return Ok(());
    }
    
    let now = Utc::now();
    let default_templates = vec![
        (
            "dept_general",
            "通用部门",
            "组织架构",
            "department",
            serde_json::json!({"name": "", "code": "", "description": ""}),
            vec!["组织架构", "通用"],
        ),
        (
            "dept_management",
            "管理部门",
            "组织架构",
            "department",
            serde_json::json!({"name": "", "code": "", "description": "管理部门"}),
            vec!["组织架构", "管理"],
        ),
        (
            "pos_manager",
            "经理职位",
            "组织架构",
            "position",
            serde_json::json!({"name": "", "code": "", "is_leader": true}),
            vec!["组织架构", "管理"],
        ),
        (
            "pos_staff",
            "普通员工",
            "组织架构",
            "position",
            serde_json::json!({"name": "", "code": "", "is_leader": false}),
            vec!["组织架构", "通用"],
        ),
        (
            "level_intern",
            "实习生",
            "组织架构",
            "position_level",
            serde_json::json!({"name": "实习生", "code": "INTERN", "level_order": 1, "description": "实习人员"}),
            vec!["组织架构", "职级"],
        ),
        (
            "level_junior",
            "初级专员",
            "组织架构",
            "position_level",
            serde_json::json!({"name": "初级专员", "code": "JUNIOR", "level_order": 2, "description": "初级专业人员"}),
            vec!["组织架构", "职级"],
        ),
        (
            "level_specialist",
            "专员",
            "组织架构",
            "position_level",
            serde_json::json!({"name": "专员", "code": "SPECIALIST", "level_order": 3, "description": "专业人员"}),
            vec!["组织架构", "职级"],
        ),
        (
            "level_senior",
            "高级专员",
            "组织架构",
            "position_level",
            serde_json::json!({"name": "高级专员", "code": "SENIOR", "level_order": 4, "description": "高级专业人员"}),
            vec!["组织架构", "职级"],
        ),
        (
            "level_supervisor",
            "主管",
            "组织架构",
            "position_level",
            serde_json::json!({"name": "主管", "code": "SUPERVISOR", "level_order": 5, "description": "基层管理者"}),
            vec!["组织架构", "职级"],
        ),
        (
            "level_manager",
            "经理",
            "组织架构",
            "position_level",
            serde_json::json!({"name": "经理", "code": "MANAGER", "level_order": 6, "description": "部门经理"}),
            vec!["组织架构", "职级"],
        ),
        (
            "level_senior_manager",
            "高级经理",
            "组织架构",
            "position_level",
            serde_json::json!({"name": "高级经理", "code": "SR_MANAGER", "level_order": 7, "description": "高级部门经理"}),
            vec!["组织架构", "职级"],
        ),
        (
            "level_director",
            "总监",
            "组织架构",
            "position_level",
            serde_json::json!({"name": "总监", "code": "DIRECTOR", "level_order": 8, "description": "业务线总监"}),
            vec!["组织架构", "职级"],
        ),
        (
            "level_vp",
            "副总裁",
            "组织架构",
            "position_level",
            serde_json::json!({"name": "副总裁", "code": "VP", "level_order": 9, "description": "副总裁"}),
            vec!["组织架构", "职级"],
        ),
        (
            "level_svp",
            "高级副总裁",
            "组织架构",
            "position_level",
            serde_json::json!({"name": "高级副总裁", "code": "SVP", "level_order": 10, "description": "高级副总裁"}),
            vec!["组织架构", "职级"],
        ),
        (
            "level_ceo",
            "总裁/CEO",
            "组织架构",
            "position_level",
            serde_json::json!({"name": "总裁/CEO", "code": "CEO", "level_order": 11, "description": "最高管理者"}),
            vec!["组织架构", "职级"],
        ),
        (
            "rule_simple",
            "简单审批",
            "组织架构",
            "approval_rule",
            serde_json::json!({"rule_type": "department", "approval_mode": "any"}),
            vec!["组织架构", "审批"],
        ),
        (
            "rule_multi_level",
            "多级审批",
            "组织架构",
            "approval_rule",
            serde_json::json!({"rule_type": "position_level", "approval_mode": "all"}),
            vec!["组织架构", "审批"],
        ),
        (
            "wf_leave",
            "请假审批流",
            "工作流",
            "workflow",
            serde_json::json!({"nodes": []}),
            vec!["工作流", "请假"],
        ),
        (
            "wf_expense",
            "报销审批流",
            "工作流",
            "workflow",
            serde_json::json!({"nodes": []}),
            vec!["工作流", "报销"],
        ),
        (
            "contract_sales",
            "销售合同模板",
            "合同",
            "contract",
            serde_json::json!({
                "contract_type": "SALES",
                "category": "BUSINESS",
                "body": "甲方（以下简称“卖方”）：{first_party}\n\n乙方（以下简称“买方”）：{second_party}\n\n根据《中华人民共和国合同法》及相关法律法规，双方本着平等互利的原则，经友好协商，就买卖事宜达成如下协议：\n\n一、合同标的\n{contract_items}\n\n二、合同金额\n本合同总金额为：{amount} {currency}\n\n三、付款方式\n{payment_terms}\n\n四、交货时间\n{delivery_date}\n\n五、双方权利义务\n{rights_obligations}\n\n六、违约责任\n{liability}\n\n七、争议解决\n{dispute_resolution}\n\n八、其他条款\n{other_terms}\n\n甲方（签字盖章）：__________\n日期：{sign_date}\n\n乙方（签字盖章）：__________\n日期：{sign_date}",
                "variables": [
                    {"key": "first_party", "label": "甲方名称", "type": "string", "required": true},
                    {"key": "second_party", "label": "乙方名称", "type": "string", "required": true},
                    {"key": "contract_items", "label": "合同标的", "type": "textarea", "required": true},
                    {"key": "amount", "label": "合同金额", "type": "number", "required": true},
                    {"key": "currency", "label": "币种", "type": "select", "options": ["CNY", "USD", "EUR"], "default": "CNY"},
                    {"key": "payment_terms", "label": "付款方式", "type": "textarea"},
                    {"key": "delivery_date", "label": "交货时间", "type": "date"},
                    {"key": "rights_obligations", "label": "双方权利义务", "type": "textarea"},
                    {"key": "liability", "label": "违约责任", "type": "textarea"},
                    {"key": "dispute_resolution", "label": "争议解决", "type": "textarea"},
                    {"key": "other_terms", "label": "其他条款", "type": "textarea"},
                    {"key": "sign_date", "label": "签署日期", "type": "date"}
                ]
            }),
            vec!["合同", "销售", "标准"],
        ),
        (
            "contract_purchase",
            "采购合同模板",
            "合同",
            "contract",
            serde_json::json!({
                "contract_type": "PURCHASE",
                "category": "BUSINESS",
                "body": "甲方（以下简称“买方”）：{first_party}\n\n乙方（以下简称“卖方”）：{second_party}\n\n根据《中华人民共和国合同法》及相关法律法规，双方本着平等互利的原则，经友好协商，就采购事宜达成如下协议：\n\n一、采购物品\n{purchase_items}\n\n二、合同金额\n本合同总金额为：{amount} {currency}\n\n三、付款方式\n{payment_terms}\n\n四、交货地点\n{delivery_location}\n\n五、交货时间\n{delivery_date}\n\n六、质量保证\n{quality_terms}\n\n七、双方权利义务\n{rights_obligations}\n\n八、违约责任\n{liability}\n\n九、争议解决\n{dispute_resolution}\n\n十、其他条款\n{other_terms}\n\n甲方（签字盖章）：__________\n日期：{sign_date}\n\n乙方（签字盖章）：__________\n日期：{sign_date}",
                "variables": [
                    {"key": "first_party", "label": "甲方名称", "type": "string", "required": true},
                    {"key": "second_party", "label": "乙方名称", "type": "string", "required": true},
                    {"key": "purchase_items", "label": "采购物品", "type": "textarea", "required": true},
                    {"key": "amount", "label": "合同金额", "type": "number", "required": true},
                    {"key": "currency", "label": "币种", "type": "select", "options": ["CNY", "USD", "EUR"], "default": "CNY"},
                    {"key": "payment_terms", "label": "付款方式", "type": "textarea"},
                    {"key": "delivery_location", "label": "交货地点", "type": "string"},
                    {"key": "delivery_date", "label": "交货时间", "type": "date"},
                    {"key": "quality_terms", "label": "质量保证", "type": "textarea"},
                    {"key": "rights_obligations", "label": "双方权利义务", "type": "textarea"},
                    {"key": "liability", "label": "违约责任", "type": "textarea"},
                    {"key": "dispute_resolution", "label": "争议解决", "type": "textarea"},
                    {"key": "other_terms", "label": "其他条款", "type": "textarea"},
                    {"key": "sign_date", "label": "签署日期", "type": "date"}
                ]
            }),
            vec!["合同", "采购", "标准"],
        ),
        (
            "contract_construction",
            "工程合同模板",
            "合同",
            "contract",
            serde_json::json!({
                "contract_type": "CONSTRUCTION",
                "category": "PROJECT",
                "body": "发包方（甲方）：{first_party}\n\n承包方（乙方）：{second_party}\n\n根据《中华人民共和国合同法》及相关法律法规，双方本着平等互利的原则，经友好协商，就工程施工事宜达成如下协议：\n\n一、工程概况\n{project_overview}\n\n二、工程范围\n{scope_of_work}\n\n三、合同金额\n本合同总金额为：{amount} {currency}\n\n四、付款方式\n{payment_terms}\n\n五、工期\n开工日期：{start_date}\n竣工日期：{end_date}\n\n六、质量标准\n{quality_standard}\n\n七、双方权利义务\n{rights_obligations}\n\n八、安全责任\n{safety_responsibility}\n\n九、违约责任\n{liability}\n\n十、争议解决\n{dispute_resolution}\n\n十一、其他条款\n{other_terms}\n\n甲方（签字盖章）：__________\n日期：{sign_date}\n\n乙方（签字盖章）：__________\n日期：{sign_date}",
                "variables": [
                    {"key": "first_party", "label": "发包方名称", "type": "string", "required": true},
                    {"key": "second_party", "label": "承包方名称", "type": "string", "required": true},
                    {"key": "project_overview", "label": "工程概况", "type": "textarea", "required": true},
                    {"key": "scope_of_work", "label": "工程范围", "type": "textarea", "required": true},
                    {"key": "amount", "label": "合同金额", "type": "number", "required": true},
                    {"key": "currency", "label": "币种", "type": "select", "options": ["CNY", "USD", "EUR"], "default": "CNY"},
                    {"key": "payment_terms", "label": "付款方式", "type": "textarea"},
                    {"key": "start_date", "label": "开工日期", "type": "date", "required": true},
                    {"key": "end_date", "label": "竣工日期", "type": "date", "required": true},
                    {"key": "quality_standard", "label": "质量标准", "type": "textarea"},
                    {"key": "rights_obligations", "label": "双方权利义务", "type": "textarea"},
                    {"key": "safety_responsibility", "label": "安全责任", "type": "textarea"},
                    {"key": "liability", "label": "违约责任", "type": "textarea"},
                    {"key": "dispute_resolution", "label": "争议解决", "type": "textarea"},
                    {"key": "other_terms", "label": "其他条款", "type": "textarea"},
                    {"key": "sign_date", "label": "签署日期", "type": "date"}
                ]
            }),
            vec!["合同", "工程", "项目"],
        ),
        (
            "contract_service",
            "服务合同模板",
            "合同",
            "contract",
            serde_json::json!({
                "contract_type": "SERVICE",
                "category": "BUSINESS",
                "body": "甲方（委托方）：{first_party}\n\n乙方（服务方）：{second_party}\n\n根据《中华人民共和国合同法》及相关法律法规，双方本着平等互利的原则，经友好协商，就服务事宜达成如下协议：\n\n一、服务内容\n{service_content}\n\n二、服务期限\n自{start_date}至{end_date}\n\n三、合同金额\n本合同总金额为：{amount} {currency}\n\n四、付款方式\n{payment_terms}\n\n五、双方权利义务\n{rights_obligations}\n\n六、服务标准\n{service_standard}\n\n七、保密条款\n{confidentiality}\n\n八、违约责任\n{liability}\n\n九、争议解决\n{dispute_resolution}\n\n十、其他条款\n{other_terms}\n\n甲方（签字盖章）：__________\n日期：{sign_date}\n\n乙方（签字盖章）：__________\n日期：{sign_date}",
                "variables": [
                    {"key": "first_party", "label": "委托方名称", "type": "string", "required": true},
                    {"key": "second_party", "label": "服务方名称", "type": "string", "required": true},
                    {"key": "service_content", "label": "服务内容", "type": "textarea", "required": true},
                    {"key": "start_date", "label": "服务开始日期", "type": "date", "required": true},
                    {"key": "end_date", "label": "服务结束日期", "type": "date", "required": true},
                    {"key": "amount", "label": "合同金额", "type": "number", "required": true},
                    {"key": "currency", "label": "币种", "type": "select", "options": ["CNY", "USD", "EUR"], "default": "CNY"},
                    {"key": "payment_terms", "label": "付款方式", "type": "textarea"},
                    {"key": "rights_obligations", "label": "双方权利义务", "type": "textarea"},
                    {"key": "service_standard", "label": "服务标准", "type": "textarea"},
                    {"key": "confidentiality", "label": "保密条款", "type": "textarea"},
                    {"key": "liability", "label": "违约责任", "type": "textarea"},
                    {"key": "dispute_resolution", "label": "争议解决", "type": "textarea"},
                    {"key": "other_terms", "label": "其他条款", "type": "textarea"},
                    {"key": "sign_date", "label": "签署日期", "type": "date"}
                ]
            }),
            vec!["合同", "服务", "标准"],
        ),
        (
            "contract_labor",
            "劳动合同模板",
            "合同",
            "contract",
            serde_json::json!({
                "contract_type": "LABOR",
                "category": "HR",
                "body": "甲方（用人单位）：{company_name}\n\n乙方（劳动者）：{employee_name}\n\n根据《中华人民共和国劳动法》及相关法律法规，双方本着平等自愿、协商一致的原则，达成如下协议：\n\n一、劳动合同期限\n自{start_date}至{end_date}\n\n二、工作内容和工作地点\n{job_content}\n工作地点：{work_location}\n\n三、工作时间和休息休假\n{work_schedule}\n\n四、劳动报酬\n月工资：{salary} {currency}\n支付方式：{payment_method}\n\n五、社会保险和福利待遇\n{benefits}\n\n六、劳动保护和劳动条件\n{labor_protection}\n\n七、双方权利义务\n{rights_obligations}\n\n八、劳动合同的解除和终止\n{termination_terms}\n\n九、违约责任\n{liability}\n\n十、其他条款\n{other_terms}\n\n甲方（盖章）：__________\n法定代表人或授权代表（签字）：__________\n日期：{sign_date}\n\n乙方（签字）：__________\n日期：{sign_date}",
                "variables": [
                    {"key": "company_name", "label": "公司名称", "type": "string", "required": true},
                    {"key": "employee_name", "label": "员工姓名", "type": "string", "required": true},
                    {"key": "start_date", "label": "合同开始日期", "type": "date", "required": true},
                    {"key": "end_date", "label": "合同结束日期", "type": "date"},
                    {"key": "job_content", "label": "工作内容", "type": "textarea", "required": true},
                    {"key": "work_location", "label": "工作地点", "type": "string"},
                    {"key": "work_schedule", "label": "工作时间", "type": "textarea"},
                    {"key": "salary", "label": "月工资", "type": "number", "required": true},
                    {"key": "currency", "label": "币种", "type": "select", "options": ["CNY"], "default": "CNY"},
                    {"key": "payment_method", "label": "支付方式", "type": "string"},
                    {"key": "benefits", "label": "福利待遇", "type": "textarea"},
                    {"key": "labor_protection", "label": "劳动保护", "type": "textarea"},
                    {"key": "rights_obligations", "label": "双方权利义务", "type": "textarea"},
                    {"key": "termination_terms", "label": "解除和终止条款", "type": "textarea"},
                    {"key": "liability", "label": "违约责任", "type": "textarea"},
                    {"key": "other_terms", "label": "其他条款", "type": "textarea"},
                    {"key": "sign_date", "label": "签署日期", "type": "date"}
                ]
            }),
            vec!["合同", "劳动", "HR"],
        ),
        (
            "contract_confidentiality",
            "保密协议模板",
            "合同",
            "contract",
            serde_json::json!({
                "contract_type": "CONFIDENTIALITY",
                "category": "LEGAL",
                "body": "甲方（披露方）：{first_party}\n\n乙方（接收方）：{second_party}\n\n根据《中华人民共和国反不正当竞争法》及相关法律法规，双方经友好协商，就保密事宜达成如下协议：\n\n一、保密信息定义\n{confidential_definition}\n\n二、保密义务\n{confidential_obligations}\n\n三、保密期限\n自本协议签订之日起{confidential_period}\n\n四、信息使用限制\n{usage_restrictions}\n\n五、信息披露限制\n{disclosure_restrictions}\n\n六、例外情况\n{exceptions}\n\n七、双方权利义务\n{rights_obligations}\n\n八、违约责任\n{liability}\n\n九、争议解决\n{dispute_resolution}\n\n十、其他条款\n{other_terms}\n\n甲方（签字盖章）：__________\n日期：{sign_date}\n\n乙方（签字盖章）：__________\n日期：{sign_date}",
                "variables": [
                    {"key": "first_party", "label": "披露方名称", "type": "string", "required": true},
                    {"key": "second_party", "label": "接收方名称", "type": "string", "required": true},
                    {"key": "confidential_definition", "label": "保密信息定义", "type": "textarea", "required": true},
                    {"key": "confidential_obligations", "label": "保密义务", "type": "textarea", "required": true},
                    {"key": "confidential_period", "label": "保密期限", "type": "string", "default": "长期有效"},
                    {"key": "usage_restrictions", "label": "使用限制", "type": "textarea"},
                    {"key": "disclosure_restrictions", "label": "披露限制", "type": "textarea"},
                    {"key": "exceptions", "label": "例外情况", "type": "textarea"},
                    {"key": "rights_obligations", "label": "双方权利义务", "type": "textarea"},
                    {"key": "liability", "label": "违约责任", "type": "textarea"},
                    {"key": "dispute_resolution", "label": "争议解决", "type": "textarea"},
                    {"key": "other_terms", "label": "其他条款", "type": "textarea"},
                    {"key": "sign_date", "label": "签署日期", "type": "date"}
                ]
            }),
            vec!["合同", "保密", "法务"],
        ),
        (
            "material_raw",
            "原材料",
            "物料",
            "material",
            serde_json::json!({"name": "", "unit": ""}),
            vec!["物料", "原材料"],
        ),
        (
            "ai_content_optimize",
            "内容优化",
            "AI助手",
            "ai_prompt",
            serde_json::json!({"prompt": "请优化以下内容：{content}", "variables": ["content"]}),
            vec!["AI助手", "内容优化"],
        ),
        (
            "ai_document_summary",
            "文档摘要",
            "AI助手",
            "ai_prompt",
            serde_json::json!({"prompt": "请为以下文档生成摘要：{document}", "variables": ["document"]}),
            vec!["AI助手", "文档"],
        ),
        (
            "cms_news",
            "新闻公告",
            "内容管理",
            "cms_content",
            serde_json::json!({"title": "", "content": "", "summary": ""}),
            vec!["内容管理", "新闻"],
        ),
        (
            "cms_product",
            "产品介绍",
            "内容管理",
            "cms_content",
            serde_json::json!({"name": "", "description": "", "specifications": ""}),
            vec!["内容管理", "产品"],
        ),
    ];
    
    for (code, name, category, template_type, content, tags) in default_templates {
        let id = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO templates (
                id, code, name, category, template_type, content, tags,
                is_system, is_default, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, $8, $8)
            ON CONFLICT (code) DO NOTHING
            "#,
        )
        .bind(id)
        .bind(code)
        .bind(name)
        .bind(category)
        .bind(template_type)
        .bind(content)
        .bind(tags)
        .bind(now)
        .execute(pool)
        .await?;
    }
    
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TemplateVersion {
    pub id: Uuid,
    pub template_id: Uuid,
    pub version_number: i32,
    pub version_name: Option<String>,
    pub content: serde_json::Value,
    pub description: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

pub async fn create_version(
    pool: &PgPool,
    template_id: Uuid,
    content: serde_json::Value,
    version_name: Option<String>,
    description: Option<String>,
    created_by: Option<Uuid>,
) -> Result<TemplateVersion, sqlx::Error> {
    let max_version = sqlx::query_scalar::<_, i32>(
        "SELECT COALESCE(MAX(version_number), 0) FROM template_versions WHERE template_id = $1",
    )
    .bind(template_id)
    .fetch_one(pool)
    .await?;
    
    let new_version = max_version + 1;
    let id = Uuid::new_v4();
    
    let version = sqlx::query_as::<_, TemplateVersion>(
        r#"
        INSERT INTO template_versions (
            id, template_id, version_number, version_name, content, description, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(template_id)
    .bind(new_version)
    .bind(version_name)
    .bind(content)
    .bind(description)
    .bind(created_by)
    .fetch_one(pool)
    .await?;
    
    Ok(version)
}

pub async fn get_versions(pool: &PgPool, template_id: Uuid) -> Result<Vec<TemplateVersion>, sqlx::Error> {
    let versions = sqlx::query_as::<_, TemplateVersion>(
        "SELECT * FROM template_versions WHERE template_id = $1 ORDER BY version_number DESC",
    )
    .bind(template_id)
    .fetch_all(pool)
    .await?;
    
    Ok(versions)
}

pub async fn get_version(pool: &PgPool, template_id: Uuid, version_number: i32) -> Result<Option<TemplateVersion>, sqlx::Error> {
    let version = sqlx::query_as::<_, TemplateVersion>(
        "SELECT * FROM template_versions WHERE template_id = $1 AND version_number = $2",
    )
    .bind(template_id)
    .bind(version_number)
    .fetch_optional(pool)
    .await?;
    
    Ok(version)
}

pub async fn rollback_to_version(
    pool: &PgPool,
    template_id: Uuid,
    version_number: i32,
) -> Result<Template, sqlx::Error> {
    let version = sqlx::query_as::<_, TemplateVersion>(
        "SELECT * FROM template_versions WHERE template_id = $1 AND version_number = $2",
    )
    .bind(template_id)
    .bind(version_number)
    .fetch_one(pool)
    .await?;
    
    let new_version_num = sqlx::query_scalar::<_, i32>(
        "SELECT COALESCE(MAX(version_number), 0) + 1 FROM template_versions WHERE template_id = $1",
    )
    .bind(template_id)
    .fetch_one(pool)
    .await?;
    
    sqlx::query(
        r#"
        INSERT INTO template_versions (
            id, template_id, version_number, version_name, content, description
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
        "#,
    )
    .bind(template_id)
    .bind(new_version_num)
    .bind(format!("回滚到版本 {}", version_number))
    .bind(&version.content)
    .bind("通过版本回滚恢复")
    .execute(pool)
    .await?;
    
    let updated_template = sqlx::query_as::<_, Template>(
        r#"
        UPDATE templates
        SET content = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(template_id)
    .bind(&version.content)
    .fetch_one(pool)
    .await?;
    
    Ok(updated_template)
}

pub async fn delete_version(pool: &PgPool, template_id: Uuid, version_number: i32) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "DELETE FROM template_versions WHERE template_id = $1 AND version_number = $2",
    )
    .bind(template_id)
    .bind(version_number)
    .execute(pool)
    .await?;
    
    Ok(result.rows_affected() > 0)
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TemplatePermission {
    pub id: Uuid,
    pub template_id: Uuid,
    pub permission_type: String,
    pub target_id: String,
    pub target_name: Option<String>,
    pub access_level: String,
    pub created_at: DateTime<Utc>,
}

pub async fn get_template_permissions(
    pool: &PgPool,
    template_id: Uuid,
) -> Result<Vec<TemplatePermission>, sqlx::Error> {
    let permissions = sqlx::query_as::<_, TemplatePermission>(
        "SELECT * FROM template_permissions WHERE template_id = $1 ORDER BY created_at DESC",
    )
    .bind(template_id)
    .fetch_all(pool)
    .await?;
    
    Ok(permissions)
}

pub async fn add_template_permission(
    pool: &PgPool,
    template_id: Uuid,
    permission_type: &str,
    target_id: &str,
    target_name: Option<&str>,
    access_level: &str,
) -> Result<TemplatePermission, sqlx::Error> {
    let id = Uuid::new_v4();
    
    let permission = sqlx::query_as::<_, TemplatePermission>(
        r#"
        INSERT INTO template_permissions (
            id, template_id, permission_type, target_id, target_name, access_level
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(template_id)
    .bind(permission_type)
    .bind(target_id)
    .bind(target_name)
    .bind(access_level)
    .fetch_one(pool)
    .await?;
    
    Ok(permission)
}

pub async fn remove_template_permission(
    pool: &PgPool,
    id: Uuid,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "DELETE FROM template_permissions WHERE id = $1",
    )
    .bind(id)
    .execute(pool)
    .await?;
    
    Ok(result.rows_affected() > 0)
}

pub async fn check_user_access(
    pool: &PgPool,
    template_id: Uuid,
    user_id: Uuid,
    required_level: &str,
) -> Result<bool, sqlx::Error> {
    let query = r#"
        SELECT access_level FROM template_permissions
        WHERE template_id = $1
        AND (
            (permission_type = 'user' AND target_id = $2)
            OR (permission_type = 'role' AND target_id IN (
                SELECT role_id FROM user_roles WHERE user_id = $2
            ))
            OR (permission_type = 'department' AND target_id IN (
                SELECT department_id FROM user_departments WHERE user_id = $2
            ))
            OR (permission_type = 'organization' AND target_id IN (
                SELECT organization_id FROM user_organizations WHERE user_id = $2
            ))
        )
        ORDER BY 
            CASE access_level WHEN 'admin' THEN 3 WHEN 'write' THEN 2 WHEN 'read' THEN 1 END DESC
        LIMIT 1
    "#;
    
    let access_level: Option<String> = sqlx::query_scalar(query)
        .bind(template_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;
    
    let level_order = |level: &str| match level {
        "admin" => 3,
        "write" => 2,
        "read" => 1,
        _ => 0,
    };
    
    if let Some(level) = access_level {
        return Ok(level_order(&level) >= level_order(required_level));
    }
    
    Ok(false)
}
