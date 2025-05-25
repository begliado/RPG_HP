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
    dbg('handleUser start', user.id);
    try {
      const { data: upserted, error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, username: user.user_metadata.login || user.email },
          { onConflict: 'id' }
        );
      if (upsertError) err('upsert profile error', upsertError);
      else dbg('profile upserted', upserted);

      const { data: p, error: profileErr } = await supabase
        .from('profiles')
        .select('is_verified,is_mj')
        .eq('id', user.id)
        .single();
      if (profileErr) err('fetch profile flags error', profileErr);
      else dbg('Profile flags:', p);

      if (p?.is_mj) {
        dbg('Branch: MJ');
        navigate('/mj', { replace: true });
        return;
      }

      const { data: chars, error: charErr } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', user.id);
      if (charErr) err('fetch characters error', charErr);
      else dbg('Characters:', chars);

      if (chars?.length) {
        dbg('Branch: existing character');
        navigate(`/character/${chars[0].id}`, { replace: true });
        return;
      }

      if (p?.is_verified) {
        dbg('Branch: create-character');
        navigate('/create-character', { replace: true });
        return;
      }

      dbg('Branch: pending verification');
      navigate('/mj', { replace: true });
    } catch (e) {
      err('Unexpected handleUser error', e);
      setLoading(false);
    }
  }

  /* ----------------------------------------------------------------
   * On mount: manual code/fragment handling, restore session & listen
   * ---------------------------------------------------------------- */
  useEffect(() => {
    const url = new URL(window.location.href);
    const rawHash = window.location.hash;
    const code = url.searchParams.get('code');

    dbg('URL on mount:', url.href);
    dbg('search:', url.search, 'hash:', rawHash);

    // 1️⃣ Code Flow PKCE: exchange code
    if (code) {
      dbg('Detected code flow, code=', code);
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ data: { session }, error }) => {
          if (error) err('exchangeCodeForSession error', error.message);
          else {
            dbg('exchangeCodeForSession session', session);
            handleUser(session.user);
          }
          window.history.replaceState(null, '', url.pathname + '#/');
        })
        .catch(e => err('exchangeCodeForSession exception', e));
      return;
    }

    // 2️⃣ Implicit Flow: fragment contains tokens
    if (rawHash.includes('access_token=')) {
      const fragment = rawHash.startsWith('#/') ? rawHash.slice(2) : rawHash.slice(1);
      const params = new URLSearchParams(fragment);
      const at = params.get('access_token');
      const rt = params.get('refresh_token');
      dbg('Detected implicit tokens:', !!at, !!rt);
      if (at && rt) {
        supabase.auth
          .setSession({ access_token: at, refresh_token: rt })
          .then(({ data: { session }, error }) => {
            if (error) err('setSession error', error.message);
            else {
              dbg('setSession session', session);
              handleUser(session.user);
            }
            window.history.replaceState(null, '', url.pathname + '#/');
          })
          .catch(e => err('setSession exception', e));
        return;
      }
    }

    // 3️⃣ Restore any existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) err('getSession error', error.message);
      dbg('initial getSession', session);
      if (session?.user) {
        dbg('Session found on mount');
        handleUser(session.user);
      } else {
        dbg('No session found, show login');
        setLoading(false);
      }
    });

    // 4️⃣ Listen for SIGNED_IN events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      dbg('onAuthStateChange', event, session);
      if (session?.user) {
        dbg('Session via onAuthStateChange');
        handleUser(session.user);
      } else {
        dbg('onAuthStateChange: no session');
        setLoading(false);
      }
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
    supabase.auth
      .signInWithOAuth({ provider: 'github', options: { redirectTo: 'https://begliado.github.io/RPG_HP/' } })
      .catch(e => err('signInWithOAuth error', e));
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
