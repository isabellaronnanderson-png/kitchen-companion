import { createClient } from '@supabase/supabase-js';

// These are the public "anon"/"publishable" keys for this Supabase project.
// They are safe to expose in client-side code — access to data is controlled
// by the Row Level Security policies set up on the table (see the SQL in
// the project README), not by keeping this key secret.
const SUPABASE_URL = 'https://dyjaqtmxrrapgcktvzxe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nQQnNBqLNvT4kEJ5BlHqAA_Jxygg4h8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// The table this app's data lives in. Named specifically for this app since
// the Supabase project is shared with other projects.
export const DATA_TABLE = 'kitchen_companion_data';
