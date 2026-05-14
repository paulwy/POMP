DROP TRIGGER IF EXISTS update_dict_items_updated_at ON dict_items;
DROP TRIGGER IF EXISTS update_dict_types_updated_at ON dict_types;
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS dict_items;
DROP TABLE IF EXISTS dict_types;