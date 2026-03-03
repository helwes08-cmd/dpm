import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://iivjkl22bugydpfmzijbma.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR523232cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdmprbGJ1Z3lkcGZtemlqYm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzk0NjMsImV4cCI6MjA3OTY1NTQ2M30.OzlVvrVdmeK-YyRWxxyeZcSvkOKwwuIk7CzBohsFxdI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
