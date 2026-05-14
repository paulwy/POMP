use crate::db::contract::{
    Contract, ContractTemplate, CreateContract, CreateContractTemplate, UpdateContract,
    UpdateContractTemplate,
};
use crate::db::contract_repo;
use crate::db::DbPool;
use thiserror::Error;
use uuid::Uuid;

#[derive(Error, Debug)]
pub enum ContractServiceError {
    #[error("数据库错误: {0}")]
    DatabaseError(#[from] sqlx::Error),
    #[error("合同模板不存在: {0}")]
    TemplateNotFound(String),
    #[error("合同不存在: {0}")]
    ContractNotFound(String),
    #[error("合同模板编码已存在: {0}")]
    TemplateCodeExists(String),
}

pub struct ContractService {
    pool: DbPool,
}

impl ContractService {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create_contract_template(
        &self,
        data: CreateContractTemplate,
    ) -> Result<ContractTemplate, ContractServiceError> {
        let existing = contract_repo::get_contract_template_by_code(&self.pool, &data.code).await?;
        if existing.is_some() {
            return Err(ContractServiceError::TemplateCodeExists(data.code));
        }

        let template = contract_repo::create_contract_template(&self.pool, data).await?;
        Ok(template)
    }

    pub async fn get_contract_template(
        &self,
        id: Uuid,
    ) -> Result<ContractTemplate, ContractServiceError> {
        let template = contract_repo::get_contract_template_by_id(&self.pool, id).await?;
        template.ok_or_else(|| ContractServiceError::TemplateNotFound(id.to_string()))
    }

    pub async fn get_contract_templates(
        &self,
        contract_type: Option<String>,
        category: Option<String>,
        is_active: Option<bool>,
    ) -> Result<Vec<ContractTemplate>, ContractServiceError> {
        let templates = contract_repo::get_contract_templates(
            &self.pool,
            contract_type.as_deref(),
            category.as_deref(),
            is_active,
        )
        .await?;
        Ok(templates)
    }

    pub async fn update_contract_template(
        &self,
        id: Uuid,
        data: UpdateContractTemplate,
    ) -> Result<ContractTemplate, ContractServiceError> {
        let template = contract_repo::update_contract_template(&self.pool, id, data).await?;
        Ok(template)
    }

    pub async fn delete_contract_template(&self, id: Uuid) -> Result<(), ContractServiceError> {
        contract_repo::delete_contract_template(&self.pool, id).await?;
        Ok(())
    }

    pub async fn create_contract(
        &self,
        data: CreateContract,
    ) -> Result<Contract, ContractServiceError> {
        let mut content = data.content.clone();
        let mut content_rendered = data.content_rendered.clone();

        if let Some(template_id) = data.template_id {
            let template =
                contract_repo::get_contract_template_by_id(&self.pool, template_id).await?;
            if let Some(template) = template {
                if content.is_none() {
                    content = Some(template.content.clone());
                }
                if content_rendered.is_none() {
                    content_rendered = Some(template.content.clone());
                }
            }
        }

        let data_with_content = CreateContract {
            content,
            content_rendered,
            ..data
        };

        let contract = contract_repo::create_contract(&self.pool, data_with_content).await?;
        Ok(contract)
    }

    pub async fn get_contract(&self, id: Uuid) -> Result<Contract, ContractServiceError> {
        let contract = contract_repo::get_contract_by_id(&self.pool, id).await?;
        contract.ok_or_else(|| ContractServiceError::ContractNotFound(id.to_string()))
    }

    pub async fn get_contracts(
        &self,
        status: Option<String>,
        contract_type: Option<String>,
        category: Option<String>,
        page: Option<i32>,
        page_size: Option<i32>,
    ) -> Result<Vec<Contract>, ContractServiceError> {
        let contracts = contract_repo::get_contracts(
            &self.pool,
            status.as_deref(),
            contract_type.as_deref(),
            category.as_deref(),
            page,
            page_size,
        )
        .await?;
        Ok(contracts)
    }

    pub async fn update_contract(
        &self,
        id: Uuid,
        data: UpdateContract,
    ) -> Result<Contract, ContractServiceError> {
        let contract = contract_repo::update_contract(&self.pool, id, data).await?;
        Ok(contract)
    }

    pub async fn delete_contract(&self, id: Uuid) -> Result<(), ContractServiceError> {
        contract_repo::delete_contract(&self.pool, id).await?;
        Ok(())
    }

    pub async fn init_default_templates(&self) -> Result<(), ContractServiceError> {
        let default_templates = vec![
            CreateContractTemplate {
                code: "SALES_CONTRACT".to_string(),
                name: "销售合同模板".to_string(),
                description: Some("产品销售合同标准模板".to_string()),
                contract_type: "SALES".to_string(),
                category: "BUSINESS".to_string(),
                content: r#"
# 销售合同

甲方：{first_party}
乙方：{second_party}

## 第一条 产品信息

1. 产品名称：{product_name}
2. 规格型号：{product_spec}
3. 数量：{quantity}
4. 单价：{unit_price}元
5. 总金额：{total_amount}元

## 第二条 付款方式

{payment_method}

## 第三条 交付时间

{delivery_date}

## 第四条 违约责任

双方应严格履行合同义务，如有违约，应承担相应违约责任。

## 第五条 争议解决

因本合同引起的争议，双方协商解决；协商不成的，向甲方所在地人民法院起诉。

甲方（盖章）：________________  乙方（盖章）：________________
签字：________________________  签字：________________________
日期：{sign_date}              日期：{sign_date}
            "#.to_string(),
                variables: Some(r#"["first_party","second_party","product_name","product_spec","quantity","unit_price","total_amount","payment_method","delivery_date","sign_date"]"#.to_string()),
                version: Some("1.0".to_string()),
                is_active: Some(true),
                is_system: Some(true),
                sort_order: Some(1),
            },
            CreateContractTemplate {
                code: "PURCHASE_CONTRACT".to_string(),
                name: "采购合同模板".to_string(),
                description: Some("物资采购合同标准模板".to_string()),
                contract_type: "PURCHASE".to_string(),
                category: "BUSINESS".to_string(),
                content: r#"
# 采购合同

甲方（采购方）：{first_party}
乙方（供应方）：{second_party}

## 第一条 采购内容

1. 货物名称：{product_name}
2. 规格型号：{product_spec}
3. 数量：{quantity}
4. 单价：{unit_price}元
5. 总金额：{total_amount}元

## 第二条 质量标准

{quality_standard}

## 第三条 交货地点及时间

1. 交货地点：{delivery_location}
2. 交货时间：{delivery_date}

## 第四条 付款方式

{payment_method}

## 第五条 验收标准

{acceptance_standard}

## 第六条 违约责任

双方应严格履行合同义务，如有违约，应承担相应违约责任。

## 第七条 争议解决

因本合同引起的争议，双方协商解决；协商不成的，向合同履行地人民法院起诉。

甲方（盖章）：________________  乙方（盖章）：________________
签字：________________________  签字：________________________
日期：{sign_date}              日期：{sign_date}
            "#.to_string(),
                variables: Some(r#"["first_party","second_party","product_name","product_spec","quantity","unit_price","total_amount","quality_standard","delivery_location","delivery_date","payment_method","acceptance_standard","sign_date"]"#.to_string()),
                version: Some("1.0".to_string()),
                is_active: Some(true),
                is_system: Some(true),
                sort_order: Some(2),
            },
        ];

        for template in default_templates {
            let existing =
                contract_repo::get_contract_template_by_code(&self.pool, &template.code).await?;
            if existing.is_none() {
                contract_repo::create_contract_template(&self.pool, template).await?;
            }
        }

        Ok(())
    }
}
