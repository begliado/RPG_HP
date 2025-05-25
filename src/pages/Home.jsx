// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

/* debug */
const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[Home]', ...args);
const err = (...args) => console.error('[Home]', ...args);

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  async function handleUser(user) {
    dbg('handleUser start', user.id);
    // ... même code qu’avant pour upsert profile + redirect ...
  }

  useEffect(() => {
    const url = new URL(window.location.href);
    const rawHash = window.location.hash;
    const codeParam = url.searchParams.get('code');

    dbg('URL on mount:', window.location.href);
    dbg('search:', url.search, 'hash:', rawHash);

    // 0️⃣ Code-flow PKCE : échange automatique du code
    if (codeParam) {
      dbg('Detected code flow, code=', codeParam);
      supabase.auth
        .exchangeCodeForSession(codeParam)
        .then(({ data: { session }, error }) => {
          if (error) err('exchangeCodeForSession error', error.message);
          else dbg('exchangeCodeForSession session', session);
          // clean the URL
          window.history.replaceState(null, '', url.pathname + '#/');
        })
        .catch(e => err('exchangeCodeForSession exception', e));
    }

    // 1️⃣ Implicit-flow fragment cleanup
    if (rawHash.includes('access_token=')) {
      const clean = url.pathname + url.search;
      dbg('Cleaning OAuth fragment, new URL:', clean);
      window.history.replaceState(null, '', clean);
    }

    // 2️⃣ Restore stored session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) err('getSession error', error.message);
      dbg('initial getSession', session);
      if (session?.user) handleUser(session.user);
      else setLoading(false);
    });

    // 3️⃣ Listen for SIGNED_IN
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

  const login = () => {
    dbg('login click, starting OAuth');
    supabase.auth
      .signInWithOAuth({
        provider: 'github',
        options: { redirectTo: 'https://begliado.github.io/RPG_HP/' },
      })
      .catch(e => err('signInWithOAuth error', e));
  };

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
