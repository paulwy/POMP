# 河北三楷深发科技股份有限公司 EMS系统个性化定制方案

## 一、企业背景与需求分析

### 1.1 企业概况

**企业名称**：河北三楷深发科技股份有限公司
**股票代码**：新三板上市
**核心业务**：
- 混凝土外加剂研发、生产、销售
- 保温材料（岩棉等）生产
- 高铁/建筑工程施工
- 技术服务

### 1.2 业务特点

| 业务板块 | 特点 | 系统需求 |
|---------|------|----------|
| **研发生产** | 化工厂生产、配方管理、实验室检测 | 研发项目管理、配方库、质检流程 |
| **销售采购** | 化工原料采购、建材销售 | 供应商管理、客户管理、招投标 |
| **工程施工** | 高铁维护、建筑施工、外勤管理 | GIS地图定位、施工现场管理、人员轨迹 |
| **技术服务** | 技术支持、现场服务 | 外勤派工、服务记录、GIS定位 |
| **行政管理** | 新三板规范要求 | 证照资质、档案管理、合同风控 |

---

## 二、字典库定制方案

### 2.1 组织架构字典

```yaml
# 部门分类
departments:
  - code: "EXEC"
    name: "执行委员会"
    description: "公司最高决策层"
  - code: "ADMIN"
    name: "行政管理部"
    description: "行政后勤、档案、证照"
  - code: "HR"
    name: "人力资源部"
    description: "招聘、培训、考勤、薪酬"
  - code: "FIN"
    name: "财务部"
    description: "会计、出纳、税务、成本"
  - code: "LEGAL"
    name: "法务合同部"
    description: "合同管理、风控合规"
  - code: "SALES"
    name: "营销中心"
    description: "市场、招投标、客户"
  - code: "PROD"
    name: "生产部"
    description: "外加剂生产、岩棉生产"
  - code: "ENG"
    name: "工程部"
    description: "工程施工、项目管理"
  - code: "RD"
    name: "研发中心"
    description: "产品研发、实验室"
  - code: "SCM"
    name: "供应链部"
    description: "采购、仓储、物流"
  - code: "QC"
    name: "质量管控部"
    description: "质检、计量、设备"
  - code: "EHS"
    name: "安全环保部"
    description: "安全生产、环境保护"

# 职位级别
position_levels:
  - code: "L1"
    name: "董事长/总经理"
    level: 1
  - code: "L2"
    name: "副总经理"
    level: 2
  - code: "L3"
    name: "总监"
    level: 3
  - code: "L4"
    name: "部门经理"
    level: 4
  - code: "L5"
    name: "主管"
    level: 5
  - code: "L6"
    name: "专员"
    level: 6
  - code: "L7"
    name: "助理"
    level: 7

# 岗位模板（按业务分类）
position_templates:
  # 高管层
  - code: "CEO"
    name: "总经理"
    level: "L1"
    department: "EXEC"
  - code: "COO"
    name: "生产运营副总"
    level: "L2"
    department: "EXEC"
  - code: "CFO"
    name: "财务总监"
    level: "L2"
    department: "FIN"
  
  # 生产相关
  - code: "PROD_MGR"
    name: "生产部经理"
    level: "L4"
    department: "PROD"
  - code: "PROD_SUP"
    name: "生产主管"
    level: "L5"
    department: "PROD"
  - code: "QC_ENG"
    name: "质检工程师"
    level: "L5"
    department: "QC"
  - code: "LAB_ENG"
    name: "实验室技术员"
    level: "L6"
    department: "RD"
  
  # 工程相关
  - code: "ENG_MGR"
    name: "工程部经理"
    level: "L4"
    department: "ENG"
  - code: "PROJ_MGR"
    name: "项目经理"
    level: "L5"
    department: "ENG"
  - code: "SITE_ENG"
    name: "现场工程师"
    level: "L6"
    department: "ENG"
  - code: "SITE_SAFETY"
    name: "安全员"
    level: "L6"
    department: "EHS"
  
  # 销售采购
  - code: "SALES_MGR"
    name: "营销总监"
    level: "L3"
    department: "SALES"
  - code: "BID_MGR"
    name: "招投标经理"
    level: "L4"
    department: "SALES"
  - code: "SALES_REP"
    name: "销售代表"
    level: "L6"
    department: "SALES"
  - code: "SCM_MGR"
    name: "供应链经理"
    level: "L4"
    department: "SCM"
  - code: "BUYER"
    name: "采购专员"
    level: "L6"
    department: "SCM"
```

### 2.2 产品字典

```yaml
# 产品分类
product_categories:
  - code: "ADDITIVE"
    name: "混凝土外加剂"
    description: "减水剂、引气剂、缓凝剂等"
  - code: "INSULATION"
    name: "保温材料"
    description: "岩棉板、管，玻璃棉等"
  - code: "MATERIAL"
    name: "原材料"
    description: "生产用化工原料"
  - code: "EQUIP"
    name: "设备配件"
    description: "生产设备、维修配件"

# 产品规格字典
additive_types:
  - code: "WR"
    name: "减水剂"
    subtypes:
      - code: "WR_PC"
        name: "聚羧酸减水剂"
      - code: "WR_NS"
        name: "萘系减水剂"
      - code: "WR_MS"
        name: "木质素减水剂"
  - code: "AE"
    name: "引气剂"
  - code: "RG"
    name: "缓凝剂"
  - code: "AE"
    name: "早强剂"

insulation_types:
  - code: "RW"
    name: "岩棉板"
    specs:
      - code: "RW_D100"
        name: "岩棉板100mm"
      - code: "RW_D50"
        name: "岩棉板50mm"
  - code: "GW"
    name: "玻璃棉"
  - code: "XPS"
    name: "挤塑聚苯板"

# 计量单位
units:
  - code: "TON"
    name: "吨"
    symbol: "t"
  - code: "KG"
    name: "千克"
    symbol: "kg"
  - code: "M3"
    name: "立方米"
    symbol: "m³"
  - code: "M2"
    name: "平方米"
    symbol: "m²"
  - code: "M"
    name: "米"
    symbol: "m"
```

### 2.3 工程项目字典

```yaml
# 工程类型
project_types:
  - code: "HIGH_RAIL"
    name: "高铁维护工程"
    description: "高铁线路维护、基础设施服务"
  - code: "BUILD_INSUL"
    name: "建筑保温工程"
    description: "外墙保温、屋面保温施工"
  - code: "ULTRA_LOW"
    name: "超低能耗建筑"
    description: "绿色建筑、节能改造"
  - code: "RENOVATION"
    name: "改造工程"
    description: "建筑改造、加固工程"
  - code: "MAINTENANCE"
    name: "维修服务"
    description: "设备维护、技术服务"

# 施工状态
project_status:
  - code: "PREPARE"
    name: "准备阶段"
  - code: "BIDDING"
    name: "招投标中"
  - code: "CONTRACTED"
    name: "已签约"
  - code: "IN_PROGRESS"
    name: "施工中"
  - code: "COMPLETED"
    name: "已竣工"
  - code: "SETTLED"
    name: "已结算"
  - code: "CLOSED"
    name: "已关闭"

# 里程碑节点
milestones:
  - code: "KICKOFF"
    name: "项目启动"
  - code: "DESIGN_DONE"
    name: "设计完成"
  - code: "MATERIAL_READY"
    name: "材料到场"
  - code: "WORK_START"
    name: "开工"
  - code: "WORK_HALF"
    name: "进度50%"
  - code: "WORK_COMPLETE"
    name: "完工"
  - code: "ACCEPTANCE"
    name: "验收通过"
  - code: "SETTLEMENT"
    name: "结算完成"
```

### 2.4 客户与供应商字典

```yaml
# 客户行业分类
customer_industries:
  - code: "HIGH_RAILWAY"
    name: "高铁建设"
  - code: "BUILDING"
    name: "建筑施工"
  - code: "MUNICIPAL"
    name: "市政工程"
  - code: "REAL_ESTATE"
    name: "房地产"
  - code: "INDUSTRIAL"
    name: "工业厂房"

# 客户等级
customer_levels:
  - code: "AAA"
    name: "战略客户"
    discount: 0.9
  - code: "AA"
    name: "重点客户"
    discount: 0.95
  - code: "A"
    name: "普通客户"
    discount: 1.0
  - code: "B"
    name: "观察客户"
    discount: 1.0

# 供应商分类
supplier_categories:
  - code: "RAW_MAT"
    name: "原材料供应商"
    description: "化工原料、生产材料"
  - code: "EQUIP_SUP"
    name: "设备供应商"
    description: "生产设备、维修配件"
  - code: "SUB_CON"
    name: "分包商"
    description: "工程施工分包"
  - code: "LOGISTICS"
    name: "物流运输"
    description: "货物运输、仓储服务"

# 供应商等级
supplier_levels:
  - code: "QUALIFIED"
    name: "合格供应商"
  - code: "PREFERRED"
    name: "优选供应商"
  - code: "STRATEGIC"
    name: "战略供应商"
```

### 2.5 合同字典

```yaml
# 合同类型
contract_types:
  - code: "SALES"
    name: "销售合同"
    department: "SALES"
  - code: "PURCHASE"
    name: "采购合同"
    department: "SCM"
  - code: "ENG_CONTRACT"
    name: "工程施工合同"
    department: "ENG"
  - code: "SUB_CONTRACT"
    name: "分包合同"
    department: "ENG"
  - code: "SERVICE"
    name: "服务合同"
    department: "EXEC"
  - code: "RD_COOP"
    name: "研发合作协议"
    department: "RD"
  - code: "LEASE"
    name: "租赁合同"
    department: "ADMIN"

# 合同状态
contract_status:
  - code: "DRAFT"
    name: "草稿"
  - code: "REVIEWING"
    name: "评审中"
  - code: "APPROVED"
    name: "已审批"
  - code: "SIGNED"
    name: "已签署"
  - code: "EXECUTING"
    name: "执行中"
  - code: "COMPLETED"
    name: "已完成"
  - code: "TERMINATED"
    name: "已终止"
  - code: "ARCHIVED"
    name: "已归档"

# 合同风险等级
risk_levels:
  - code: "LOW"
    name: "低风险"
    color: "green"
  - code: "MEDIUM"
    name: "中风险"
    color: "yellow"
  - code: "HIGH"
    name: "高风险"
    color: "orange"
  - code: "CRITICAL"
    name: "重大风险"
    color: "red"
```

### 2.6 审批流程字典

```yaml
# 审批类型
approval_types:
  # 人事类
  - code: "HR_ENTRY"
    name: "入职申请"
    department: "HR"
  - code: "HR_LEAVE"
    name: "离职申请"
    department: "HR"
  - code: "HR_TRANSFER"
    name: "调岗申请"
    department: "HR"
  - code: "HR_TRAIN"
    name: "培训申请"
    department: "HR"
  
  # 财务类
  - code: "FIN_EXPENSE"
    name: "费用报销"
    department: "FIN"
    amount_limit: true
  - code: "FIN_PAYMENT"
    name: "付款申请"
    department: "FIN"
    amount_limit: true
  - code: "FIN_ADVANCE"
    name: "预付款申请"
    department: "FIN"
    amount_limit: true
  
  # 采购类
  - code: "PUR_REQUIRE"
    name: "采购需求"
    department: "SCM"
  - code: "PUR_ORDER"
    name: "采购订单"
    department: "SCM"
    amount_limit: true
  
  # 项目类
  - code: "PROJ_START"
    name: "项目立项"
    department: "ENG"
  - code: "PROJ_CHANGE"
    name: "项目变更"
    department: "ENG"
  - code: "PROJ_SETTLE"
    name: "项目结算"
    department: "ENG"
  
  # 合同类
  - code: "CONTRACT_REVIEW"
    name: "合同评审"
    department: "LEGAL"
  - code: "CONTRACT_SIGN"
    name: "合同签署"
    department: "LEGAL"
    amount_limit: true
  
  # 外勤类
  - code: "FIELD_CHECKIN"
    name: "外勤签到"
    department: "ENG"
  - code: "FIELD_LEAVE"
    name: "外出申请"
    department: "EXEC"

# 审批节点
approval_nodes:
  - code: "APPLICANT"
    name: "申请人"
    type: "start"
  - code: "DIRECT_LEADER"
    name: "直接主管"
    type: "approval"
  - code: "DEPT_MANAGER"
    name: "部门经理"
    type: "approval"
  - code: "PM"
    name: "项目经理"
    type: "approval"
  - code: "FIN_MANAGER"
    name: "财务经理"
    type: "approval"
  - code: "GM"
    name: "总经理"
    type: "approval"
  - code: "CHAIRMAN"
    name: "董事长"
    type: "approval"
  - code: "END"
    name: "流程结束"
    type: "end"
```

---

## 三、帮助中心定制方案

### 3.1 帮助文档结构

```yaml
help_categories:
  - id: "getting-started"
    name: "快速入门"
    icon: "Rocket"
    description: "新用户快速上手指南"
    articles:
      - slug: "welcome-sksf"
        title: "欢迎使用三楷深发管理系统"
        content: |
          ## 系统简介
          河北三楷深发科技股份有限公司企业管理系统（EMS），
          集成行政管理、人力资源、财务管理、合同法务、市场营销、
          生产运营、供应链管理等七大模块，深度融合GIS地理信息系统，
          支持PC端、移动端多端访问。

          ## 核心功能
          - **行政管理**：组织架构、证照资质、档案管理
          - **人力资源**：员工管理、考勤薪资、培训考核
          - **合同法务**：合同全生命周期管理、风险预警
          - **市场营销**：客户管理、招投标、商机跟踪
          - **生产运营**：外加剂生产、工程施工、质量管控
          - **GIS集成**：外勤定位、施工现场管理、轨迹追踪

      - slug: "first-login"
        title: "首次登录系统"
        content: |
          ## 登录步骤
          1. 打开系统登录页面
          2. 输入您的用户名和初始密码
          3. 首次登录后请修改密码
          4. 完成个人资料补充

          ## 常见问题
          - 忘记密码？联系管理员重置
          - 用户名遗忘？使用手机号或邮箱登录

      - slug: "interface-guide"
        title: "系统界面导航"
        content: |
          ## 界面布局
          - **顶部导航**：用户信息、消息通知、快捷操作
          - **左侧菜单**：功能模块入口
          - **主内容区**：业务操作界面
          - **右下角**：智能助手、AI辅助

          ## 快捷操作
          - `Ctrl + K`：全局搜索
          - `F1`：打开帮助
          - `Alt + I`：上班打卡

  - id: "admin-modules"
    name: "行政综合管理"
    icon: "Building"
    articles:
      - slug: "dept-management"
        title: "部门管理操作指南"
        content: |
          ## 功能说明
          管理系统组织架构，支持部门的增删改查、层级调整。

          ## 操作步骤
          ### 新增部门
          1. 进入【组织架构】→【部门管理】
          2. 点击「新增部门」
          3. 填写部门信息（编号、名称、上级部门）
          4. 设置部门职能描述
          5. 保存完成

          ### 编辑部门
          1. 在部门列表找到目标部门
          2. 点击「编辑」按钮
          3. 修改部门信息
          4. 保存更新

          ## 注意事项
          - 部门编号唯一，不可重复
          - 删除部门需先转移员工
          - 部门层级不超过5级

      - slug: "cert-management"
        title: "证照资质管理"
        content: |
          ## 功能说明
          管理公司各类证照资质的有效期、变更、年检等。

          ## 证照类型
          - 营业执照
          - 生产许可证（危险化学品）
          - 高新技术企业证书
          - 建筑企业资质证书
          - 特种设备许可证
          - 安全生产许可证

          ## 操作流程
          1. 进入【证照管理】
          2. 点击「录入证照」
          3. 选择证照类型
          4. 填写证照信息（编号、有效期、发证机关）
          5. 上传证照电子版
          6. 设置到期提醒

  - id: "hr-modules"
    name: "人力资源管理"
    icon: "Users"
    articles:
      - slug: "employee档案"
        title: "员工档案管理"
        content: |
          ## 功能说明
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
          5. 设置转正/离职日期

      - slug: "attendance-guide"
        title: "考勤打卡操作"
        content: |
          ## 打卡方式
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
          - 定位精度：50米内

  - id: "production-modules"
    name: "生产运营管理"
    icon: "Factory"
    articles:
      - slug: "production-plan"
        title: "生产计划管理"
        content: |
          ## 功能说明
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
          6. 提交审批

      - slug: "quality-control"
        title: "质量管控流程"
        content: |
          ## 质检环节
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
          - 燃烧性能

  - id: "engineering-modules"
    name: "工程项目管理"
    icon: "HardHat"
    articles:
      - slug: "project-lifecycle"
        title: "工程项目全生命周期"
        content: |
          ## 工程类型
          - 高铁维护工程
          - 建筑保温工程
          - 超低能耗建筑工程
          - 维修服务

          ## 项目阶段
          1. **商机跟踪**：招投标信息录入
          2. **项目立项**：合同签订后立项
          3. **施工执行**：现场管理、进度跟踪
          4. **竣工验收**：质量验收、资料归档
          5. **结算关闭**：财务结算、项目关闭

      - slug: "field-management"
        title: "外勤人员管理"
        content: |
          ## 功能说明
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
          - 支持导航到指定地点

  - id: "gis-modules"
    name: "GIS地理信息"
    icon: "Map"
    articles:
      - slug: "gis-overview"
        title: "GIS功能概览"
        content: |
          ## 系统简介
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
          - 卫星影像

      - slug: "asset-location"
        title: "资产位置管理"
        content: |
          ## 功能说明
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
          5. 设置位置更新方式（手动/GPS自动）

  - id: "ai-assistant"
    name: "AI智能助手"
    icon: "Bot"
    articles:
      - slug: "ai-capabilities"
        title: "AI助手功能说明"
        content: |
          ## 功能概览
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
          - 异常预警

      - slug: "image-generation"
        title: "AI文生图使用指南"
        content: |
          ## 功能说明
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
          - 可指定颜色、光线等要素

---

## 四、业务模板定制方案

### 4.1 合同模板

```yaml
contract_templates:
  # 销售合同模板
  - code: "TMPL_SALES_ADDITIVE"
    name: "混凝土外加剂销售合同"
    category: "SALES"
    content: |
      合同编号：_______________
      签订日期：_______________

      甲方（买方）：_______________
      乙方（卖方）：河北三楷深发科技股份有限公司

      一、产品信息
      产品名称：_______________
      规格型号：_______________
      数量：_______________吨
      单价：_______________元/吨
      总价：_______________元

      二、质量标准
      符合GB 8076-2015《混凝土外加剂》国家标准

      三、交货地点
      _______________

      四、付款方式
      _______________

      五、验收标准
      以乙方出厂检验报告为准，甲方可在收货后7日内提出质量异议。

  # 采购合同模板
  - code: "TMPL_PURCHASE_RAW"
    name: "化工原料采购合同"
    category: "PURCHASE"
    content: |
      合同编号：_______________
      签订日期：_______________

      甲方（买方）：河北三楷深发科技股份有限公司
      乙方（卖方）：_______________

      一、采购原料信息
      原料名称：_______________
      规格型号：_______________
      数量：_______________吨
      单价：_______________元/吨
      总价：_______________元

      二、质量要求
      _______________

      三、交货时间
      _______________

      四、安全要求
      乙方需提供化学品安全技术说明书（MSDS）。

  # 工程施工合同模板
  - code: "TMPL_ENG_INSULATION"
    name: "建筑保温工程施工合同"
    category: "ENG_CONTRACT"
    content: |
      合同编号：_______________
      签订日期：_______________

      甲方（发包方）：_______________
      乙方（承包方）：河北三楷深发科技股份有限公司

      一、工程概况
      工程名称：_______________
      工程地点：_______________
      工程内容：建筑外墙保温系统工程

      二、施工范围
      1.基层处理
      2.保温层施工
      3.抹面层施工
      4.饰面层施工

      三、合同工期
      开工日期：_______________
      竣工日期：_______________
      工期：_______________日历天

      四、工程造价
      合同总价：_______________元
      采用固定单价合同，最终按实际工程量结算。

      五、付款方式
      1.合同签订后支付预付款20%
      2.材料到场后支付30%
      3.竣工验收后支付45%
      4.质保期满后支付5%
```

### 4.2 审批流程模板

```yaml
approval_templates:
  # 费用报销流程
  - code: "FLOW_EXPENSE"
    name: "费用报销流程"
    type: "FIN_EXPENSE"
    nodes:
      - name: "申请人提交"
        approver: "APPLICANT"
        type: "start"
      - name: "部门经理审批"
        approver: "DEPT_MANAGER"
        type: "approval"
      - name: "财务审批"
        approver: "FIN_MANAGER"
        type: "approval"
      - name: "总经理审批"
        approver: "GM"
        type: "approval"
        condition: "amount > 10000"
      - name: "流程结束"
        type: "end"
    amount_conditions:
      - threshold: 10000
        additional_approver: "GM"
      - threshold: 50000
        additional_approver: "CHAIRMAN"

  # 采购订单流程
  - code: "FLOW_PURCHASE"
    name: "采购订单审批流程"
    type: "PUR_ORDER"
    nodes:
      - name: "采购需求提交"
        type: "start"
      - name: "部门经理审批"
        approver: "DEPT_MANAGER"
        type: "approval"
      - name: "采购经理审批"
        approver: "SCM_MGR"
        type: "approval"
      - name: "财务审批"
        approver: "FIN_MANAGER"
        type: "approval"
      - name: "总经理审批"
        approver: "GM"
        type: "approval"
        condition: "amount > 50000"
      - name: "流程结束"
        type: "end"

  # 项目立项流程
  - code: "FLOW_PROJECT_START"
    name: "工程项目立项流程"
    type: "PROJ_START"
    nodes:
      - name: "项目经理提交"
        type: "start"
      - name: "工程部经理审批"
        approver: "ENG_MGR"
        type: "approval"
      - name: "技术方案评审"
        approver: "RD"
        type: "review"
      - name: "成本预算审核"
        approver: "FIN_MANAGER"
        type: "approval"
      - name: "总经理审批"
        approver: "GM"
        type: "approval"
      - name: "董事长审批"
        approver: "CHAIRMAN"
        type: "approval"
        condition: "amount > 5000000"
      - name: "流程结束"
        type: "end"
```

### 4.3 报告模板

```yaml
report_templates:
  # 项目进度报告
  - code: "RPT_PROJ_PROGRESS"
    name: "工程项目进度报告"
    sections:
      - title: "基本信息"
        fields:
          - project_name: "项目名称"
          - project_code: "项目编号"
          - report_date: "报告日期"
          - reporter: "报告人"
      
      - title: "进度情况"
        fields:
          - overall_progress: "总体进度%"
          - milestone_status: "里程碑完成情况"
          - current_phase: "当前阶段"
          - next_phase_plan: "下阶段计划"
      
      - title: "资源投入"
        fields:
          - personnel_count: "投入人员"
          - equipment_status: "设备状态"
          - material_delivery: "材料到场情况"
      
      - title: "问题与风险"
        fields:
          - issues: "存在的问题"
          - risks: "风险分析"
          - mitigation: "应对措施"
      
      - title: "照片记录"
        fields:
          - site_photos: "现场照片"
          -gis_location: "GIS位置"

  # 生产日报
  - code: "RPT_PROD_DAILY"
    name: "生产日报"
    sections:
      - title: "基本信息"
        fields:
          - workshop: "生产车间"
          - production_date: "生产日期"
          - shift: "班次"
      
      - title: "生产情况"
        fields:
          - product_type: "产品类型"
          - batch_no: "批次号"
          - output: "产量(吨)"
          - qualified_rate: "合格率%"
      
      - title: "原料消耗"
        fields:
          - raw_materials: "原料消耗明细"
          - energy_consumption: "能耗"
      
      - title: "质量检验"
        fields:
          - QC_samples: "质检抽样"
          - QC_results: "质检结果"
          - QC_attachments: "质检报告"

  # 销售周报
  - code: "RPT_SALES_WEEKLY"
    name: "销售周报"
    sections:
      - title: "本周销售概况"
        fields:
          - total_orders: "新签订单数"
          - total_amount: "订单总额"
          - customer_count: "新开发客户"
      
      - title: "业务进展"
        fields:
          - bidding_projects: "招投标项目跟进"
          - active_opportunities: "活跃商机"
          - pending_contracts: "待签合同"
      
      - title: "客户开发"
        fields:
          - new_contacts: "新联系客户"
          - site_visits: "现场拜访"
          - follow_up_required: "待跟进客户"
```

---

## 五、GIS功能定制方案

### 5.1 地图图层配置

```yaml
map_layers:
  - id: "base_layer"
    name: "基础地图"
    type: "switchable"
    layers:
      - id: "osm"
        name: "OpenStreetMap"
        type: "vector"
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        default: true
      - id: "tdt"
        name: "天地图"
        type: "vector"
        url: "https://t0.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=YOUR_TK"
      - id: "satellite"
        name: "卫星影像"
        type: "raster"
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

  - id: "business_layer"
    name: "业务数据图层"
    type: "overlay"
    layers:
      - id: "customers"
        name: "客户分布"
        icon: "building"
        color: "#3498db"
        popup_template: "{customer_name}<br>行业:{industry}<br>客户等级:{level}"
      
      - id: "suppliers"
        name: "供应商分布"
        icon: "factory"
        color: "#e74c3c"
        popup_template: "{supplier_name}<br>类型:{category}<br>评级:{level}"
      
      - id: "warehouses"
        name: "仓库位置"
        icon: "warehouse"
        color: "#f39c12"
        popup_template: "{warehouse_name}<br>类型:{type}<br>容量:{capacity}"
      
      - id: "projects"
        name: "工程项目"
        icon: "hard-hat"
        color: "#27ae60"
        popup_template: "{project_name}<br>类型:{type}<br>进度:{progress}%"
        status_field: "status"
        status_colors:
          PREPARE: "#95a5a6"
          IN_PROGRESS: "#3498db"
          COMPLETED: "#27ae60"
      
      - id: "field_personnel"
        name: "外勤人员"
        icon: "user"
        color: "#9b59b6"
        show_real_time: true
        show_trail: true
      
      - id: "vehicles"
        name: "工程车辆"
        icon: "truck"
        color: "#1abc9c"
        show_real_time: true

  - id: "analysis_layer"
    name: "分析图层"
    type: "analysis"
    layers:
      - id: "heat_map"
        name: "客户热力图"
        type: "heatmap"
        data_source: "customers"
      
      - id: "coverage_area"
        name: "服务覆盖范围"
        type: "buffer"
        radius: 50000  # 米
```

### 5.2 GIS业务功能

```yaml
gis_features:
  # 客户管理
  customer_gis:
    - feature: "地址解析"
      description: "将客户地址转换为经纬度坐标"
      implementation: "geocoding"
      providers:
        - tianditu  # 天地图地址解析
        - osm_nominatim  # OpenStreetMap Nominatim
    
    - feature: "就近客户查询"
      description: "根据当前位置查找附近客户"
      implementation: "spatial_query"
      radius_options: [5, 10, 20, 50]  # 公里
    
    - feature: "客户分布统计"
      description: "按区域统计客户数量、销量"
      implementation: "spatial_statistics"
      region_levels: ["省", "市", "区/县"]

  # 外勤管理
  field_gis:
    - feature: "实时定位"
      description: "显示外勤人员当前位置"
      implementation: "gps_tracking"
      refresh_interval: 30  # 秒
    
    - feature: "轨迹追踪"
      description: "记录并回放外勤轨迹"
      implementation: "trajectory_tracking"
      history_days: 30
    
    - feature: "电子围栏"
      description: "设置工作区域围栏，异常进出预警"
      implementation: "geofence"
      alert_types: ["进入", "离开", "滞留"]
    
    - feature: "就近派工"
      description: "根据外勤人员位置就近分配任务"
      implementation: "nearest_dispatch"
      optimization: "shortest_distance"

  # 工程项目
  project_gis:
    - feature: "项目分布展示"
      description: "在地图上显示所有项目位置"
      implementation: "marker_cluster"
    
    - feature: "施工进度跟踪"
      description: "在地图上标注项目进度"
      implementation: "progress_visualization"
      progress_colors: ["#e74c3c", "#f39c12", "#27ae60"]
    
    - feature: "项目区域统计"
      description: "按区域统计项目数量、投资额"
      implementation: "spatial_statistics"

  # 仓储物流
  warehouse_gis:
    - feature: "库存可视化"
      description: "在地图上显示各仓库库存情况"
      implementation: "warehouse_visualization"
    
    - feature: "物流跟踪"
      description: "跟踪运输车辆位置"
      implementation: "logistics_tracking"
    
    - feature: "最优路径"
      description: "规划配送最优路径"
      implementation: "route_optimization"
      algorithm: "TSP"
```

---

## 六、数据看板定制方案

### 6.1 驾驶舱配置

```yaml
dashboards:
  # 企业经营驾驶舱
  - code: "EXEC_COCKPIT"
    name: "企业经营驾驶舱"
    target_roles: ["L1", "L2"]
    refresh_interval: 300  # 5分钟
    sections:
      - type: "kpi_grid"
        title: "核心指标"
        items:
          - title: "本月销售额"
            value: "{sales_monthly}"
            unit: "万元"
            trend: "up"
            compare: "vs_last_month"
          
          - title: "待执行合同"
            value: "{contract_pending}"
            unit: "个"
            trend: "neutral"
          
          - title: "在建项目"
            value: "{project_active}"
            unit: "个"
            trend: "up"
          
          - title: "员工总数"
            value: "{employee_total}"
            unit: "人"
            trend: "neutral"

      - type: "map"
        title: "项目分布地图"
        layers: ["projects", "customers"]
        height: 400
      
      - type: "chart"
        title: "销售趋势"
        chart_type: "line"
        data: "sales_trend"
        period: "monthly"
        height: 300
      
      - type: "chart"
        title: "项目进度分布"
        chart_type: "pie"
        data: "project_status_distribution"
        height: 300

  # 生产运营看板
  - code: "PROD_COCKPIT"
    name: "生产运营看板"
    target_roles: ["L3", "L4"]
    sections:
      - type: "kpi_grid"
        title: "生产指标"
        items:
          - title: "今日产量"
            value: "{output_daily}"
            unit: "吨"
          - title: "合格率"
            value: "{qualified_rate}"
            unit: "%"
            threshold: 98
          - title: "设备稼働率"
            value: "{equipment_rate}"
            unit: "%"
          - title: "库存周转"
            value: "{inventory_turnover}"
            unit: "次"

      - type: "realtime_list"
        title: "生产批次跟踪"
        data: "production_batches"
        fields: ["batch_no", "product", "output", "status", "qc_result"]
        height: 400

  # 外勤管理看板
  - code: "FIELD_COCKPIT"
    name: "外勤管理看板"
    target_roles: ["ENG_MGR", "PROJ_MGR"]
    sections:
      - type: "map"
        title: "外勤人员分布"
        layers: ["field_personnel", "projects"]
        height: 500
        features:
          - real_time_tracking
          - trail_display
      
      - type: "kpi_grid"
        title: "外勤统计"
        items:
          - title: "在场人员"
            value: "{personnel_present}"
            unit: "人"
          - title: "今日签到"
            value: "{checkin_today}"
            unit: "次"
          - title: "待处理任务"
            value: "{task_pending}"
            unit: "个"
          - title: "异常告警"
            value: "{alert_count}"
            unit: "次"
            alert_threshold: 3

      - type: "table"
        title: "外勤人员列表"
        data: "field_personnel_list"
        fields: ["name", "position", "current_location", "last_checkin", "status"]
```

---

## 七、实施计划

### 7.1 实施阶段

| 阶段 | 时间 | 内容 | 交付物 |
|------|------|------|--------|
| **第一阶段** | 第1-2周 | 字典库定制 | 组织架构、产品、合同等字典 |
| **第二阶段** | 第3-4周 | 帮助中心 | 操作手册、视频教程 |
| **第三阶段** | 第5-6周 | 合同模板 | 各类业务合同模板 |
| **第四阶段** | 第7-8周 | 审批流程 | 审批模板、流程配置 |
| **第五阶段** | 第9-10周 | GIS配置 | 地图图层、业务标注 |
| **第六阶段** | 第11-12周 | 数据看板 | 驾驶舱配置、报表模板 |

### 7.2 交付物清单

```yaml
deliverables:
  documents:
    - name: "字典库配置文档"
      format: "YAML + 数据库脚本"
    - name: "帮助中心内容"
      format: "Markdown + 数据库"
    - name: "合同模板库"
      format: "Word模板 + 系统配置"
    - name: "审批流程配置"
      format: "流程图 + 系统配置"
    - name: "GIS配置文档"
      format: "地图配置 + 数据导入脚本"
    - name: "数据看板配置"
      format: "系统配置 + 使用手册"

  training:
    - name: "系统管理员培训"
      duration: "2天"
      content: "字典管理、流程配置、GIS配置"
    - name: "业务用户培训"
      duration: "1天"
      content: "各模块操作、帮助中心使用"
    - name: "高管培训"
      duration: "0.5天"
      content: "数据看板、驾驶舱使用"
```

---

## 八、总结

本方案针对河北三楷深发科技股份有限公司的企业特点和业务需求，定制了完整的EMS系统个性化配置方案：

1. **字典库定制**：覆盖组织架构、产品分类、工程项目、客户供应商、合同审批等企业全业务链
2. **帮助中心定制**：提供图文并茂的操作指南，深度结合企业业务场景
3. **业务模板定制**：预置合同模板、审批流程、报告模板，开箱即用
4. **GIS功能定制**：深度集成地图服务，实现外勤定位、轨迹追踪、空间分析
5. **数据看板定制**：为企业高管提供经营驾驶舱，实时掌握企业运营状态

通过本方案的实施，将帮助三楷深发实现：
- ✅ 业务流程标准化、规范化
- ✅ 审批效率提升，缩短审批周期
- ✅ 外勤管理精细化，实时可控
- ✅ 数据可视化，决策有据可依
- ✅ 知识沉淀，新员工快速上手