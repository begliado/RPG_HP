// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------
 * Simple debug utility (toggle with VITE_DEBUG=true in .env)
 * ------------------------------------------------------------------ */
const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[Home]', ...args);
const err = (...args) => console.error('[Home]', ...args);

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------------------------------
   * After login: upsert profile & redirect based on role/state
   * ---------------------------------------------------------------- */
  async function handleUser(user) {
    dbg('handleUser start', user);
    try {
      // Upsert profile
      const { data: upserted, error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, username: user.user_metadata.login || user.email },
          { onConflict: 'id' }
        );
      if (upsertError) err('upsert profile error', upsertError);
      else dbg('profile upserted', upserted);

      // Fetch profile flags
      const { data: p, error: profileErr } = await supabase
        .from('profiles')
        .select('is_verified,is_mj')
        .eq('id', user.id)
        .single();
      if (profileErr) {
        err('fetch profile flags error', profileErr);
      } else {
        dbg('Profile flags:', p);
      }

      if (p?.is_mj) {
        dbg('Branch: MJ');
        dbg('Navigating to /mj');
        return navigate('/mj', { replace: true });
      }

      // Fetch existing characters
      const { data: chars, error: charErr } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', user.id);
      if (charErr) err('fetch characters error', charErr);
      else dbg('Characters:', chars);

      if (chars?.length) {
        dbg('Branch: existing character');
        dbg('Navigating to /character/', chars[0].id);
        return navigate(`/character/${chars[0].id}`, { replace: true });
      }

      if (p?.is_verified) {
        dbg('Branch: create-character');
        dbg('Navigating to /create-character');
        return navigate('/create-character', { replace: true });
      }

      dbg('Branch: pending verification redirects to MJ');
      dbg('Navigating to /mj');
      navigate('/mj', { replace: true });
    } catch (e) {
      err('Unexpected handleUser error', e);
      setLoading(false);
    }
  }

  /* ----------------------------------------------------------------
   * On mount: clean OAuth fragment, restore session & listen for auth
   * ---------------------------------------------------------------- */
  useEffect(() => {
    dbg('URL on mount:', window.location.href, 'hash:', window.location.hash);
    // 0️⃣ Clean OAuth fragment if present
    const rawHash = window.location.hash;
    if (rawHash.includes('access_token=')) {
      const cleanUrl = window.location.pathname + window.location.search;
      dbg('Cleaning OAuth fragment, new URL:', cleanUrl);
      window.history.replaceState(null, '', cleanUrl);
    }

    // 1️⃣ Restore any existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) err('getSession error', error);
      dbg('initial getSession', session);
      if (session?.user) handleUser(session.user);
      else setLoading(false);
    });

    // 2️⃣ Listen for SIGNED_IN events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      dbg('onAuthStateChange', event, session);
      if (session?.user) handleUser(session.user);
      else setLoading(false);
    });

    return () => {
      dbg('cleanup subscription');
      subscription.unsubscribe();
    };
  }, [navigate]);

  /* ----------------------------------------------------------------
   * Trigger GitHub OAuth login
   * ---------------------------------------------------------------- */
  const login = () => {
    dbg('login click, starting OAuth');
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: 'https://begliado.github.io/RPG_HP/',
      },
    }).catch(e => err('signInWithOAuth error', e));
  };

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
