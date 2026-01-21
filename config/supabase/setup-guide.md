# Настройка Supabase Storage для загрузки CSV файлов

## Шаг 1: Создание бакета

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard/project/ejwiwaaikakwruqipsgu)
2. Перейдите в раздел **Storage** в левом меню
3. Нажмите кнопку **"New bucket"**
4. Введите название бакета: `csv-uploads`
5. Настройки:
   - **Public bucket**: Да (если хотите чтобы файлы были доступны по публичным URL)
   - **File size limit**: 10MB или больше (зависит от ваших требований)
   - **Allowed MIME types**: `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
6. Нажмите **"Create bucket"**

## Шаг 2: Настройка политик доступа (RLS)

### Вариант А: Публичный бакет (для быстрого старта)

Если вы сделали бакет публичным, он уже будет доступен для чтения всем пользователям.

### Вариант Б: Ограниченный доступ (более безопасно)

1. В бакете `csv-uploads` перейдите в **Policies**
2. Нажмите **"New Policy"** → **"Get started quickly"**
3. Выберите **"For full customization"**
4. Создайте политику для **INSERT** (загрузка файлов):

```sql
-- Разрешить загружать файлы всем аутентифицированным пользователям
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'csv-uploads');
```

5. Создайте политику для **SELECT** (просмотр файлов):

```sql
-- Разрешить просматривать файлы владельцу
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'csv-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Шаг 3: Проверка конфигурации

После настройки убедитесь, что:

1. ✅ Бакет `csv-uploads` создан и виден в списке
2. ✅ Переменные окружения заданы в `.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_STORAGE_BUCKET=csv-uploads`
3. ✅ Приложение может подключиться к Supabase

## Тестирование загрузки файла

Вы можете протестировать загрузку файла через API:

```bash
# Пример запроса (адаптируйте под ваше приложение)
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@contacts.csv"
```

## Структура файлов в бакете

Файлы будут загружаться с следующей структурой:

```
csv-uploads/
└── uploads/
    ├── 1737442198000_contacts.csv
    ├── 1737442201000_leads.xlsx
    └── 1737442205000_data.csv
```

Имя файла формируется как: `{timestamp}_{original_filename}`

## Доступ к файлам

Если бакет публичный, файлы доступны по URL:
```
https://ejwiwaaikakwruqipsgu.supabase.co/storage/v1/object/public/csv-uploads/uploads/{timestamp}_{filename}
```

Если бакет приватный, используйте Supabase клиент для доступа:
```typescript
const { data, error } = await supabase.storage
  .from('csv-uploads')
  .download('uploads/1737442198000_contacts.csv');
```

## Решение проблем

### Ошибка: "Bucket not found"

Убедитесь, что бакет `csv-uploads` существует и название написано верно.

### Ошибка: "Policy violates"

Проверьте политики RLS. Возможно, вам нужно добавить `service_role` для сервисных ключей.

### Ошибка: "File too large"

Увеличьте лимит размера файла в настройках бакета.

## Безопасность

⚠️ **Важно:**
- Service Role Key имеет полный доступ к проекту
- Не публиковать `.env` файл в Git
- Использовать Anon Key для клиентских операций
- Service Role Key только на сервере
- Настроить RLS политики для production
