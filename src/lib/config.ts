const DEFAULT_SUPABASE_URL = "https://uqisolhdsvzjmdvohbki.supabase.co";
const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_jAg9zWHKrkK3X2FRXdhgFw_5-r48ScB";

export const appConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || DEFAULT_PUBLISHABLE_KEY,
  apiUrl: import.meta.env.VITE_API_URL?.trim() || `${DEFAULT_SUPABASE_URL}/functions/v1/api-v1/v1`
} as const;
