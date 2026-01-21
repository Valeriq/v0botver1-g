# Supabase Configuration

## Project Credentials

**Project URL:** `https://ejwiwaaikakwruqipsgu.supabase.co`

**Service Role Secret:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqd2l3YWFpa2Frd3J1cWlwc2d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzEzODMxNiwiZXhwIjoyMDgyNzE0MzE2fQ.qo99-DAOaCbarQ_w9SL_MyOW6HlKuid1LHfwMlW4fms
```

⚠️ **Важно:** Это service role key с полными правами доступа. Не публиковать его в публичных репозиториях!

## Storage Configuration

**Bucket Name:** `csv-uploads`

## Environment Variables

Add to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://ejwiwaaikakwruqipsgu.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqd2l3YWFpa2Frd3J1cWlwc2d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzEzODMxNiwiZXhwIjoyMDgyNzE0MzE2fQ.qo99-DAOaCbarQ_w9SL_MyOW6HlKuid1LHfwMlW4fms
```

## Storage Setup Instructions

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ejwiwaaikakwruqipsgu
2. Navigate to **Storage** > **Buckets**
3. Create a bucket named `csv-uploads`
4. Make the bucket **public** if you want files to be accessible via public URLs
5. Set up RLS (Row Level Security) policies if needed for your application

## File Upload Path Structure

Files are uploaded with the following pattern:
```
csv-uploads/{timestamp}_{filename}
```

Example: `csv-uploads/1737442198000_contacts.csv`

## Security Notes

- The Service Role Key has full access to your Supabase project
- Never commit this file or the `.env` file to version control
- Use Anon Key for client-side operations when possible
- Service Role Key should only be used on server-side
