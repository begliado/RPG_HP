// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------
 * Simple debug utility (activate with VITE_DEBUG=true in .env)
 * ------------------------------------------------------------------ */
const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[Home]', ...args);

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------------------------
   * Redirect user according to role / character state
   * ------------------------------------------------------------------ */
  async function handleUser(user) {
    dbg('handleUser', user.id);

    /* ensure profile */
    await supabase
      .from('profiles')
      .upsert(
        { id: user.id, username: user.user_metadata.login || user.email },
        { onConflict: 'id' }
      );

    /* flags */
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_verified,is_mj')
      .eq('id', user.id)
      .single();

    if (profile.is_mj) {
      dbg('→ MJ');
      navigate('/mj', { replace: true });
      return;
    }

    /* characters */
    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id);

    if (chars.length) {
      dbg('→ character', chars[0].id);
      navigate(`/character/${chars[0].id}`, { replace: true });
    } else if (profile.is_verified) {
      dbg('→ create-character');
      navigate('/create-character', { replace: true });
    } else {
      dbg('→ MJ (pending verif)');
      navigate('/mj', { replace: true });
    }
  }

  /* ------------------------------------------------------------------
   * useEffect: parse OAuth return, then listen for Auth events
   * ------------------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      const fullURL = new URL(window.location.href);

      /* ---------- 1. Exchange ?code=...&state=... (query or fragment) */
      let code = fullURL.searchParams.get('code');

      if (!code && window.location.hash.includes('code=')) {
        // hash can be "#/?code=...&state=..." or "#code=..."
        const fragment = window.location.hash.slice(1).replace(/^\/?/, '');
        code = new URLSearchParams(fragment).get('code');
      }

      if (code) {
        dbg('Code flow detected, exchanging code');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) dbg('exchangeCodeForSession error', error.message);
        // clean URL to "#/"
        window.history.replaceState({}, '', fullURL.pathname + '#/');
      }

      /* ---------- 2. Handle #access_token=... implicit flow -------- */
      const hash = window.location.hash;
      if (hash.includes('access_token=')) {
        const clean = hash.startsWith('#/') ? hash.slice(2) : hash.slice(1);
        const params = new URLSearchParams(clean);
        const at = params.get('access_token');
        const rt = params.get('refresh_token');

        if (at && rt) {
          dbg('Implicit flow detected, setSession');
          const { error } = await supabase.auth.setSession(at, rt);
          if (error) dbg('setSession error', error.message);
          window.location.replace(fullURL.pathname + '#/');
          return; // wait for reload
        }
      }

      /* ---------- 3. Listen for auth changes & check stored session */
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        dbg('Auth event', _event);
        if (session?.user) handleUser(session.user);
        else setLoading(false);
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      dbg('Initial session', session);
      if (session?.user) handleUser(session.user);
      else setLoading(false);

      return () => subscription.unsubscribe();
    })();
  }, [navigate]);

  /* ------------------------------------------------------------------
   * OAuth login trigger
   * ------------------------------------------------------------------ */
  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://begliado.github.io/RPG_HP/' },
    });

  /* ------------------------------------------------------------------
   * UI
   * ------------------------------------------------------------------ */
  if (loading) return <p>Chargement…</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Bienvenue à Poudlard</h1>
      <button
        onClick={login}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Se connecter avec GitHub
      </button>
    </div>
  );
}
