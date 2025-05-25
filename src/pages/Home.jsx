// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------
 * Debug utilities (toggle with VITE_DEBUG=true)
 * ------------------------------------------------------------------ */
const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[Home]', ...args);

/* ------------------------------------------------------------------
 * Interceptor global pour logger toutes les requêtes fetch
 * ------------------------------------------------------------------ */
if (DEBUG) {
  const _fetch = window.fetch;
  window.fetch = async (...args) => {
    console.group('[Fetch]', args[0]);
    console.debug('→ Request args:', args);
    const res = await _fetch(...args);
    console.debug('← Response:', res);
    console.groupEnd();
    return res;
  };
}

export default function Home() {
  dbg('Component mount, href=', window.location.href);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser]       = useState(null);

  /* ----------------------------------------------------------------
   * Initialise les données utilisateur (upsert profile, etc.)
   * ---------------------------------------------------------------- */
  async function initData(u) {
    dbg('initData start for', u.id);
    // Ici : upsert profile + fetch flags + fetch characters...
    // Lorsque terminé :
    setLoading(false);
  }

  /* ----------------------------------------------------------------
   * Restaure la session & écoute les changements d’auth
   * ---------------------------------------------------------------- */
  useEffect(() => {
    dbg('🔄 Restoring session…');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) dbg('getSession error', error);
      dbg('getSession →', session);
      if (session?.user) {
        setUser(session.user);
        initData(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      dbg('Auth event', event, session);
      if (session?.user) {
        setUser(session.user);
        initData(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ----------------------------------------------------------------
   * Déclenche l’OAuth GitHub en redirigeant vers Supabase
   * ---------------------------------------------------------------- */
  const login = () => {
    const redirectTo = window.location.origin + window.location.pathname.replace(/\/$/, '');
    dbg('Login click — redirectTo:', redirectTo);
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo }
    });
  };

  /* ----------------------------------------------------------------
   * Render
   * ---------------------------------------------------------------- */
  if (loading) {
    return <p>Chargement…</p>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100 p-4">
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

  // Si l’utilisateur est connecté, tu pourras ici rediriger
  // vers /mj, /character/:id, /create-character, etc., en
  // fonction de son profil (appelle initData pour remplir
  // ton store puis navigate).
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">
      <p>Vous êtes connecté ! Redirection en cours…</p>
    </div>
  );
}
