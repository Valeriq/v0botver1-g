-- Миграция: создание/изменение таблицы csv_uploads для хранения метаданных загруженных файлов
-- Бинарное содержимое файлов хранится в Supabase Storage, здесь только метаданные

-- Создаём таблицу если не существует
CREATE TABLE IF NOT EXISTS csv_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    supabase_url VARCHAR(1000),
    file_size INTEGER,
    row_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_workspace
        FOREIGN KEY (workspace_id) 
        REFERENCES workspaces(id)
        ON DELETE CASCADE
);

-- Индексы для оптимизации запросов (идемпотентные)
CREATE INDEX IF NOT EXISTS idx_csv_uploads_workspace_id ON csv_uploads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_csv_uploads_created_at ON csv_uploads(created_at DESC);

-- Комментарии к таблице
COMMENT ON TABLE csv_uploads IS 'Метаданные загруженных CSV/Excel файлов. Содержимое хранится в Supabase Storage.';
COMMENT ON COLUMN csv_uploads.supabase_url IS 'URL файла в Supabase Storage bucket csv-files';
COMMENT ON COLUMN csv_uploads.file_size IS 'Размер файла в байтах';
COMMENT ON COLUMN csv_uploads.row_count IS 'Количество строк в файле (после парсинга)';

-- Создаём default workspace если не существует
INSERT INTO workspaces (id, telegram_chat_id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 0, 'Default Workspace')
ON CONFLICT (id) DO NOTHING;
