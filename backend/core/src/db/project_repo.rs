use crate::db::project::*;
use crate::db::DbPool;
use bigdecimal::{BigDecimal, FromPrimitive, ToPrimitive};
use chrono::{DateTime, Utc};
use sqlx::{query, query_as, PgPool, Row};
use uuid::Uuid;

pub struct ProjectRepo;

impl ProjectRepo {
    pub async fn create_project(pool: &DbPool, data: CreateProject) -> Result<Project, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let budget: Option<BigDecimal> = data.budget.and_then(|v| BigDecimal::from_f64(v));
        
        let customer_id = data.customer_id.and_then(|s| Uuid::parse_str(&s).ok());
        let manager_id = data.manager_id.and_then(|s| Uuid::parse_str(&s).ok());
        let department_id = data.department_id.and_then(|s| Uuid::parse_str(&s).ok());
        let parent_project_id = data.parent_project_id.and_then(|s| Uuid::parse_str(&s).ok());
        let created_by = Uuid::parse_str(&data.created_by).unwrap_or_default();

        let project = query_as::<_, Project>(
            r#"
            INSERT INTO projects (
                id, name, code, description, project_type, status, priority,
                budget, start_date, end_date, customer_id, manager_id,
                department_id, parent_project_id, created_by, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, 'planning', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(&data.name)
        .bind(&data.code)
        .bind(&data.description)
        .bind(&data.project_type)
        .bind(&data.priority)
        .bind(&budget)
        .bind(&data.start_date)
        .bind(&data.end_date)
        .bind(&customer_id)
        .bind(&manager_id)
        .bind(&department_id)
        .bind(&parent_project_id)
        .bind(created_by)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await?;
        
        Ok(project)
    }

    pub async fn get_project_by_id(pool: &DbPool, id: Uuid) -> Result<Option<Project>, sqlx::Error> {
        let project = query_as::<_, Project>(
            r#"SELECT * FROM projects WHERE id = $1"#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;
        
        Ok(project)
    }

    pub async fn search_projects(
        pool: &DbPool,
        params: ProjectSearchParams,
    ) -> Result<Vec<Project>, sqlx::Error> {
        let limit = params.page_size.unwrap_or(20) as i64;
        let offset = ((params.page.unwrap_or(1) - 1) * limit as i32) as i64;
        
        let department_id = params.department_id.and_then(|s| Uuid::parse_str(&s).ok());
        let manager_id = params.manager_id.and_then(|s| Uuid::parse_str(&s).ok());

        let projects = query_as::<_, Project>(
            r#"
            SELECT * FROM projects
            WHERE 
                ($1::text IS NULL OR status = $1)
                AND ($2::text IS NULL OR project_type = $2)
                AND ($3::text IS NULL OR priority = $3)
                AND ($4::uuid IS NULL OR department_id = $4)
                AND ($5::uuid IS NULL OR manager_id = $5)
            ORDER BY created_at DESC
            LIMIT $6 OFFSET $7
            "#,
        )
        .bind(&params.status)
        .bind(&params.project_type)
        .bind(&params.priority)
        .bind(&department_id)
        .bind(&manager_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok(projects)
    }

    pub async fn update_project(
        pool: &DbPool,
        id: Uuid,
        data: UpdateProject,
    ) -> Result<Option<Project>, sqlx::Error> {
        let now = Utc::now();
        let budget: Option<BigDecimal> = data.budget.and_then(|v| BigDecimal::from_f64(v));
        let manager_id = data.manager_id.and_then(|s| Uuid::parse_str(&s).ok());

        let project = query_as::<_, Project>(
            r#"
            UPDATE projects SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                status = COALESCE($3, status),
                priority = COALESCE($4, priority),
                budget = COALESCE($5, budget),
                end_date = COALESCE($6, end_date),
                manager_id = $7,
                progress = COALESCE($8, progress),
                updated_at = $9
            WHERE id = $10
            RETURNING *
            "#,
        )
        .bind(&data.name)
        .bind(&data.description)
        .bind(&data.status)
        .bind(&data.priority)
        .bind(&budget)
        .bind(&data.end_date)
        .bind(&manager_id)
        .bind(data.progress)
        .bind(now)
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(project)
    }

    pub async fn delete_project(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = query(
            r#"DELETE FROM projects WHERE id = $1"#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn get_project_stats(pool: &DbPool) -> Result<ProjectStats, sqlx::Error> {
        let row = query(
            r#"
            SELECT
                COUNT(*) as total_projects,
                COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as active_projects,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_projects,
                COALESCE(SUM(CASE WHEN status IN ('planning', 'in_progress', 'review') THEN 1 ELSE 0 END), 0) as in_progress_projects,
                COALESCE(SUM(COALESCE(budget, 0)), 0) as total_budget,
                COALESCE(SUM(COALESCE(actual_cost, 0)), 0) as total_cost
            FROM projects
            "#,
        )
        .fetch_one(pool)
        .await?;

        Ok(ProjectStats {
            total_projects: row.get("total_projects"),
            active_projects: row.get("active_projects"),
            completed_projects: row.get("completed_projects"),
            in_progress_projects: row.get("in_progress_projects"),
            total_budget: None,
            total_cost: None,
        })
    }

    pub async fn create_phase(
        pool: &DbPool,
        project_id: Uuid,
        data: CreateProjectPhase,
    ) -> Result<ProjectPhase, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();

        let phase = query_as::<_, ProjectPhase>(
            r#"
            INSERT INTO project_phases (id, project_id, name, description, "order", status, start_date, end_date, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9)
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(project_id)
        .bind(&data.name)
        .bind(&data.description)
        .bind(data.order)
        .bind(&data.start_date)
        .bind(&data.end_date)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await?;

        Ok(phase)
    }

    pub async fn get_phases_by_project(pool: &DbPool, project_id: Uuid) -> Result<Vec<ProjectPhase>, sqlx::Error> {
        let phases = query_as::<_, ProjectPhase>(
            r#"SELECT * FROM project_phases WHERE project_id = $1 ORDER BY "order""#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await?;

        Ok(phases)
    }

    pub async fn update_phase(
        pool: &DbPool,
        id: Uuid,
        data: UpdateProjectPhase,
    ) -> Result<Option<ProjectPhase>, sqlx::Error> {
        let now = Utc::now();

        let phase = query_as::<_, ProjectPhase>(
            r#"
            UPDATE project_phases SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                status = COALESCE($3, status),
                end_date = COALESCE($4, end_date),
                updated_at = $5
            WHERE id = $6
            RETURNING *
            "#,
        )
        .bind(&data.name)
        .bind(&data.description)
        .bind(&data.status)
        .bind(&data.end_date)
        .bind(now)
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(phase)
    }

    pub async fn delete_phase(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = query(
            r#"DELETE FROM project_phases WHERE id = $1"#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn create_task(
        pool: &DbPool,
        project_id: Uuid,
        data: CreateProjectTask,
    ) -> Result<ProjectTask, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let estimated_hours: Option<BigDecimal> = data.estimated_hours.and_then(|v| BigDecimal::from_f64(v));
        let phase_id = data.phase_id.and_then(|s| Uuid::parse_str(&s).ok());
        let assignee_id = data.assignee_id.and_then(|s| Uuid::parse_str(&s).ok());
        let parent_task_id = data.parent_task_id.and_then(|s| Uuid::parse_str(&s).ok());
        let created_by = Uuid::parse_str(&data.created_by).unwrap_or_default();

        let task = query_as::<_, ProjectTask>(
            r#"
            INSERT INTO project_tasks (
                id, project_id, phase_id, name, description, status, priority,
                assignee_id, start_date, due_date, estimated_hours, parent_task_id,
                created_by, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, 'todo', $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(project_id)
        .bind(phase_id)
        .bind(&data.name)
        .bind(&data.description)
        .bind(&data.priority)
        .bind(assignee_id)
        .bind(&data.start_date)
        .bind(&data.due_date)
        .bind(&estimated_hours)
        .bind(parent_task_id)
        .bind(created_by)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await?;

        Ok(task)
    }

    pub async fn get_tasks_by_project(pool: &DbPool, project_id: Uuid) -> Result<Vec<ProjectTask>, sqlx::Error> {
        let tasks = query_as::<_, ProjectTask>(
            r#"SELECT * FROM project_tasks WHERE project_id = $1 ORDER BY created_at DESC"#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await?;

        Ok(tasks)
    }

    pub async fn get_task_by_id(pool: &DbPool, id: Uuid) -> Result<Option<ProjectTask>, sqlx::Error> {
        let task = query_as::<_, ProjectTask>(
            r#"SELECT * FROM project_tasks WHERE id = $1"#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(task)
    }

    pub async fn update_task(
        pool: &DbPool,
        id: Uuid,
        data: UpdateProjectTask,
    ) -> Result<Option<ProjectTask>, sqlx::Error> {
        let now = Utc::now();
        let actual_hours: Option<BigDecimal> = data.actual_hours.and_then(|v| BigDecimal::from_f64(v));
        let assignee_id = data.assignee_id.and_then(|s| Uuid::parse_str(&s).ok());

        let task = query_as::<_, ProjectTask>(
            r#"
            UPDATE project_tasks SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                status = COALESCE($3, status),
                priority = COALESCE($4, priority),
                assignee_id = $5,
                due_date = COALESCE($6, due_date),
                completed_date = COALESCE($7, completed_date),
                progress = COALESCE($8, progress),
                actual_hours = $9,
                updated_at = $10
            WHERE id = $11
            RETURNING *
            "#,
        )
        .bind(&data.name)
        .bind(&data.description)
        .bind(&data.status)
        .bind(&data.priority)
        .bind(assignee_id)
        .bind(&data.due_date)
        .bind(&data.completed_date)
        .bind(data.progress)
        .bind(&actual_hours)
        .bind(now)
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(task)
    }

    pub async fn delete_task(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = query(
            r#"DELETE FROM project_tasks WHERE id = $1"#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn add_team_member(
        pool: &DbPool,
        project_id: Uuid,
        data: CreateProjectTeam,
    ) -> Result<ProjectTeam, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let user_id = Uuid::parse_str(&data.user_id).unwrap_or_default();

        let member = query_as::<_, ProjectTeam>(
            r#"
            INSERT INTO project_team (id, project_id, user_id, role, responsibility, join_date, created_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6)
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(project_id)
        .bind(user_id)
        .bind(&data.role)
        .bind(&data.responsibility)
        .bind(now)
        .fetch_one(pool)
        .await?;

        Ok(member)
    }

    pub async fn get_team_by_project(pool: &DbPool, project_id: Uuid) -> Result<Vec<ProjectTeam>, sqlx::Error> {
        let team = query_as::<_, ProjectTeam>(
            r#"SELECT * FROM project_team WHERE project_id = $1 AND leave_date IS NULL ORDER BY join_date"#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await?;

        Ok(team)
    }

    pub async fn update_team_member(
        pool: &DbPool,
        id: Uuid,
        data: UpdateProjectTeam,
    ) -> Result<Option<ProjectTeam>, sqlx::Error> {
        let member = query_as::<_, ProjectTeam>(
            r#"
            UPDATE project_team SET
                role = COALESCE($1, role),
                responsibility = COALESCE($2, responsibility),
                leave_date = COALESCE($3, leave_date)
            WHERE id = $4
            RETURNING *
            "#,
        )
        .bind(&data.role)
        .bind(&data.responsibility)
        .bind(&data.leave_date)
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(member)
    }

    pub async fn remove_team_member(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let now = Utc::now();
        let result = query(
            r#"UPDATE project_team SET leave_date = $1 WHERE id = $2"#,
        )
        .bind(now)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn create_milestone(
        pool: &DbPool,
        project_id: Uuid,
        data: CreateProjectMilestone,
    ) -> Result<ProjectMilestone, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();

        let milestone = query_as::<_, ProjectMilestone>(
            r#"
            INSERT INTO project_milestones (id, project_id, name, description, target_date, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(project_id)
        .bind(&data.name)
        .bind(&data.description)
        .bind(&data.target_date)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await?;

        Ok(milestone)
    }

    pub async fn get_milestones_by_project(pool: &DbPool, project_id: Uuid) -> Result<Vec<ProjectMilestone>, sqlx::Error> {
        let milestones = query_as::<_, ProjectMilestone>(
            r#"SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY target_date"#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await?;

        Ok(milestones)
    }

    pub async fn update_milestone(
        pool: &DbPool,
        id: Uuid,
        data: UpdateProjectMilestone,
    ) -> Result<Option<ProjectMilestone>, sqlx::Error> {
        let now = Utc::now();

        let milestone = query_as::<_, ProjectMilestone>(
            r#"
            UPDATE project_milestones SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                target_date = COALESCE($3, target_date),
                actual_date = COALESCE($4, actual_date),
                status = COALESCE($5, status),
                updated_at = $6
            WHERE id = $7
            RETURNING *
            "#,
        )
        .bind(&data.name)
        .bind(&data.description)
        .bind(&data.target_date)
        .bind(&data.actual_date)
        .bind(&data.status)
        .bind(now)
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(milestone)
    }

    pub async fn delete_milestone(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = query(
            r#"DELETE FROM project_milestones WHERE id = $1"#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn create_risk(
        pool: &DbPool,
        project_id: Uuid,
        data: CreateProjectRisk,
    ) -> Result<ProjectRisk, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let probability = BigDecimal::from_f64(data.probability).unwrap_or_default();
        let owner_id = data.owner_id.and_then(|s| Uuid::parse_str(&s).ok());

        let risk = query_as::<_, ProjectRisk>(
            r#"
            INSERT INTO project_risks (
                id, project_id, title, description, risk_level, probability, impact,
                mitigation_plan, owner_id, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, $11)
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(project_id)
        .bind(&data.title)
        .bind(&data.description)
        .bind(&data.risk_level)
        .bind(&probability)
        .bind(data.impact)
        .bind(&data.mitigation_plan)
        .bind(owner_id)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await?;

        Ok(risk)
    }

    pub async fn get_risks_by_project(pool: &DbPool, project_id: Uuid) -> Result<Vec<ProjectRisk>, sqlx::Error> {
        let risks = query_as::<_, ProjectRisk>(
            r#"SELECT * FROM project_risks WHERE project_id = $1 ORDER BY probability DESC, impact DESC"#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await?;

        Ok(risks)
    }

    pub async fn update_risk(
        pool: &DbPool,
        id: Uuid,
        data: UpdateProjectRisk,
    ) -> Result<Option<ProjectRisk>, sqlx::Error> {
        let now = Utc::now();
        let probability = data.probability.map(|v| BigDecimal::from_f64(v).unwrap_or_default());
        let owner_id = data.owner_id.and_then(|s| Uuid::parse_str(&s).ok());

        let risk = query_as::<_, ProjectRisk>(
            r#"
            UPDATE project_risks SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                risk_level = COALESCE($3, risk_level),
                probability = $4,
                impact = COALESCE($5, impact),
                mitigation_plan = COALESCE($6, mitigation_plan),
                owner_id = $7,
                status = COALESCE($8, status),
                updated_at = $9
            WHERE id = $10
            RETURNING *
            "#,
        )
        .bind(&data.title)
        .bind(&data.description)
        .bind(&data.risk_level)
        .bind(&probability)
        .bind(&data.impact)
        .bind(&data.mitigation_plan)
        .bind(owner_id)
        .bind(&data.status)
        .bind(now)
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(risk)
    }

    pub async fn delete_risk(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = query(
            r#"DELETE FROM project_risks WHERE id = $1"#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn create_issue(
        pool: &DbPool,
        project_id: Uuid,
        data: CreateProjectIssue,
    ) -> Result<ProjectIssue, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let assignee_id = data.assignee_id.and_then(|s| Uuid::parse_str(&s).ok());
        let reporter_id = Uuid::parse_str(&data.reporter_id).ok();
        let created_by = reporter_id.unwrap_or_default();

        let issue = query_as::<_, ProjectIssue>(
            r#"
            INSERT INTO project_issues (
                id, project_id, title, description, issue_type, severity, status,
                assignee_id, created_by, reporter_id, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, $8, $9, $10, $11)
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(project_id)
        .bind(&data.title)
        .bind(&data.description)
        .bind(&data.issue_type)
        .bind(&data.severity)
        .bind(assignee_id)
        .bind(created_by)
        .bind(reporter_id)
        .bind(now)
        .bind(now)
        .fetch_one(pool)
        .await?;

        Ok(issue)
    }

    pub async fn get_issues_by_project(pool: &DbPool, project_id: Uuid) -> Result<Vec<ProjectIssue>, sqlx::Error> {
        let issues = query_as::<_, ProjectIssue>(
            r#"SELECT * FROM project_issues WHERE project_id = $1 ORDER BY created_at DESC"#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await?;

        Ok(issues)
    }

    pub async fn update_issue(
        pool: &DbPool,
        id: Uuid,
        data: UpdateProjectIssue,
    ) -> Result<Option<ProjectIssue>, sqlx::Error> {
        let now = Utc::now();
        let assignee_id = data.assignee_id.and_then(|s| Uuid::parse_str(&s).ok());

        let issue = query_as::<_, ProjectIssue>(
            r#"
            UPDATE project_issues SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                status = COALESCE($3, status),
                assignee_id = $4,
                resolved_at = COALESCE($5, resolved_at),
                updated_at = $6
            WHERE id = $7
            RETURNING *
            "#,
        )
        .bind(&data.title)
        .bind(&data.description)
        .bind(&data.status)
        .bind(assignee_id)
        .bind(&data.resolved_at)
        .bind(now)
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(issue)
    }

    pub async fn delete_issue(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = query(
            r#"DELETE FROM project_issues WHERE id = $1"#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn add_cost(
        pool: &DbPool,
        project_id: Uuid,
        data: CreateProjectCost,
    ) -> Result<ProjectCost, sqlx::Error> {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let amount = BigDecimal::from_f64(data.amount).unwrap_or_default();
        let created_by = Uuid::parse_str(&data.created_by).unwrap_or_default();

        let cost = query_as::<_, ProjectCost>(
            r#"
            INSERT INTO project_costs (id, project_id, category, description, amount, currency, cost_date, created_by, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(project_id)
        .bind(&data.category)
        .bind(&data.description)
        .bind(&amount)
        .bind(&data.currency)
        .bind(&data.cost_date)
        .bind(created_by)
        .bind(now)
        .fetch_one(pool)
        .await?;

        query(
            r#"
            UPDATE projects SET
                actual_cost = COALESCE(actual_cost, 0) + $1,
                updated_at = $2
            WHERE id = $3
            "#,
        )
        .bind(&amount)
        .bind(now)
        .bind(project_id)
        .execute(pool)
        .await?;

        Ok(cost)
    }

    pub async fn get_costs_by_project(pool: &DbPool, project_id: Uuid) -> Result<Vec<ProjectCost>, sqlx::Error> {
        let costs = query_as::<_, ProjectCost>(
            r#"SELECT * FROM project_costs WHERE project_id = $1 ORDER BY cost_date DESC"#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await?;

        Ok(costs)
    }

    pub async fn delete_cost(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let cost_row = query(
            r#"SELECT project_id, amount FROM project_costs WHERE id = $1"#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        if let Some(row) = cost_row {
            let project_id: Uuid = row.get("project_id");
            let amount: BigDecimal = row.get("amount");
            query(
                r#"
                UPDATE projects SET
                    actual_cost = COALESCE(actual_cost, 0) - $1,
                    updated_at = $2
                WHERE id = $3
                "#,
            )
            .bind(&amount)
            .bind(Utc::now())
            .bind(project_id)
            .execute(pool)
            .await?;
        }

        let result = query(
            r#"DELETE FROM project_costs WHERE id = $1"#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
