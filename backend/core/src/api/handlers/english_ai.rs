use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::errors::ApiResponse;
use crate::state::AppState;

// 翻译请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslateRequest {
    pub text: String,
    pub source_lang: Option<String>,
    pub target_lang: Option<String>,
    pub context: Option<String>,
}

// 翻译响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslateResponse {
    pub translated_text: String,
    pub alternatives: Vec<String>,
    pub suggestions: Vec<String>,
}

// 描述生成请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateDescriptionRequest {
    pub chinese_description: String,
    pub style: Option<String>,
    pub max_length: Option<u32>,
}

// 描述生成响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateDescriptionResponse {
    pub description: String,
    pub suggestions: Vec<String>,
}

// 命名建议请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuggestNamingRequest {
    pub text: String,
    pub r#type: Option<String>,
}

// 命名建议响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuggestNamingResponse {
    pub recommended: String,
    pub camel_case: String,
    pub snake_case: String,
    pub pascal_case: String,
    pub kebab_case: String,
}

// 术语查询参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminologyQuery {
    pub category: Option<String>,
    pub query: Option<String>,
}

// 术语项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminologyItem {
    pub chinese: String,
    pub english: String,
    pub category: String,
    pub examples: Vec<String>,
}

// 术语查询响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminologyResponse {
    pub terms: Vec<TerminologyItem>,
}

// 内置术语库
fn get_terminology_database() -> Vec<TerminologyItem> {
    vec![
        // 组织架构类
        TerminologyItem {
            chinese: "部门".to_string(),
            english: "department".to_string(),
            category: "field".to_string(),
            examples: vec!["departmentId".to_string(), "departmentName".to_string()],
        },
        TerminologyItem {
            chinese: "子部门".to_string(),
            english: "subDepartment".to_string(),
            category: "field".to_string(),
            examples: vec!["subDepartmentId".to_string()],
        },
        TerminologyItem {
            chinese: "员工".to_string(),
            english: "employee".to_string(),
            category: "field".to_string(),
            examples: vec!["employeeId".to_string(), "employeeName".to_string()],
        },
        TerminologyItem {
            chinese: "职位".to_string(),
            english: "position".to_string(),
            category: "field".to_string(),
            examples: vec!["positionId".to_string(), "positionName".to_string()],
        },
        TerminologyItem {
            chinese: "入职日期".to_string(),
            english: "joinDate".to_string(),
            category: "field".to_string(),
            examples: vec!["employeeJoinDate".to_string()],
        },
        // 审批流程类
        TerminologyItem {
            chinese: "审批".to_string(),
            english: "approval".to_string(),
            category: "field".to_string(),
            examples: vec!["approvalStatus".to_string(), "approvalDate".to_string()],
        },
        TerminologyItem {
            chinese: "工作流".to_string(),
            english: "workflow".to_string(),
            category: "field".to_string(),
            examples: vec!["workflowId".to_string(), "workflowName".to_string()],
        },
        TerminologyItem {
            chinese: "审批人".to_string(),
            english: "approver".to_string(),
            category: "field".to_string(),
            examples: vec!["approverId".to_string()],
        },
        TerminologyItem {
            chinese: "申请人".to_string(),
            english: "applicant".to_string(),
            category: "field".to_string(),
            examples: vec!["applicantId".to_string()],
        },
        // 人力资源类
        TerminologyItem {
            chinese: "考勤".to_string(),
            english: "attendance".to_string(),
            category: "field".to_string(),
            examples: vec!["attendanceRecord".to_string()],
        },
        TerminologyItem {
            chinese: "请假".to_string(),
            english: "leave".to_string(),
            category: "field".to_string(),
            examples: vec!["leaveType".to_string(), "leaveRequest".to_string()],
        },
        TerminologyItem {
            chinese: "工资".to_string(),
            english: "salary".to_string(),
            category: "field".to_string(),
            examples: vec!["salaryLevel".to_string()],
        },
        TerminologyItem {
            chinese: "绩效".to_string(),
            english: "performance".to_string(),
            category: "field".to_string(),
            examples: vec!["performanceScore".to_string()],
        },
        // 系统设置类
        TerminologyItem {
            chinese: "设置".to_string(),
            english: "setting".to_string(),
            category: "field".to_string(),
            examples: vec!["systemSetting".to_string()],
        },
        TerminologyItem {
            chinese: "配置".to_string(),
            english: "configuration".to_string(),
            category: "field".to_string(),
            examples: vec!["configValue".to_string()],
        },
        TerminologyItem {
            chinese: "权限".to_string(),
            english: "permission".to_string(),
            category: "field".to_string(),
            examples: vec!["permissionId".to_string()],
        },
        TerminologyItem {
            chinese: "角色".to_string(),
            english: "role".to_string(),
            category: "field".to_string(),
            examples: vec!["roleId".to_string(), "roleName".to_string()],
        },
        TerminologyItem {
            chinese: "用户".to_string(),
            english: "user".to_string(),
            category: "field".to_string(),
            examples: vec!["userId".to_string(), "userName".to_string()],
        },
        // 合同管理类
        TerminologyItem {
            chinese: "合同".to_string(),
            english: "contract".to_string(),
            category: "field".to_string(),
            examples: vec!["contractId".to_string(), "contractName".to_string()],
        },
        TerminologyItem {
            chinese: "协议".to_string(),
            english: "agreement".to_string(),
            category: "field".to_string(),
            examples: vec!["agreementId".to_string()],
        },
        TerminologyItem {
            chinese: "条款".to_string(),
            english: "clause".to_string(),
            category: "field".to_string(),
            examples: vec!["contractClause".to_string()],
        },
        TerminologyItem {
            chinese: "甲方".to_string(),
            english: "partyA".to_string(),
            category: "field".to_string(),
            examples: vec!["partyAName".to_string()],
        },
        TerminologyItem {
            chinese: "乙方".to_string(),
            english: "partyB".to_string(),
            category: "field".to_string(),
            examples: vec!["partyBName".to_string()],
        },
        TerminologyItem {
            chinese: "期限".to_string(),
            english: "term".to_string(),
            category: "field".to_string(),
            examples: vec!["contractTerm".to_string()],
        },
        // 内容管理类
        TerminologyItem {
            chinese: "内容".to_string(),
            english: "content".to_string(),
            category: "field".to_string(),
            examples: vec!["contentId".to_string()],
        },
        TerminologyItem {
            chinese: "文章".to_string(),
            english: "article".to_string(),
            category: "field".to_string(),
            examples: vec!["articleId".to_string(), "articleTitle".to_string()],
        },
        TerminologyItem {
            chinese: "分类".to_string(),
            english: "category".to_string(),
            category: "field".to_string(),
            examples: vec!["categoryId".to_string(), "categoryName".to_string()],
        },
        TerminologyItem {
            chinese: "媒体".to_string(),
            english: "media".to_string(),
            category: "field".to_string(),
            examples: vec!["mediaFile".to_string()],
        },
        TerminologyItem {
            chinese: "发布".to_string(),
            english: "publication".to_string(),
            category: "field".to_string(),
            examples: vec!["publicationDate".to_string()],
        },
    ]
}

// 翻译处理函数
pub async fn translate_handler(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<TranslateRequest>,
) -> impl IntoResponse {
    let source_lang = req.source_lang.unwrap_or_else(|| "zh".to_string());
    let target_lang = req.target_lang.unwrap_or_else(|| "en".to_string());
    let context = req.context.unwrap_or_else(|| "general".to_string());

    let (translated_text, alternatives, suggestions) =
        smart_translate(&req.text, &source_lang, &target_lang, &context);

    let result = TranslateResponse {
        translated_text,
        alternatives,
        suggestions,
    };

    (StatusCode::OK, Json(ApiResponse::success(result)))
}

// 描述生成处理函数 - 使用真正的AI生成
pub async fn generate_description_handler(
    State(state): State<Arc<AppState>>,
    Json(req): Json<GenerateDescriptionRequest>,
) -> impl IntoResponse {
    let style = req.style.unwrap_or_else(|| "technical".to_string());
    let max_length = req.max_length.unwrap_or(200);

    // 优先使用真正的AI生成
    if state.text_generator.is_available() {
        let prompt = format!(
            r#"请为以下职位/部门生成一个专业的中文描述（{style}风格，{}字以内）：

职位/部门名称：{}

要求：
1. 描述职责范围
2. 包含核心工作任务
3. 说明汇报关系
4. 专业、正式的表达

直接输出描述内容，不要其他说明。"#,
            max_length,
            req.chinese_description
        );

        match state.text_generator.generate_text(crate::services::text_generator::TextGenerationRequest {
            prompt,
            max_tokens: Some(500),
            temperature: Some(0.7),
            model: None,
        }).await {
            Ok(response) => {
                let result = GenerateDescriptionResponse {
                    description: response.text,
                    suggestions: vec![
                        "可以根据实际情况调整描述内容".to_string(),
                        "建议补充具体的量化指标".to_string(),
                        "可以添加任职资格要求".to_string(),
                    ],
                };
                return (StatusCode::OK, Json(ApiResponse::success(result)));
            }
            Err(e) => {
                tracing::warn!("AI生成失败，使用备用方案: {}", e);
            }
        }
    }

    // 备用方案：使用预定义映射
    let (description, suggestions) =
        generate_english_description(&req.chinese_description, &style, max_length);

    let result = GenerateDescriptionResponse {
        description,
        suggestions,
    };

    (StatusCode::OK, Json(ApiResponse::success(result)))
}

// 命名建议处理函数
pub async fn suggest_naming_handler(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<SuggestNamingRequest>,
) -> impl IntoResponse {
    let naming_type = req.r#type.unwrap_or_else(|| "field_name".to_string());

    let names = generate_naming_variants(&req.text, &naming_type);

    let result = SuggestNamingResponse {
        recommended: names.camel_case.clone(),
        camel_case: names.camel_case,
        snake_case: names.snake_case,
        pascal_case: names.pascal_case,
        kebab_case: names.kebab_case,
    };

    (StatusCode::OK, Json(ApiResponse::success(result)))
}

// 术语查询处理函数
pub async fn get_terminology_handler(Query(query): Query<TerminologyQuery>) -> impl IntoResponse {
    let mut terms = get_terminology_database();

    // 根据分类过滤
    if let Some(category) = &query.category {
        terms.retain(|t| t.category == *category);
    }

    // 根据关键词搜索
    if let Some(q) = &query.query {
        let q_lower = q.to_lowercase();
        terms.retain(|t| t.chinese.contains(q) || t.english.to_lowercase().contains(&q_lower));
    }

    let result = TerminologyResponse { terms };

    (StatusCode::OK, Json(ApiResponse::success(result)))
}

// 辅助函数：智能翻译
fn smart_translate(
    text: &str,
    source_lang: &str,
    target_lang: &str,
    context: &str,
) -> (String, Vec<String>, Vec<String>) {
    if source_lang == "zh" && target_lang == "en" {
        translate_zh_to_en(text, context)
    } else if source_lang == "en" && target_lang == "zh" {
        translate_en_to_zh(text, context)
    } else {
        (text.to_string(), vec![], vec!["不支持的语言对".to_string()])
    }
}

// 中译英
fn translate_zh_to_en(text: &str, context: &str) -> (String, Vec<String>, Vec<String>) {
    let mut alternatives = Vec::new();
    let mut suggestions = Vec::new();

    // 首先检查术语库
    let terms = get_terminology_database();
    let mut found_term = None;
    for term in &terms {
        if text == term.chinese {
            found_term = Some(term);
            break;
        }
    }

    let result = if let Some(term) = found_term {
        alternatives = term.examples.clone();
        suggestions.push(format!("这是{}领域的标准术语", term.category));
        term.english.clone()
    } else {
        // 基本翻译规则
        let result = translate_with_rules(text, context);

        // 生成备选
        if context == "field_name" {
            let variants = generate_naming_variants(text, context);
            alternatives = vec![variants.snake_case, variants.pascal_case];
            suggestions.push("对于字段名，推荐使用驼峰命名法".to_string());
        } else {
            suggestions.push("根据上下文调整了翻译".to_string());
        }
        result
    };

    (result, alternatives, suggestions)
}

// 英译中（简化实现）
fn translate_en_to_zh(text: &str, _context: &str) -> (String, Vec<String>, Vec<String>) {
    let terms = get_terminology_database();
    for term in &terms {
        if text.to_lowercase() == term.english.to_lowercase() {
            return (
                term.chinese.clone(),
                vec![],
                vec!["标准术语翻译".to_string()],
            );
        }
    }

    // 简单翻译（实际项目中会使用 AI 或翻译服务）
    let translation = format!("{} (英文)", text);
    (translation, vec![], vec!["这是一个占位翻译".to_string()])
}

// 基于规则的翻译 - 改进版
fn translate_with_rules(text: &str, context: &str) -> String {
    // 更全面的关键词映射（职位相关优先）
    let position_keywords = vec![
        ("财务经理", "financeManager"),
        ("财务总监", "financeDirector"),
        ("销售经理", "salesManager"),
        ("市场经理", "marketingManager"),
        ("产品经理", "productManager"),
        ("项目经理", "projectManager"),
        ("技术经理", "techManager"),
        ("人力资源经理", "hrManager"),
        ("人事经理", "hrManager"),
        ("行政经理", "adminManager"),
        ("客服经理", "supportManager"),
        ("采购经理", "purchaseManager"),
        ("生产经理", "productionManager"),
        ("运营经理", "operationManager"),
        ("软件工程师", "softwareEngineer"),
        ("前端工程师", "frontendEngineer"),
        ("后端工程师", "backendEngineer"),
        ("运维工程师", "devopsEngineer"),
        ("测试工程师", "testEngineer"),
        ("人事专员", "hrSpecialist"),
        ("行政专员", "adminSpecialist"),
        ("客服专员", "supportSpecialist"),
        ("采购专员", "purchaseSpecialist"),
        ("运营专员", "operationSpecialist"),
        ("仓库管理员", "warehouseKeeper"),
        ("财务", "finance"),
        ("销售", "sales"),
        ("市场", "marketing"),
        ("产品", "product"),
        ("技术", "tech"),
        ("研发", "rd"),
        ("运营", "operation"),
        ("行政", "admin"),
        ("人事", "hr"),
        ("客服", "support"),
        ("采购", "purchase"),
        ("仓库", "warehouse"),
        ("生产", "production"),
        ("质量", "quality"),
        ("项目", "project"),
        ("经理", "manager"),
        ("主管", "supervisor"),
        ("总监", "director"),
        ("助理", "assistant"),
        ("专员", "specialist"),
        ("出纳", "cashier"),
        ("会计", "accountant"),
        ("工程师", "engineer"),
        ("质检", "qa"),
        ("出纳", "cashier"),
        ("会计", "accountant"),
    ];

    // 通用关键词
    let general_keywords = vec![
        ("部门", "department"),
        ("子部门", "subDepartment"),
        ("员工", "employee"),
        ("职位", "position"),
        ("级别", "level"),
        ("等级", "level"),
        ("日期", "date"),
        ("时间", "time"),
        ("状态", "status"),
        ("名称", "name"),
        ("编号", "id"),
        ("类型", "type"),
        ("描述", "description"),
        ("备注", "remark"),
        ("创建", "create"),
        ("更新", "update"),
        ("删除", "delete"),
        ("查询", "query"),
        ("审批", "approval"),
        ("流程", "process"),
        ("系统", "system"),
        ("用户", "user"),
        ("角色", "role"),
        ("权限", "permission"),
        ("组织", "organization"),
        ("架构", "structure"),
        ("管理", "management"),
        ("记录", "record"),
        ("信息", "info"),
        ("数据", "data"),
        ("配置", "config"),
        ("设置", "setting"),
        ("字典", "dict"),
        ("字段", "field"),
        ("总", "general"),
        ("副", "deputy"),
        ("高级", "senior"),
        ("资深", "senior"),
        ("初级", "junior"),
        ("首席", "chief"),
    ];

    let mut result = text.to_string();

    // 优先替换职位关键词（更长的匹配优先）
    for (zh, en) in position_keywords {
        if result.contains(zh) {
            result = result.replace(zh, en);
        }
    }

    // 然后替换通用关键词
    for (zh, en) in general_keywords {
        if result.contains(zh) {
            result = result.replace(zh, en);
        }
    }

    // 检查结果是否还包含中文字符
    let has_chinese = result.chars().any(|c| {
        c >= '\u{4e00}' && c <= '\u{9fff}'
    });

    if has_chinese {
        // 如果还有中文，使用拼音转换作为后备方案
        let pinyin_result = text.to_lowercase()
            .replace(|c: char| c.is_whitespace() || c.is_ascii_punctuation(), "_");
        return if context == "field_name" || context == "field_code" {
            to_camel_case(&pinyin_result)
        } else {
            pinyin_result
        };
    }

    // 处理结果，确保格式正确
    if context == "field_name" || context == "field_code" {
        to_camel_case(&result)
    } else {
        result
    }
}

// 生成不同格式的命名变体
struct NamingVariants {
    camel_case: String,
    snake_case: String,
    pascal_case: String,
    kebab_case: String,
}

fn generate_naming_variants(text: &str, naming_type: &str) -> NamingVariants {
    // 先翻译，但在 field_code 类型下，我们要先翻译再生成命名变体
    let translated = if text.contains(|c: char| c >= '\u{4e00}' && c <= '\u{9fff}') {
        translate_with_rules(text, naming_type)
    } else {
        text.to_string()
    };

    let words = split_into_words(&translated);

    let camel_case = to_camel_case_from_words(&words);
    let snake_case = to_snake_case_from_words(&words);
    let pascal_case = to_pascal_case_from_words(&words);
    let kebab_case = to_kebab_case_from_words(&words);

    NamingVariants {
        camel_case,
        snake_case,
        pascal_case,
        kebab_case,
    }
}

// 分割成单词
fn split_into_words(text: &str) -> Vec<String> {
    let mut result = Vec::new();
    let mut current_word = String::new();

    for c in text.chars() {
        if c.is_uppercase() && !current_word.is_empty() {
            result.push(std::mem::take(&mut current_word));
        }
        if c.is_alphanumeric() {
            current_word.push(c.to_ascii_lowercase());
        } else if !current_word.is_empty() {
            result.push(std::mem::take(&mut current_word));
        }
    }

    if !current_word.is_empty() {
        result.push(current_word);
    }

    result
}

// 字符串转驼峰
fn to_camel_case(s: &str) -> String {
    let words = split_into_words(s);
    to_camel_case_from_words(&words)
}

fn to_camel_case_from_words(words: &[String]) -> String {
    if words.is_empty() {
        return String::new();
    }

    let mut result = words[0].clone();
    for word in &words[1..] {
        if !word.is_empty() {
            let mut chars = word.chars();
            if let Some(first_char) = chars.next() {
                result.push_str(&first_char.to_uppercase().to_string());
                result.push_str(chars.as_str());
            }
        }
    }
    result
}

// 下划线命名
fn to_snake_case_from_words(words: &[String]) -> String {
    words.join("_")
}

// 帕斯卡命名
fn to_pascal_case_from_words(words: &[String]) -> String {
    words
        .iter()
        .map(|word| {
            if word.is_empty() {
                String::new()
            } else {
                let mut chars = word.chars();
                if let Some(first_char) = chars.next() {
                    first_char.to_uppercase().to_string() + chars.as_str()
                } else {
                    String::new()
                }
            }
        })
        .collect()
}

// 短横线命名
fn to_kebab_case_from_words(words: &[String]) -> String {
    words.join("-")
}

// 生成职位描述（业务定义）
fn generate_english_description(
    chinese_desc: &str,
    style: &str,
    max_length: u32,
) -> (String, Vec<String>) {
    let suggestions = vec![
        "可以添加更详细的岗位职责说明".to_string(),
        "建议提及任职要求和资格条件".to_string(),
        "可以指定汇报关系和下属管理情况".to_string(),
    ];

    // 职位业务定义映射
    let position_definitions: Vec<(&str, &str)> = vec![
        ("出纳", "负责现金存取、日常报销、银行对账、工资发放等财务基础工作，确保资金安全和账务准确。"),
        ("会计", "负责账务处理、财务报表编制、税务申报、成本核算等专业财务工作。"),
        ("财务经理", "负责财务管理、预算编制、财务分析、资金管理及团队管理，制定财务策略。"),
        ("财务总监", "全面负责公司财务管理体系建设、投融资决策、风险管理和财务战略规划。"),
        ("销售经理", "负责销售团队管理、客户开发与维护、销售目标制定与达成、市场推广策略执行。"),
        ("销售代表", "负责客户开发、产品销售、订单跟进、客户关系维护，完成销售业绩目标。"),
        ("市场经理", "负责市场调研、品牌推广、营销活动策划、市场策略制定与执行。"),
        ("产品经理", "负责产品规划、需求分析、产品设计、产品发布与迭代优化。"),
        ("项目经理", "负责项目计划制定、资源协调、进度控制、风险管控，确保项目按时交付。"),
        ("技术经理", "负责技术团队管理、技术架构设计、技术选型、技术方案评审。"),
        ("软件工程师", "负责软件系统开发、代码编写、测试调试、技术文档编写。"),
        ("前端工程师", "负责Web前端开发、页面设计、用户交互实现、性能优化。"),
        ("后端工程师", "负责服务器端开发、API设计、数据库设计、系统架构。"),
        ("运维工程师", "负责服务器维护、系统部署、监控告警、故障排查与处理。"),
        ("测试工程师", "负责软件测试、测试用例设计、缺陷跟踪、质量保障。"),
        ("人力资源经理", "负责人力资源规划、招聘配置、培训发展、绩效考核、员工关系管理。"),
        ("人事专员", "负责员工入职、离职手续办理、档案管理、考勤统计、社保公积金办理。"),
        ("行政经理", "负责行政管理、办公环境维护、办公用品采购、行政制度制定。"),
        ("行政专员", "负责日常行政事务、会议组织、文件管理、接待安排。"),
        ("客服经理", "负责客服团队管理、客户投诉处理、服务质量监控、客户满意度提升。"),
        ("客服专员", "负责客户咨询解答、问题处理、投诉受理、客户回访。"),
        ("采购经理", "负责供应商管理、采购计划制定、采购谈判、成本控制。"),
        ("采购专员", "负责采购订单处理、供应商沟通、到货跟踪、采购记录管理。"),
        ("仓库管理员", "负责库存管理、出入库操作、库存盘点、物资保管。"),
        ("生产经理", "负责生产计划制定、生产流程管理、质量控制、生产成本控制。"),
        ("质检员", "负责产品质量检验、质量标准执行、不合格品处理、质量记录管理。"),
        ("运营经理", "负责业务运营管理、流程优化、数据分析、运营策略制定。"),
        ("运营专员", "负责日常运营事务、数据统计、活动执行、用户运营。"),
        ("主管", "负责部门日常管理、工作分配、团队协调、绩效监督。"),
        ("总监", "负责部门战略规划、重大决策、资源调配、跨部门协调。"),
        ("助理", "协助上级处理日常工作、文件整理、会议安排、信息传达。"),
        ("专员", "负责特定领域的专业工作，如招聘专员、培训专员等。"),
        ("工程师", "负责技术研发、工程设计、技术支持等专业技术工作。"),
    ];

    // 查找匹配的职位定义
    let description = match position_definitions.iter().find(|(name, _)| chinese_desc.contains(name)) {
        Some((_, definition)) => definition.to_string(),
        None => {
            // 如果没有匹配的定义，使用通用描述格式
            match style {
                "technical" => format!("{}：负责相关业务工作，具体职责根据岗位职责说明执行。", chinese_desc),
                "formal" => format!("{}职位，负责相关业务领域的工作任务。", chinese_desc),
                "brief" => format!("{}岗位，承担相应工作职责。", chinese_desc),
                _ => format!("{}职位描述。", chinese_desc),
            }
        }
    };

    let trimmed = if description.len() > max_length as usize {
        description.chars().take(max_length as usize).collect()
    } else {
        description
    };

    (trimmed, suggestions)
}
