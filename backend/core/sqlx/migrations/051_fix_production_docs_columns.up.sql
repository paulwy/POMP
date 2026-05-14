-- 修改表结构使用 TEXT 类型而不是 UUID 类型，以便与现有代码兼容
ALTER TABLE document_categories ALTER COLUMN id TYPE TEXT USING id::TEXT;

ALTER TABLE production_documents ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE production_documents ALTER COLUMN category_id TYPE TEXT USING category_id::TEXT;
ALTER TABLE production_documents ALTER COLUMN author_id TYPE TEXT USING author_id::TEXT;
ALTER TABLE production_documents ALTER COLUMN approved_by TYPE TEXT USING approved_by::TEXT;
