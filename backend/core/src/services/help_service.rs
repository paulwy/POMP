use crate::db::help::{
    CreateHelpArticle, CreateHelpCategory, HelpArticle, HelpCategory, HelpCategoryWithArticles,
    UpdateHelpArticle, UpdateHelpCategory,
};
use crate::db::help_repo;
use crate::db::DbPool;
use thiserror::Error;
use uuid::Uuid;

#[derive(Error, Debug)]
pub enum HelpServiceError {
    #[error("数据库错误: {0}")]
    DatabaseError(#[from] sqlx::Error),
    #[error("帮助分类不存在: {0}")]
    CategoryNotFound(String),
    #[error("帮助文章不存在: {0}")]
    ArticleNotFound(String),
}

pub struct HelpService {
    pool: DbPool,
}

impl HelpService {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create_category(
        &self,
        data: CreateHelpCategory,
    ) -> Result<HelpCategory, HelpServiceError> {
        let category = help_repo::create_help_category(&self.pool, data).await?;
        Ok(category)
    }

    pub async fn get_category(&self, id: Uuid) -> Result<HelpCategory, HelpServiceError> {
        let category = help_repo::get_help_category_by_id(&self.pool, id).await?;
        Ok(category)
    }

    pub async fn get_categories(
        &self,
        is_active: Option<bool>,
    ) -> Result<Vec<HelpCategory>, HelpServiceError> {
        let categories = help_repo::get_help_categories(&self.pool, is_active).await?;
        Ok(categories)
    }

    pub async fn update_category(
        &self,
        id: Uuid,
        data: UpdateHelpCategory,
    ) -> Result<HelpCategory, HelpServiceError> {
        let category = help_repo::update_help_category(&self.pool, id, data).await?;
        Ok(category)
    }

    pub async fn delete_category(&self, id: Uuid) -> Result<(), HelpServiceError> {
        help_repo::delete_help_category(&self.pool, id).await?;
        Ok(())
    }

    pub async fn create_article(
        &self,
        data: CreateHelpArticle,
    ) -> Result<HelpArticle, HelpServiceError> {
        let article = help_repo::create_help_article(&self.pool, data).await?;
        Ok(article)
    }

    pub async fn get_article(&self, id: Uuid) -> Result<HelpArticle, HelpServiceError> {
        let article = help_repo::get_help_article_by_id(&self.pool, id).await?;
        Ok(article)
    }

    pub async fn get_article_by_slug(
        &self,
        slug: &str,
    ) -> Result<Option<HelpArticle>, HelpServiceError> {
        let article = help_repo::get_help_article_by_slug(&self.pool, slug).await?;
        Ok(article)
    }

    pub async fn get_articles_by_category(
        &self,
        category_id: Uuid,
    ) -> Result<Vec<HelpArticle>, HelpServiceError> {
        let articles =
            help_repo::get_help_articles_by_category(&self.pool, category_id, Some(true)).await?;
        Ok(articles)
    }

    pub async fn get_all_articles(&self) -> Result<Vec<HelpArticle>, HelpServiceError> {
        let articles = help_repo::get_all_published_articles(&self.pool).await?;
        Ok(articles)
    }

    pub async fn update_article(
        &self,
        id: Uuid,
        data: UpdateHelpArticle,
    ) -> Result<HelpArticle, HelpServiceError> {
        let article = help_repo::update_help_article(&self.pool, id, data).await?;
        Ok(article)
    }

    pub async fn delete_article(&self, id: Uuid) -> Result<(), HelpServiceError> {
        help_repo::delete_help_article(&self.pool, id).await?;
        Ok(())
    }

    pub async fn increment_view_count(&self, id: Uuid) -> Result<(), HelpServiceError> {
        help_repo::increment_view_count(&self.pool, id).await?;
        Ok(())
    }

    pub async fn get_category_with_articles(
        &self,
        category_id: Uuid,
    ) -> Result<HelpCategoryWithArticles, HelpServiceError> {
        let result = help_repo::get_category_with_articles(&self.pool, category_id).await?;
        Ok(result)
    }

    pub async fn search_articles(
        &self,
        keyword: &str,
        category_id: Option<Uuid>,
    ) -> Result<Vec<HelpArticle>, HelpServiceError> {
        let articles = help_repo::search_help_articles(&self.pool, keyword, category_id).await?;
        Ok(articles)
    }

    pub async fn init_default_help_content(&self) -> Result<(), HelpServiceError> {
        self.init_categories().await?;
        self.init_articles().await?;
        Ok(())
    }

    async fn init_categories(&self) -> Result<(), HelpServiceError> {
        let categories = [
            (
                "getting-started",
                "快速入门",
                "Rocket",
                "新用户快速上手指南",
            ),
            (
                "admin-modules",
                "行政综合管理",
                "Building",
                "组织架构、证照、档案管理",
            ),
            (
                "hr-modules",
                "人力资源管理",
                "Users",
                "员工管理、考勤、培训",
            ),
            (
                "production-modules",
                "生产运营管理",
                "Factory",
                "生产计划、质量管控",
            ),
            (
                "engineering-modules",
                "工程项目管理",
                "HardHat",
                "项目管理、施工现场",
            ),
            ("gis-modules", "GIS地理信息", "Map", "地图功能、位置管理"),
            ("ai-assistant", "AI智能助手", "Bot", "AI功能使用指南"),
            (
                "system-settings",
                "系统设置与模板",
                "Settings",
                "系统配置、模板管理",
            ),
        ];

        for (i, (code, name, icon, desc)) in categories.iter().enumerate() {
            let data = CreateHelpCategory {
                code: code.to_string(),
                name: name.to_string(),
                icon: Some(icon.to_string()),
                description: Some(desc.to_string()),
                sort_order: Some(i as i32),
            };

            if let Err(e) = help_repo::create_help_category(&self.pool, data).await {
                tracing::info!("分类可能已存在: {}", e);
            }
        }

        Ok(())
    }

    async fn init_articles(&self) -> Result<(), HelpServiceError> {
        let articles = vec![
            (
                "getting-started",
                "welcome-sksf",
                "欢迎使用三楷深发管理系统",
                r#"## 系统简介

河北三楷深发科技股份有限公司企业管理系统（EMS），集成行政管理、人力资源、财务管理、合同法务、市场营销、生产运营、供应链管理等七大模块，深度融合GIS地理信息系统，支持PC端、移动端多端访问。

## 核心功能

- **行政管理**：组织架构、证照资质、档案管理
- **人力资源**：员工管理、考勤薪资、培训考核
- **合同法务**：合同全生命周期管理、风险预警
- **市场营销**：客户管理、招投标、商机跟踪
- **生产运营**：外加剂生产、工程施工、质量管控
- **GIS集成**：外勤定位、施工现场管理、轨迹追踪"#,
                "系统管理员",
                "getting-started,quick-start",
                true,
                true,
            ),
            (
                "getting-started",
                "first-login",
                "首次登录系统",
                r#"## 登录步骤

1. 打开系统登录页面
2. 输入您的用户名和初始密码
3. 首次登录后请修改密码
4. 完成个人资料补充

## 常见问题

- 忘记密码？联系管理员重置
- 用户名遗忘？使用手机号或邮箱登录"#,
                "系统管理员",
                "login,quick-start",
                true,
                false,
            ),
            (
                "hr-modules",
                "employee档案",
                "员工档案管理",
                r#"## 功能说明

统一管理公司员工信息，包括行政信息、合同信息、资质证书等。

## 员工信息构成

### 基本信息
- 姓名、性别、出生日期
- 联系方式、紧急联系人
- 学历、毕业院校、专业

### 岗位信息
- 所属部门、职位
- 入职日期、试用期
- 工作地点（总部/项目现场）

### 资质证书（特殊岗位）
- 建造师证书
- 安全员证书
- 特种作业操作证（电工、焊工等）
- 职称证书

## 操作指南

1. 进入【人力资源】→【员工管理】
2. 新增或编辑员工信息
3. 上传证件照片、资质证书
4. 关联合同信息
5. 设置转正/离职日期"#,
                "HR专员",
                "hr,员工,档案",
                true,
                true,
            ),
            (
                "hr-modules",
                "attendance-guide",
                "考勤打卡操作",
                r#"## 打卡方式

### 现场打卡
1. 进入【人力资源】→【考勤打卡】
2. 点击「上班打卡」或「下班打卡」
3. 系统自动获取当前位置
4. 打卡成功记录

### 外勤打卡（GIS定位）
1. 进入【外勤管理】→【外勤签到】
2. 系统自动定位当前位置
3. 可拍照上传现场照片
4. 可录音记录情况说明
5. 提交签到记录

## 考勤规则
- 上班时间：08:30
- 下班时间：17:30
- 午休时间：12:00-13:30
- 定位精度：50米内"#,
                "HR专员",
                "考勤,打卡,外勤",
                true,
                false,
            ),
            (
                "production-modules",
                "production-plan",
                "生产计划管理",
                r#"## 功能说明

管理外加剂、岩棉等产品的生产计划，包含年度、月度、周计划。

## 生产类型
- **外加剂生产**：聚羧酸减水剂、萘系减水剂等
- **岩棉生产**：岩棉板、岩棉管等

## 操作流程
1. 进入【生产运营】→【生产计划】
2. 点击「新建计划」
3. 选择产品类型
4. 填写计划数量、交货日期
5. 关联销售订单
6. 提交审批"#,
                "生产主管",
                "生产,计划,外加剂,岩棉",
                true,
                true,
            ),
            (
                "production-modules",
                "quality-control",
                "质量管控流程",
                r#"## 质检环节

1. **原料检验**：化工原料入库前检测
2. **过程检验**：生产过程中抽检
3. **成品检验**：产品出厂前全检

## 质检指标

### 外加剂产品
- 减水率
- 泌水率比
- 凝结时间差
- 抗压强度比

### 岩棉产品
- 导热系数
- 密度
- 抗压强度
- 燃烧性能"#,
                "质检工程师",
                "质量,质检,检测",
                true,
                false,
            ),
            (
                "engineering-modules",
                "project-lifecycle",
                "工程项目全生命周期",
                r#"## 工程类型

- 高铁维护工程
- 建筑保温工程
- 超低能耗建筑工程
- 维修服务

## 项目阶段

1. **商机跟踪**：招投标信息录入
2. **项目立项**：合同签订后立项
3. **施工执行**：现场管理、进度跟踪
4. **竣工验收**：质量验收、资料归档
5. **结算关闭**：财务结算、项目关闭"#,
                "项目经理",
                "工程,项目,施工",
                true,
                true,
            ),
            (
                "engineering-modules",
                "field-management",
                "外勤人员管理",
                r#"## 功能说明

基于GIS地理信息系统，实现外勤人员的定位、轨迹追踪、签到管理。

## 主要功能

### 实时定位
- 员工当前位置在地图上显示
- 支持按项目、按部门筛选
- 查看员工当前位置信息

### 轨迹追踪
- 记录员工全天地 理位置轨迹
- 支持历史轨迹回放
- 异常轨迹预警

### 现场签到
- 到达施工现场自动签到
- 支持拍照、录音举证
- 自动关联当前位置

### 就近派工
- 根据员工位置就近分配任务
- 支持导航到指定地点"#,
                "工程主管",
                "外勤,定位,签到,GIS",
                true,
                true,
            ),
            (
                "gis-modules",
                "gis-overview",
                "GIS功能概览",
                r#"## 系统简介

集成开源GIS技术与企业业务系统，实现业务数据的空间可视化。

## 核心功能

1. **地图展示**：矢量地图、卫星影像切换
2. **数据标注**：客户位置、仓库位置、工程项目标注
3. **空间查询**：按区域检索业务数据
4. **轨迹追踪**：外勤人员、车辆轨迹管理
5. **区域统计**：按区域汇总业务数据

## 地图资源

- OpenStreetMap（默认）
- 天地图（国内精准）
- 卫星影像"#,
                "系统管理员",
                "GIS,地图,位置",
                true,
                true,
            ),
            (
                "gis-modules",
                "asset-location",
                "资产位置管理",
                r#"## 功能说明

将公司资产（设备、仓库、车辆）与地理位置绑定，实现可视化管控。

## 资产类型

- 生产设备（搅拌釜、反应釜）
- 实验设备（检测仪器）
- 仓储物资（原料库、成品库）
- 办公资产（车辆、办公设备）

## 操作流程

1. 进入【GIS管理】→【资产管理】
2. 选择资产类型
3. 标注资产位置（地图选点或经纬度输入）
4. 完善资产信息
5. 设置位置更新方式（手动/GPS自动）"#,
                "系统管理员",
                "GIS,资产,设备",
                true,
                false,
            ),
            (
                "ai-assistant",
                "ai-capabilities",
                "AI助手功能说明",
                r#"## 功能概览

基于人工智能技术，为企业提供智能问答、内容生成、数据分析等功能。

## 主要功能

### 智能问答
回答关于系统操作、业务流程、政策制度的问题。

### 内容生成
- 文章内容优化
- 方案报告生成
- 产品描述撰写

### 文生图
根据描述生成图片，用于：
- 产品展示配图
- 营销素材制作
- 设计灵感参考

### 数据分析
- 业务数据智能分析
- 销售预测
- 异常预警"#,
                "AI工程师",
                "AI,智能助手,文生图",
                true,
                true,
            ),
            (
                "ai-assistant",
                "image-generation",
                "AI文生图使用指南",
                r#"## 功能说明

输入文字描述，AI自动生成对应图片。

## 使用场景

- 产品宣传海报
- 建筑设计灵感
- 施工现场示意

## 操作步骤

1. 进入【AI助手】→【文生图】
2. 输入图片描述（英文效果更佳）
3. 选择图片尺寸（正方形/横版/竖版）
4. 点击「生成」
5. 查看生成结果
6. 可下载或调整提示词重新生成

## 提示词技巧

- 描述越具体，生成效果越好
- 可指定风格（写实/插画/抽象）
- 可指定颜色、光线等要素"#,
                "AI工程师",
                "AI,文生图,图片生成",
                true,
                false,
            ),
            (
                "system-settings",
                "template-management-overview",
                "模板管理系统概览",
                r#"## 系统概述

模板管理系统是企业信息管理系统 (SKSF-EMS) 的核心模块，用于集中管理系统内所有业务模块的模板资源，包括：
- 组织架构模板
- 审批流程模板
- 合同模板
- 职位级别模板
- 以及其他业务模板

## 设计理念

- 统一管理：所有模板在一处管理，避免分散维护
- 版本控制：完整的版本历史和回滚功能
- 灵活使用：支持多种导入导出格式
- 分类清晰：按业务模块和类型分类管理

## 主要功能

| 功能 | 说明 |
|------|------|
| 模板列表 | 以卡片或表格形式展示所有模板 |
| 模板创建 | 创建新的业务模板 |
| 模板编辑 | 修改现有模板内容和设置 |
| 模板查看 | 查看模板详情、变量定义和版本历史 |
| 版本管理 | 版本创建、历史对比、回滚功能 |
| 导入导出 | JSON/YAML/Excel 三种格式支持 |
| 批量操作 | 批量选中和删除模板 |
| 收藏功能 | 常用模板标记为收藏以便快速访问 |
| 默认模板 | 设置系统默认模板 |
| 搜索筛选 | 按名称、分类、类型、状态筛选 |
| 拖拽排序 | 自定义模板展示顺序 |
"#,
                "系统管理员",
                "模板,系统设置,管理",
                true,
                true,
            ),
            (
                "system-settings",
                "template-management-guide",
                "模板管理操作指南",
                r#"## 1. 导航到模板管理

访问系统左侧菜单，找到「模板管理」选项并点击进入。

## 2. 仪表盘说明

页面顶部展示四个统计数据：
- 总模板数：系统中所有模板的数量
- 已启用：当前处于启用状态的模板
- 收藏：用户收藏的模板数量
- 系统模板：系统内置不可删除的模板

## 3. 搜索和筛选

### 搜索框
在搜索框中输入关键词可搜索：
- 模板名称
- 模板编码
- 模板描述
- 标签

### 筛选条件

| 筛选项 | 说明 |
|--------|------|
| 分类 | 按业务模块筛选 |
| 类型 | 按模板具体类型筛选（依赖分类选择） |
| 状态 | 全部/启用/禁用 |

## 4. 视图切换

### 卡片视图（默认）
- 更直观的视觉展示
- 适合模板数量较少的场景
- 显示模板缩略预览、状态、版本等信息

### 表格视图
- 信息密度高
- 支持批量操作
- 适合大量模板的场景

## 5. 创建新模板

点击页面右上角「新建模板」按钮，填写表单：

```
基本信息：
├─ 模板编码*: 唯一标识符，如 dept_general
├─ 模板名称*: 显示名称，如 通用部门
├─ 描述: 模板用途说明
├─ 分类*: 选择所属业务模块
└─ 类型*: 选择具体模板类型

设置：
├─ 版本: 模板版本号，如 1.0
├─ 排序: 模板显示顺序（数字越小越靠前）
├─ 启用: 是否启用该模板
├─ 默认: 是否设为该类型的默认模板
└─ 标签: 用逗号分隔的标签列表
```

## 6. 编辑模板

在模板卡片或表格中点击「编辑」按钮，编辑流程与创建类似。

> **注意**: 系统内置模板（标记为「系统」）的部分字段不可编辑。

## 7. 查看模板详情

点击「查看」按钮打开详情对话框，支持：
- 查看完整内容
- 查看变量定义
- 查看版本历史
- 创建新版本
- 对比不同版本
- 回滚到历史版本

## 8. 收藏模板

点击模板卡片上的「⭐」图标或表格中的星星图标，可将常用模板标记为收藏。

## 9. 导入模板

点击「导入模板」按钮，支持两种方式：

### 文本导入
1. 选择格式：JSON 或 YAML
2. 粘贴内容
3. 点击「导入」

### 文件上传
1. 点击上传区域
2. 选择 Excel 文件
3. 自动解析并导入

## 10. 导出模板

### 导出单个模板
在模板操作菜单中选择「导出」，默认导出为 JSON 格式。

### 批量导出所有模板
点击顶部「导出模板」下拉菜单，选择格式：
- JSON 格式
- YAML 格式
- Excel 格式

## 11. 初始化默认模板

点击「初始化默认模板」按钮，系统会重新生成所有分类的默认模板。

> **警告**: 此操作会重置系统内置模板，请谨慎操作！

## 12. 批量操作

1. 在表格视图或卡片视图中勾选多个模板
2. 点击顶部「批量删除」按钮
3. 确认操作

## 13. 拖拽排序

在表格视图中，按住左侧的「⋮⋮」图标拖拽可调整模板的显示顺序。
"#,
                "系统管理员",
                "模板,操作指南,使用",
                true,
                true,
            ),
            (
                "system-settings",
                "template-import-export",
                "模板导入导出格式说明",
                r#"## 导出格式说明

### JSON 格式

```json
{
  "name": "通用部门",
  "code": "dept_general",
  "description": "通用部门模板",
  "category": "组织架构",
  "template_type": "department",
  "content": {
    "name": "部门名称",
    "config": {}
  },
  "variables": [
    {
      "name": "部门名称",
      "type": "string",
      "default": ""
    }
  ],
  "tags": ["组织", "通用"],
  "version": "1.0",
  "export_version": "1.0",
  "exported_at": "2026-05-14T00:00:00Z"
}
```

### YAML 格式

```yaml
name: 通用部门
code: dept_general
description: 通用部门模板
category: 组织架构
template_type: department
content:
  name: 部门名称
  config: {}
variables:
  - name: 部门名称
    type: string
    default: ""
tags:
  - 组织
  - 通用
version: "1.0"
export_version: "1.0"
exported_at: 2026-05-14T00:00:00Z
```

### Excel 格式

Excel 文件需包含以下列：
- name
- code
- description
- category
- template_type
- content (JSON 字符串)
- variables (JSON 字符串，可选)
- version
- is_active (true/false)
- tags (逗号分隔)

## 导入格式说明

导入支持与导出相同的三种格式。导入时，系统会：
1. 验证格式完整性
2. 检查编码唯一性
3. 验证分类和类型的有效性
4. 创建新模板或更新现有模板

### 注意事项

- 如果模板编码已存在，系统会返回错误
- JSON 和 YAML 中的 content 和 variables 字段需要是合法的 JSON
- Excel 导入时，请确保 content 和 variables 列的内容格式正确
"#,
                "系统管理员",
                "模板,导入,导出,JSON,YAML,Excel",
                true,
                false,
            ),
            (
                "system-settings",
                "template-version-control",
                "模板版本管理与回滚",
                r#"## 版本管理概述

模板管理系统支持完整的版本控制功能，包括版本创建、历史查看、对比和回滚。

## 创建新版本

### 操作步骤

1. 打开模板详情页面
2. 切换到「版本历史」标签
3. 点击「创建版本」按钮
4. 输入版本名称（如 "v1.1"）
5. 输入版本说明（如 "更新了配置项"）
6. 点击确认

系统会自动保存当前模板的状态作为新版本。

## 版本历史查看

在「版本历史」标签下，可以看到所有版本的列表：
- 版本号（v1, v2, v3...）
- 版本名称
- 版本说明
- 创建时间
- 创建者
- 当前版本标记（⭐）

## 版本对比

### 如何对比

1. 在版本历史列表中，点击第一个版本
2. 再次点击第二个版本
3. 系统会显示对比视图

### 对比视图说明

- 左侧显示旧版本（红色背景）
- 右侧显示新版本（绿色背景）
- 高亮显示变更的字段

## 版本回滚

### 回滚操作步骤

1. 在版本历史中找到想要回滚到的版本
2. 点击「回滚」按钮
3. 确认回滚操作

### 回滚的工作原理

回滚操作不会删除历史版本，而是：
1. 基于选中的历史版本内容
2. 创建一个新的版本号（最高版本号 + 1）
3. 将该版本设为当前版本

因此，回滚操作是完全安全的，随时可以再次回滚。

### 回滚示例

当前版本为 v5，想要回滚到 v3：
1. 点击 v3 的「回滚」
2. 系统创建 v6，内容与 v3 相同
3. 当前版本变为 v6
4. v1 到 v5 的历史版本均保留
"#,
                "系统管理员",
                "模板,版本,回滚,历史",
                true,
                false,
            ),
            (
                "system-settings",
                "template-faq",
                "模板管理常见问题",
                r#"## 常见问题

### Q: 如何修改系统内置模板？

A: 系统内置模板（标记为「系统」）的编码不可修改，但其他字段如名称、内容、描述等可以编辑。如需修改编码，请联系技术支持。

### Q: 版本回滚会影响使用中的模板吗？

A: 回滚操作会创建一个新的版本（基于选中的历史版本），不会删除任何版本历史，因此是安全的。

### Q: 如何将一个模板复制到另一个分类？

A: 目前不支持直接跨分类复制。建议：
1. 导出该模板
2. 修改分类字段
3. 重新导入

### Q: 导入 Excel 模板时需要什么格式？

A: Excel 文件需包含以下列：
- name
- code
- description
- category
- template_type
- content (JSON 字符串)
- variables (JSON 字符串，可选)
- version
- is_active (true/false)
- tags (逗号分隔)

### Q: 模板使用次数统计是如何计算的？

A: 使用次数统计是通过统计各业务模块中引用该模板的记录数计算的。

### Q: 如何恢复已删除的模板？

A: 目前系统不支持软删除功能。删除前请谨慎确认。建议：
1. 定期导出所有模板作为备份
2. 删除前先确认是否在使用中

### Q: 模板内容格式有要求吗？

A: 模板内容可以是任何有效的 JSON 结构，没有强制限制。但建议：
- 保持结构的一致性
- 添加版本标记
- 包含必要的注释（如果需要）

### Q: 谁可以访问模板管理？

A: 模板管理模块主要由系统管理员和具有相应权限的用户访问。普通用户可以使用模板，但不能修改或删除。

### Q: 如何设置默认模板？

A: 在创建或编辑模板时，勾选「默认」选项即可。每个分类和类型组合只能有一个默认模板，设置新的默认模板会自动取消旧的默认设置。

### Q: 收藏的模板是私人的吗？

A: 是的，收藏是按用户保存的，每个用户只能看到自己收藏的模板。
"#,
                "系统管理员",
                "模板,FAQ,常见问题,帮助",
                true,
                false,
            ),
        ];

        for (cat_code, slug, title, content, author, tags, published, featured) in articles {
            let categories = help_repo::get_help_categories(&self.pool, Some(true)).await?;
            if let Some(cat) = categories.iter().find(|c| c.code == cat_code) {
                let data = CreateHelpArticle {
                    category_id: cat.id,
                    slug: slug.to_string(),
                    title: title.to_string(),
                    content: content.to_string(),
                    author: Some(author.to_string()),
                    tags: Some(tags.to_string()),
                    is_published: Some(published),
                    is_featured: Some(featured),
                    sort_order: None,
                };

                if let Err(e) = help_repo::create_help_article(&self.pool, data).await {
                    tracing::info!("文章可能已存在: {}", e);
                }
            }
        }

        Ok(())
    }
}
