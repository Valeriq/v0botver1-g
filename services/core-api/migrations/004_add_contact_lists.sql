-- Миграция: создание таблицы contact_lists и добавление колонок в contacts

-- Contact Lists (группировка импортов)
CREATE TABLE IF NOT EXISTS contact_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'google_sheets', 'manual')) DEFAULT 'manual',
  source_url TEXT,
  row_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_lists_workspace_id ON contact_lists(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contact_lists_created_at ON contact_lists(created_at DESC);

-- Добавляем contact_list_id в contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_list_id UUID REFERENCES contact_lists(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_contact_list_id ON contacts(contact_list_id);

-- Добавляем raw_data для хранения оригинальных данных импорта
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}';

-- Комментарии
COMMENT ON TABLE contact_lists IS 'Группы контактов, импортированные из различных источников';
COMMENT ON COLUMN contact_lists.source_type IS 'Тип источника: csv, google_sheets, manual';
COMMENT ON COLUMN contact_lists.source_url IS 'URL источника (для google_sheets)';
COMMENT ON COLUMN contact_lists.row_count IS 'Количество строк при импорте';
COMMENT ON COLUMN contacts.raw_data IS 'Оригинальные данные из источника импорта';
