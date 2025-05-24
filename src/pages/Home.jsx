// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------
 * Simple debug utility (toggle with VITE_DEBUG=true)
 * ------------------------------------------------------------------ */
const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[Home]', ...args);

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------------------------------
   * Redirect based on profile flags / existing character
   * ---------------------------------------------------------------- */
  async function handleUser(user) {
    dbg('handleUser', user.id);

    // create or update profile
    await supabase
      .from('profiles')
      .upsert(
        { id: user.id, username: user.user_metadata.login || user.email },
        { onConflict: 'id' }
      );

    // fetch profile flags
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

    // fetch characters
    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id);
    dbg('Characters:', chars);

    if (chars.length) {
      dbg('→ existing character');
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
   * On mount: check session & listen for changes
   * ---------------------------------------------------------------- */
  useEffect(() => {
    // 1) Try to restore any existing session (detectSessionInUrl handles redirect code implicitly)
    supabase.auth.getSession().then(({ data: { session } }) => {
      dbg('initial getSession', session);
      if (session?.user) {
        handleUser(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2) Subscribe to auth changes (SIGNED_IN event)
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

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  /* ----------------------------------------------------------------
   * Trigger GitHub OAuth login
   * ---------------------------------------------------------------- */
  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://begliado.github.io/RPG_HP/' },
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
