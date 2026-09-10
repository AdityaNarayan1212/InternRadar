import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const RESUME_BUCKET = 'resumes';

// Nullable rather than throwing at import time - lets the server boot and
// every other feature keep working even if these two vars aren't set yet.
// Routes that need storage check for null and return a clear 503 instead of
// crashing the process.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Called once at startup (see index.ts) - creates the private resumes
// bucket if it doesn't exist yet. Idempotent. Server-side only: the client
// never talks to Supabase directly, so there's no RLS policy to configure -
// every access is mediated by our own auth-checked Express routes using the
// service role key, which bypasses RLS entirely.
export async function ensureResumeBucket(): Promise<void> {
  if (!supabase) {
    console.warn(
      '[supabase] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set - resume upload is disabled until configured.'
    );
    return;
  }
  const { data: existing, error: getError } = await supabase.storage.getBucket(RESUME_BUCKET);
  if (existing) return;
  if (getError && getError.message && !/not.*found/i.test(getError.message)) {
    console.error('[supabase] Failed to check resume bucket:', getError.message);
    return;
  }
  const { error: createError } = await supabase.storage.createBucket(RESUME_BUCKET, {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['application/pdf'],
  });
  if (createError) {
    console.error('[supabase] Failed to create resume bucket:', createError.message);
  } else {
    console.log(`[supabase] Created private "${RESUME_BUCKET}" bucket`);
  }
}
