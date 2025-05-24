// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------
 * Simple debug utility (toggle with VITE_DEBUG=true in .env)
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

    // Fetch characters
    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id);
    dbg('Characters:', chars);

    if (chars.length) {
      dbg('→ existing character', chars[0].id);
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
   * On mount: log URL, restore or listen session via implicit flow
   * ---------------------------------------------------------------- */
  useEffect(() => {
    dbg('URL on mount:', window.location.href);
    dbg('location.search:', window.location.search);
    dbg('location.hash:', window.location.hash);

    // 1️⃣ Try to restore any session (implicit fragment consumed by supabase-js)
    supabase.auth.getSession().then(({ data: { session } }) => {
      dbg('initial getSession', session);
      if (session?.user) {
        handleUser(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2️⃣ Listen for SIGNED_IN events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      dbg('onAuthStateChange', event, session);
      if (session?.user) {
        handleUser(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      dbg('cleanup subscription');
      subscription.unsubscribe();
    };
  }, [navigate]);

  /* ----------------------------------------------------------------
   * Trigger GitHub OAuth login (implicit flow)
   * ---------------------------------------------------------------- */
  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: 'https://begliado.github.io/RPG_HP/',
        flowType: 'implicit',
      },
    });

  /* ----------------------------------------------------------------
   * Render
   * ---------------------------------------------------------------- */
  if (loading) {
    dbg('Rendering loading…');
    return <p>Chargement…</p>;
  }

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
