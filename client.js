import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'url';
const supabaseAnonKey = 'key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
