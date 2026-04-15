import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://fakeclient.supabase.co";
export const SUPABASE_ANON_KEY = "fake-anon-key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
