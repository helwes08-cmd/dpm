import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_DATABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase database URL or Key is missing. Check your environment variables.");
}

export const supabase = createClient(String(supabaseUrl), String(supabaseAnonKey));
