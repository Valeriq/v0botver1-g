import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("[supabase] SUPABASE_URL или SUPABASE_SERVICE_KEY не заданы");
}

// Создаем клиента только если есть credentials
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null as any;

export async function uploadFileToSupabase(
  bucketName: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string = "application/octet-stream"
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) {
    console.warn("[supabase] Supabase не настроен, пропускаем загрузку файла");
    return { url: null, error: "Supabase не настроен" };
  }

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    return { url: null, error: error.message };
  }

  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return { url: urlData.publicUrl, error: null };
}
