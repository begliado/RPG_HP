// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // détecte et stocke automatiquement le token issu de l’URL au redirect OAuth
    detectSessionInUrl: true,
    // rafraîchit le token en tâche de fond
    autoRefreshToken: true,
    // stocke la session dans localStorage pour persister sur F5
    persistSession: true,
  },
});
