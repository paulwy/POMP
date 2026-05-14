use crate::db::dict::{
    CreateDictItem, CreateDictType, DictItem, DictType, DictTypeWithItems, UpdateDictItem,
    UpdateDictType,
};
use crate::db::dict_repo;
use crate::db::DbPool;
use thiserror::Error;
use uuid::Uuid;

#[derive(Error, Debug)]
pub enum DictServiceError {
    #[error("数据库错误: {0}")]
    DatabaseError(#[from] sqlx::Error),
    #[error("字典类型不存在: {0}")]
    DictTypeNotFound(String),
    #[error("字典项不存在: {0}")]
    DictItemNotFound(String),
    #[error("字典编码已存在: {0}")]
    DictCodeExists(String),
}

pub struct DictService {
    pool: DbPool,
}

impl DictService {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create_dict_type(
        &self,
        data: CreateDictType,
    ) -> Result<DictType, DictServiceError> {
        if let Some(existing) = dict_repo::get_dict_type_by_code(&self.pool, &data.code).await? {
            return Err(DictServiceError::DictCodeExists(existing.code));
        }

        let dict_type = dict_repo::create_dict_type(&self.pool, data).await?;
        Ok(dict_type)
    }

    pub async fn get_dict_type(&self, id: Uuid) -> Result<DictType, DictServiceError> {
        let dict_type = dict_repo::get_dict_type_by_id(&self.pool, id).await?;
        Ok(dict_type)
    }

    pub async fn get_dict_types(
        &self,
        category: Option<String>,
        is_active: Option<bool>,
    ) -> Result<Vec<DictType>, DictServiceError> {
        let types = dict_repo::get_dict_types(&self.pool, category, is_active).await?;
        Ok(types)
    }

    pub async fn get_dict_type_with_items(
        &self,
        id: Uuid,
    ) -> Result<DictTypeWithItems, DictServiceError> {
        let result = dict_repo::get_dict_type_with_items(&self.pool, id).await?;
        Ok(result)
    }

    pub async fn update_dict_type(
        &self,
        id: Uuid,
        data: UpdateDictType,
    ) -> Result<DictType, DictServiceError> {
        let dict_type = dict_repo::update_dict_type(&self.pool, id, data).await?;
        Ok(dict_type)
    }

    pub async fn delete_dict_type(&self, id: Uuid) -> Result<(), DictServiceError> {
        dict_repo::delete_dict_type(&self.pool, id).await?;
        Ok(())
    }

    pub async fn create_dict_item(
        &self,
        data: CreateDictItem,
    ) -> Result<DictItem, DictServiceError> {
        let item = dict_repo::create_dict_item(&self.pool, data).await?;
        Ok(item)
    }

    pub async fn get_dict_item(&self, id: Uuid) -> Result<DictItem, DictServiceError> {
        let item = dict_repo::get_dict_item_by_id(&self.pool, id).await?;
        Ok(item)
    }

    pub async fn get_dict_items_by_type(
        &self,
        dict_type_id: Uuid,
    ) -> Result<Vec<DictItem>, DictServiceError> {
        let items = dict_repo::get_dict_items_by_type(&self.pool, dict_type_id).await?;
        Ok(items)
    }

    pub async fn get_dict_items_by_code(
        &self,
        dict_type_code: &str,
    ) -> Result<Vec<DictItem>, DictServiceError> {
        let items = dict_repo::get_dict_items_by_code(&self.pool, dict_type_code).await?;
        Ok(items)
    }

    pub async fn update_dict_item(
        &self,
        id: Uuid,
        data: UpdateDictItem,
    ) -> Result<DictItem, DictServiceError> {
        let item = dict_repo::update_dict_item(&self.pool, id, data).await?;
        Ok(item)
    }

    pub async fn delete_dict_item(&self, id: Uuid) -> Result<(), DictServiceError> {
        dict_repo::delete_dict_item(&self.pool, id).await?;
        Ok(())
    }

    pub async fn get_all_active_dict_types(
        &self,
    ) -> Result<Vec<DictTypeWithItems>, DictServiceError> {
        let result = dict_repo::get_all_active_dict_types(&self.pool).await?;
        Ok(result)
    }

    pub async fn init_default_dicts(&self) -> Result<(), DictServiceError> {
        self.init_department_dicts().await?;
        self.init_position_dicts().await?;
        self.init_product_dicts().await?;
        self.init_project_dicts().await?;
        self.init_customer_dicts().await?;
        self.init_contract_dicts().await?;
        self.init_approval_dicts().await?;
        self.init_article_dicts().await?;
        Ok(())
    }

    async fn init_article_dicts(&self) -> Result<(), DictServiceError> {
        // 先尝试获取现有的字典类型
        let article_cat_type =
            match dict_repo::get_dict_type_by_code(&self.pool, "article_category").await? {
                Some(existing) => existing,
                None => {
                    // 如果不存在，创建新的
                    dict_repo::create_dict_type(
                        &self.pool,
                        CreateDictType {
                            code: "article_category".to_string(),
                            name: "文章分类".to_string(),
                            description: Some("文章内容分类字典".to_string()),
                            category: "CMS".to_string(),
                            parent_id: None,
                            sort_order: Some(1),
                            is_system: Some(true),
                        },
                    )
                    .await?
                }
            };

        // 检查是否已有字典项，如果没有则创建
        let existing_items =
            dict_repo::get_dict_items_by_type(&self.pool, article_cat_type.id).await?;
        if existing_items.is_empty() {
            let categories = [
                ("products", "产品中心", "产品展示和介绍"),
                ("news", "新闻动态", "公司新闻和行业资讯"),
                ("about", "关于我们", "公司介绍和联系方式"),
                ("services", "服务项目", "服务内容展示"),
                ("cases", "案例展示", "成功案例分享"),
            ];

            for (i, (code, name, desc)) in categories.iter().enumerate() {
                let _ = dict_repo::create_dict_item(
                    &self.pool,
                    CreateDictItem {
                        dict_type_id: article_cat_type.id,
                        code: code.to_string(),
                        name: name.to_string(),
                        value: Some(desc.to_string()),
                        sort_order: Some(i as i32),
                        is_default: None,
                    },
                )
                .await;
            }
        }

        Ok(())
    }

    async fn init_department_dicts(&self) -> Result<(), DictServiceError> {
        let dept_type = dict_repo::create_dict_type(
            &self.pool,
            CreateDictType {
                code: "DEPT".to_string(),
                name: "部门分类".to_string(),
                description: Some("公司部门组织架构分类".to_string()),
                category: "ORGANIZATION".to_string(),
                parent_id: None,
                sort_order: Some(1),
                is_system: Some(true),
            },
        )
        .await;

        if dept_type.is_err() {
            return Ok(());
        }

        let dept_type = dept_type.unwrap();

        let depts = vec![
            ("EXEC", "执行委员会", "公司最高决策层"),
            ("ADMIN", "行政管理部", "行政后勤、档案、证照"),
            ("HR", "人力资源部", "招聘、培训、考勤、薪酬"),
            ("FIN", "财务部", "会计、出纳、税务、成本"),
            ("LEGAL", "法务合同部", "合同管理、风控合规"),
            ("SALES", "营销中心", "市场、招投标、客户"),
            ("PROD", "生产部", "外加剂生产、岩棉生产"),
            ("ENG", "工程部", "工程施工、项目管理"),
            ("RD", "研发中心", "产品研发、实验室"),
            ("SCM", "供应链部", "采购、仓储、物流"),
            ("QC", "质量管控部", "质检、计量、设备"),
            ("EHS", "安全环保部", "安全生产、环境保护"),
        ];

        for (i, (code, name, desc)) in depts.iter().enumerate() {
            let _ = dict_repo::create_dict_item(
                &self.pool,
                CreateDictItem {
                    dict_type_id: dept_type.id,
                    code: code.to_string(),
                    name: name.to_string(),
                    value: Some(desc.to_string()),
                    sort_order: Some(i as i32),
                    is_default: None,
                },
            )
            .await;
        }

        Ok(())
    }

    async fn init_position_dicts(&self) -> Result<(), DictServiceError> {
        let pos_type = dict_repo::create_dict_type(
            &self.pool,
            CreateDictType {
                code: "POSITION_LEVEL".to_string(),
                name: "职位级别".to_string(),
                description: Some("公司职位级别体系".to_string()),
                category: "ORGANIZATION".to_string(),
                parent_id: None,
                sort_order: Some(2),
                is_system: Some(true),
            },
        )
        .await;

        if pos_type.is_err() {
            return Ok(());
        }

        let pos_type = pos_type.unwrap();

        let levels = [
            ("L1", "董事长/总经理", "1"),
            ("L2", "副总经理", "2"),
            ("L3", "总监", "3"),
            ("L4", "部门经理", "4"),
            ("L5", "主管", "5"),
            ("L6", "专员", "6"),
            ("L7", "助理", "7"),
        ];

        for (i, (code, name, value)) in levels.iter().enumerate() {
            let _ = dict_repo::create_dict_item(
                &self.pool,
                CreateDictItem {
                    dict_type_id: pos_type.id,
                    code: code.to_string(),
                    name: name.to_string(),
                    value: Some(value.to_string()),
                    sort_order: Some(i as i32),
                    is_default: None,
                },
            )
            .await;
        }

        Ok(())
    }

    async fn init_product_dicts(&self) -> Result<(), DictServiceError> {
        let prod_cat_type = dict_repo::create_dict_type(
            &self.pool,
            CreateDictType {
                code: "PRODUCT_CATEGORY".to_string(),
                name: "产品分类".to_string(),
                description: Some("产品分类字典".to_string()),
                category: "PRODUCT".to_string(),
                parent_id: None,
                sort_order: Some(1),
                is_system: Some(true),
            },
        )
        .await;

        if prod_cat_type.is_err() {
            return Ok(());
        }

        let prod_cat_type = prod_cat_type.unwrap();

        let categories = [
            ("ADDITIVE", "混凝土外加剂", "减水剂、引气剂、缓凝剂等"),
            ("INSULATION", "保温材料", "岩棉板、管，玻璃棉等"),
            ("MATERIAL", "原材料", "生产用化工原料"),
            ("EQUIP", "设备配件", "生产设备、维修配件"),
        ];

        for (i, (code, name, desc)) in categories.iter().enumerate() {
            let _ = dict_repo::create_dict_item(
                &self.pool,
                CreateDictItem {
                    dict_type_id: prod_cat_type.id,
                    code: code.to_string(),
                    name: name.to_string(),
                    value: Some(desc.to_string()),
                    sort_order: Some(i as i32),
                    is_default: None,
                },
            )
            .await;
        }

        let additive_type = dict_repo::create_dict_type(
            &self.pool,
            CreateDictType {
                code: "ADDITIVE_TYPE".to_string(),
                name: "外加剂类型".to_string(),
                description: Some("混凝土外加剂类型".to_string()),
                category: "PRODUCT".to_string(),
                parent_id: None,
                sort_order: Some(2),
                is_system: Some(true),
            },
        )
        .await;

        if additive_type.is_err() {
            return Ok(());
        }

        let additive_type = additive_type.unwrap();

        let additives = [
            ("WR", "减水剂"),
            ("AE", "引气剂"),
            ("RG", "缓凝剂"),
            ("AE_EARLY", "早强剂"),
        ];

        for (i, (code, name)) in additives.iter().enumerate() {
            let _ = dict_repo::create_dict_item(
                &self.pool,
                CreateDictItem {
                    dict_type_id: additive_type.id,
                    code: code.to_string(),
                    name: name.to_string(),
                    value: None,
                    sort_order: Some(i as i32),
                    is_default: None,
                },
            )
            .await;
        }

        Ok(())
    }

    async fn init_project_dicts(&self) -> Result<(), DictServiceError> {
        let proj_type = dict_repo::create_dict_type(
            &self.pool,
            CreateDictType {
                code: "PROJECT_TYPE".to_string(),
                name: "工程类型".to_string(),
                description: Some("工程项目类型分类".to_string()),
                category: "PROJECT".to_string(),
                parent_id: None,
                sort_order: Some(1),
                is_system: Some(true),
            },
        )
        .await;

        if proj_type.is_err() {
            return Ok(());
        }

        let proj_type = proj_type.unwrap();

        let proj_types = [
            ("HIGH_RAIL", "高铁维护工程", "高铁线路维护、基础设施服务"),
            ("BUILD_INSUL", "建筑保温工程", "外墙保温、屋面保温施工"),
            ("ULTRA_LOW", "超低能耗建筑", "绿色建筑、节能改造"),
            ("RENOVATION", "改造工程", "建筑改造、加固工程"),
            ("MAINTENANCE", "维修服务", "设备维护、技术服务"),
        ];

        for (i, (code, name, desc)) in proj_types.iter().enumerate() {
            let _ = dict_repo::create_dict_item(
                &self.pool,
                CreateDictItem {
                    dict_type_id: proj_type.id,
                    code: code.to_string(),
                    name: name.to_string(),
                    value: Some(desc.to_string()),
                    sort_order: Some(i as i32),
                    is_default: None,
                },
            )
            .await;
        }

        let proj_status = dict_repo::create_dict_type(
            &self.pool,
            CreateDictType {
                code: "PROJECT_STATUS".to_string(),
                name: "工程状态".to_string(),
                description: Some("工程项目状态".to_string()),
                category: "PROJECT".to_string(),
                parent_id: None,
                sort_order: Some(2),
                is_system: Some(true),
            },
        )
        .await;

        if proj_status.is_err() {
            return Ok(());
        }

        let proj_status = proj_status.unwrap();

        let statuses = [
            ("PREPARE", "准备阶段"),
            ("BIDDING", "招投标中"),
            ("CONTRACTED", "已签约"),
            ("IN_PROGRESS", "施工中"),
            ("COMPLETED", "已竣工"),
            ("SETTLED", "已结算"),
            ("CLOSED", "已关闭"),
        ];

        for (i, (code, name)) in statuses.iter().enumerate() {
            let _ = dict_repo::create_dict_item(
                &self.pool,
                CreateDictItem {
                    dict_type_id: proj_status.id,
                    code: code.to_string(),
                    name: name.to_string(),
                    value: None,
                    sort_order: Some(i as i32),
                    is_default: None,
                },
            )
            .await;
        }

        Ok(())
    }

    async fn init_customer_dicts(&self) -> Result<(), DictServiceError> {
        let cust_industry = dict_repo::create_dict_type(
            &self.pool,
            CreateDictType {
                code: "CUSTOMER_INDUSTRY".to_string(),
                name: "客户行业".to_string(),
                description: Some("客户所在行业分类".to_string()),
                category: "CUSTOMER".to_string(),
                parent_id: None,
                sort_order: Some(1),
                is_system: Some(true),
            },
        )
        .await;

        if cust_industry.is_err() {
            return Ok(());
        }

        let cust_industry = cust_industry.unwrap();

        let industries = [
            ("HIGH_RAILWAY", "高铁建设"),
            ("BUILDING", "建筑施工"),
            ("MUNICIPAL", "市政工程"),
            ("REAL_ESTATE", "房地产"),
            ("INDUSTRIAL", "工业厂房"),
        ];

        for (i, (code, name)) in industries.iter().enumerate() {
            let _ = dict_repo::create_dict_item(
                &self.pool,
                CreateDictItem {
                    dict_type_id: cust_industry.id,
                    code: code.to_string(),
                    name: name.to_string(),
                    value: None,
                    sort_order: Some(i as i32),
                    is_default: None,
                },
            )
            .await;
        }

        let cust_level = dict_repo::create_dict_type(
            &self.pool,
            CreateDictType {
                code: "CUSTOMER_LEVEL".to_string(),
                name: "客户等级".to_string(),
                description: Some("客户等级分类".to_string()),
                category: "CUSTOMER".to_string(),
                parent_id: None,
                sort_order: Some(2),
                is_system: Some(true),
            },
        )
        .await;

        if cust_level.is_err() {
            return Ok(());
        }

        let cust_level = cust_level.unwrap();

        let levels = [
            ("AAA", "战略客户", "0.9"),
            ("AA", "重点客户", "0.95"),
            ("A", "普通客户", "1.0"),
            ("B", "观察客户", "1.0"),
        ];

        for (i, (code, name, value)) in levels.iter().enumerate() {
            let _ = dict_repo::create_dict_item(
                &self.pool,
                CreateDictItem {
                    dict_type_id: cust_level.id,
                    code: code.to_string(),
                    name: name.to_string(),
                    value: Some(value.to_string()),
                    sort_order: Some(i as i32),
                    is_default: None,
                },
            )
            .await;
        }

        Ok(())
    }

    async fn init_contract_dicts(&self) -> Result<(), DictServiceError> {
        let contract_type = dict_repo::create_dict_type(
            &self.pool,
            CreateDictType {
                code: "CONTRACT_TYPE".to_string(),
                name: "合同类型".to_string(),
                description: Some("合同类型分类".to_string()),
                category: "CONTRACT".to_string(),
                parent_id: None,
                sort_order: Some(1),
                is_system: Some(true),
            },
        )
        .await;

        if contract_type.is_err() {
            return Ok(());
        }

        let contract_type = contract_type.unwrap();

        let types = [
            ("SALES", "销售合同", "SALES"),
            ("PURCHASE", "采购合同", "SCM"),
            ("ENG_CONTRACT", "工程施工合同", "ENG"),
            ("SUB_CONTRACT", "分包合同", "ENG"),
            ("SERVICE", "服务合同", "EXEC"),
            ("RD_COOP", "研发合作协议", "RD"),
            ("LEASE", "租赁合同", "ADMIN"),
        ];

        for (i, (code, name, dept)) in types.iter().enumerate() {
            let _ = dict_repo::create_dict_item(
                &self.pool,
                CreateDictItem {
                    dict_type_id: contract_type.id,
                    code: code.to_string(),
                    name: name.to_string(),
                    value: Some(dept.to_string()),
                    sort_order: Some(i as i32),
                    is_default: None,
                },
            )
            .await;
        }

        let contract_status = dict_repo::create_dict_type(
            &self.pool,
            CreateDictType {
                code: "CONTRACT_STATUS".to_string(),
                name: "合同状态".to_string(),
                description: Some("合同生命周期状态".to_string()),
                category: "CONTRACT".to_string(),
                parent_id: None,
                sort_order: Some(2),
                is_system: Some(true),
            },
        )
        .await;

        if contract_status.is_err() {
            return Ok(());
        }

        let contract_status = contract_status.unwrap();

        let statuses = [
            ("DRAFT", "草稿"),
            ("REVIEWING", "评审中"),
            ("APPROVED", "已审批"),
            ("SIGNED", "已签署"),
            ("EXECUTING", "执行中"),
            ("COMPLETED", "已完成"),
            ("TERMINATED", "已终止"),
            ("ARCHIVED", "已归档"),
        ];

        for (i, (code, name)) in statuses.iter().enumerate() {
            let _ = dict_repo::create_dict_item(
                &self.pool,
                CreateDictItem {
                    dict_type_id: contract_status.id,
                    code: code.to_string(),
                    name: name.to_string(),
                    value: None,
                    sort_order: Some(i as i32),
                    is_default: None,
                },
            )
            .await;
        }

        Ok(())
    }

    async fn init_approval_dicts(&self) -> Result<(), DictServiceError> {
        let approval_type = dict_repo::create_dict_type(
            &self.pool,
            CreateDictType {
                code: "APPROVAL_TYPE".to_string(),
                name: "审批类型".to_string(),
                description: Some("审批流程类型".to_string()),
                category: "APPROVAL".to_string(),
                parent_id: None,
                sort_order: Some(1),
                is_system: Some(true),
            },
        )
        .await;

        if approval_type.is_err() {
            return Ok(());
        }

        let approval_type = approval_type.unwrap();

        let types = vec![
            ("HR_ENTRY", "入职申请", "HR"),
            ("HR_LEAVE", "离职申请", "HR"),
            ("HR_TRANSFER", "调岗申请", "HR"),
            ("FIN_EXPENSE", "费用报销", "FIN"),
            ("FIN_PAYMENT", "付款申请", "FIN"),
            ("PUR_REQUIRE", "采购需求", "SCM"),
            ("PUR_ORDER", "采购订单", "SCM"),
            ("PROJ_START", "项目立项", "ENG"),
            ("PROJ_CHANGE", "项目变更", "ENG"),
            ("CONTRACT_REVIEW", "合同评审", "LEGAL"),
            ("FIELD_CHECKIN", "外勤签到", "ENG"),
        ];

        for (i, (code, name, dept)) in types.iter().enumerate() {
            let _ = dict_repo::create_dict_item(
                &self.pool,
                CreateDictItem {
                    dict_type_id: approval_type.id,
                    code: code.to_string(),
                    name: name.to_string(),
                    value: Some(dept.to_string()),
                    sort_order: Some(i as i32),
                    is_default: None,
                },
            )
            .await;
        }

        Ok(())
    }
}
