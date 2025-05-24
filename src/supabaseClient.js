// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'implicit',      // force response_type=token
    detectSessionInUrl: true,  // auto-consume fragment
    persistSession: true,      // store in localStorage
    autoRefreshToken: true,    // refresh tokens
  },
});
