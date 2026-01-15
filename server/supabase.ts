import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("[supabase] SUPABASE_URL или SUPABASE_SERVICE_KEY не заданы");
}

export const supabase = createClient(
  supabaseUrl || "",
  supabaseServiceKey || ""
);

export async function uploadFileToSupabase(
  bucketName: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string = "application/octet-stream"
): Promise<{ url: string | null; error: string | null }> {
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
