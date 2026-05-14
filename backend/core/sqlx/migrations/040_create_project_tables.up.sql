-- 创建项目表
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    project_type VARCHAR(50) NOT NULL DEFAULT 'internal',
    status VARCHAR(50) DEFAULT 'planning',
    priority VARCHAR(20) DEFAULT 'medium',
    budget DECIMAL(18, 2),
    actual_cost DECIMAL(18, 2) DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    progress INTEGER DEFAULT 0,
    customer_id UUID,
    manager_id UUID,
    department_id UUID,
    parent_project_id UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 添加外键约束（需要在其他表创建之后）
ALTER TABLE IF EXISTS projects 
    ADD CONSTRAINT IF NOT EXISTS fk_projects_manager_id FOREIGN KEY (manager_id) REFERENCES users(id);
ALTER TABLE IF EXISTS projects 
    ADD CONSTRAINT IF NOT EXISTS fk_projects_department_id FOREIGN KEY (department_id) REFERENCES departments(id);
ALTER TABLE IF EXISTS projects 
    ADD CONSTRAINT IF NOT EXISTS fk_projects_parent_id FOREIGN KEY (parent_project_id) REFERENCES projects(id);
ALTER TABLE IF EXISTS projects 
    ADD CONSTRAINT IF NOT EXISTS fk_projects_created_by FOREIGN KEY (created_by) REFERENCES users(id);

-- 创建项目阶段表
CREATE TABLE IF NOT EXISTS project_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL DEFAULT 1,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS project_phases 
    ADD CONSTRAINT IF NOT EXISTS fk_project_phases_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 创建项目任务表
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    phase_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assignee_id UUID,
    due_date TIMESTAMPTZ,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS project_tasks 
    ADD CONSTRAINT IF NOT EXISTS fk_project_tasks_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS project_tasks 
    ADD CONSTRAINT IF NOT EXISTS fk_project_tasks_phase_id FOREIGN KEY (phase_id) REFERENCES project_phases(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS project_tasks 
    ADD CONSTRAINT IF NOT EXISTS fk_project_tasks_assignee_id FOREIGN KEY (assignee_id) REFERENCES users(id);

-- 创建项目团队表
CREATE TABLE IF NOT EXISTS project_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(100),
    responsibility TEXT,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    leave_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS project_team 
    ADD CONSTRAINT IF NOT EXISTS fk_project_team_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS project_team 
    ADD CONSTRAINT IF NOT EXISTS fk_project_team_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- 创建项目里程碑表
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_date TIMESTAMPTZ NOT NULL,
    actual_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS project_milestones 
    ADD CONSTRAINT IF NOT EXISTS fk_project_milestones_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- 创建项目风险表
CREATE TABLE IF NOT EXISTS project_risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    probability DECIMAL(5, 2) DEFAULT 0.5,
    impact VARCHAR(20) DEFAULT 'medium',
    risk_level VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'active',
    mitigation_plan TEXT,
    owner_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS project_risks 
    ADD CONSTRAINT IF NOT EXISTS fk_project_risks_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS project_risks 
    ADD CONSTRAINT IF NOT EXISTS fk_project_risks_owner_id FOREIGN KEY (owner_id) REFERENCES users(id);

-- 创建项目问题表
CREATE TABLE IF NOT EXISTS project_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    issue_type VARCHAR(50) DEFAULT 'bug',
    severity VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    assignee_id UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS project_issues 
    ADD CONSTRAINT IF NOT EXISTS fk_project_issues_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS project_issues 
    ADD CONSTRAINT IF NOT EXISTS fk_project_issues_assignee_id FOREIGN KEY (assignee_id) REFERENCES users(id);
ALTER TABLE IF EXISTS project_issues 
    ADD CONSTRAINT IF NOT EXISTS fk_project_issues_created_by FOREIGN KEY (created_by) REFERENCES users(id);

-- 创建项目成本表
CREATE TABLE IF NOT EXISTS project_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'CNY',
    cost_date DATE NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS project_costs 
    ADD CONSTRAINT IF NOT EXISTS fk_project_costs_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS project_costs 
    ADD CONSTRAINT IF NOT EXISTS fk_project_costs_created_by FOREIGN KEY (created_by) REFERENCES users(id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee_id ON project_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_project_team_project_id ON project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_user_id ON project_team(user_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_risks_project_id ON project_risks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_issues_project_id ON project_issues(project_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_project_id ON project_costs(project_id);