import { createClient } from "@supabase/supabase-js";
import { appConfig } from "./config";

export const supabase = createClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce"
  },
  global: { headers: { "X-Client-Info": "nummi-web/1.3.0" } }
});
