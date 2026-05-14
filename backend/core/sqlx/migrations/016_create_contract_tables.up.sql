-- 合同模板表（如果不存在）
CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    contract_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    variables TEXT,
    version VARCHAR(50) NOT NULL DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_code ON contract_templates(code);
CREATE INDEX IF NOT EXISTS idx_contract_templates_type ON contract_templates(contract_type);
CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON contract_templates(category);
CREATE INDEX IF NOT EXISTS idx_contract_templates_is_active ON contract_templates(is_active);

-- 合同表（如果不存在）
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    contract_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT,
    content_rendered TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    first_party VARCHAR(500) NOT NULL,
    second_party VARCHAR(500) NOT NULL,
    amount NUMERIC(18,2),
    currency VARCHAR(10) DEFAULT 'CNY',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    sign_date TIMESTAMPTZ,
    project_id UUID,
    created_by UUID,
    risk_level VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_code ON contracts(code);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_category ON contracts(category);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_project ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);

-- 合同变量值表（如果不存在）
CREATE TABLE IF NOT EXISTS contract_variable_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    variable_key VARCHAR(200) NOT NULL,
    variable_value TEXT,
    variable_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_variable_values_contract ON contract_variable_values(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_variable_values_key ON contract_variable_values(variable_key);

-- 创建更新时间触发器（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_contract_templates_updated_at') THEN
        CREATE TRIGGER update_contract_templates_updated_at
            BEFORE UPDATE ON contract_templates
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_contracts_updated_at') THEN
        CREATE TRIGGER update_contracts_updated_at
            BEFORE UPDATE ON contracts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
