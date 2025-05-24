// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------
 * Debug utility (toggle with VITE_DEBUG=true)
 * ------------------------------------------------------------------ */
const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[Home]', ...args);

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------------------------------
   * After login: upsert profile & redirect based on role/state
   * ---------------------------------------------------------------- */
  async function handleUser(user) {
    dbg('handleUser', user.id);

    // Upsert profile
    await supabase
      .from('profiles')
      .upsert(
        { id: user.id, username: user.user_metadata.login || user.email },
        { onConflict: 'id' }
      );

    // Fetch flags
    const { data: p } = await supabase
      .from('profiles')
      .select('is_verified,is_mj')
      .eq('id', user.id)
      .single();
    dbg('Profile flags:', p);

    if (p.is_mj) {
      dbg('→ MJ dashboard');
      return navigate('/mj', { replace: true });
    }

    // Fetch existing characters
    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id);
    dbg('Characters:', chars);

    if (chars.length) {
      dbg('→ character', chars[0].id);
      return navigate(`/character/${chars[0].id}`, { replace: true });
    }

    if (p.is_verified) {
      dbg('→ create-character');
      return navigate('/create-character', { replace: true });
    }

    dbg('→ MJ (pending verification)');
    navigate('/mj', { replace: true });
  }

  /* ----------------------------------------------------------------
   * On mount: handle OAuth redirect (code or implicit), then listen
   * ---------------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);

      // 1️⃣ Code flow via query string (?code=...&state=...)
      const code = url.searchParams.get('code');
      if (code) {
        dbg('Code flow detected, exchanging code');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) dbg('exchangeCodeForSession error', error.message);
        // Clean URL to "#/"
        window.history.replaceState({}, '', url.origin + url.pathname + '#/');
      }

      // 2️⃣ Implicit flow via fragment (#access_token=...)
      const rawHash = window.location.hash;
      if (rawHash.includes('access_token=')) {
        // Strip leading "#/" or "#"
        const frag = rawHash.startsWith('#/') ? rawHash.slice(2) : rawHash.slice(1);
        const params = new URLSearchParams(frag);
        const at = params.get('access_token');
        const rt = params.get('refresh_token');
        dbg('Implicit flow token found?', !!at);
        if (at && rt) {
          const { error } = await supabase.auth.setSession(at, rt);
          if (error) dbg('setSession error', error.message);
          window.history.replaceState({}, '', url.origin + url.pathname + '#/');
          return; // wait for reload
        }
      }

      // 3️⃣ Subscribe to auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        dbg('onAuthStateChange', _event, session);
        if (session?.user) {
          handleUser(session.user);
        } else {
          setLoading(false);
        }
      });

      // 4️⃣ Initial session check (stored session)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      dbg('Initial getSession', session);
      if (session?.user) {
        handleUser(session.user);
      } else {
        setLoading(false);
      }

      return () => subscription.unsubscribe();
    })();
  }, [navigate]);

  // Trigger GitHub OAuth
  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://begliado.github.io/RPG_HP/' },
    });

  // Render loading state
  if (loading) {
    dbg('Rendering loading…');
    return <p>Chargement…</p>;
  }

  // Render login UI
  dbg('Rendering login UI');
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
