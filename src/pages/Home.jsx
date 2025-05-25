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

    // Fetch profile flags
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
   * On mount: restore session & listen for auth changes
   * ---------------------------------------------------------------- */
  useEffect(() => {
    dbg('URL on mount:', window.location.href, 'hash:', window.location.hash);

    // 1️⃣ Try to restore any existing session
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
   * Trigger GitHub OAuth login using implicit flow
   * ---------------------------------------------------------------- */
  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: 'https://begliado.github.io/RPG_HP/',
        flowType: 'implicit',   // force implicit (token in fragment)
      },
    });

  /* ----------------------------------------------------------------
   * Render
   * ---------------------------------------------------------------- */
  if (loading) {
    dbg('Rendering loading…');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">
        <p className="text-lg">Chargement…</p>
      </div>
    );
  }

  dbg('Rendering login UI');
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Bienvenue à Poudlard</h1>
      <button
        onClick={login}
        className="px-6 py-3 bg-blue-700 hover:bg-blue-600 rounded-lg text-white font-medium shadow"
      >
        Se connecter avec GitHub
      </button>
    </div>
  );
}
