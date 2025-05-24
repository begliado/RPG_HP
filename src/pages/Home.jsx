// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

/* --- simple logger --- */
const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...a) => DEBUG && console.debug('[Home]', ...a);

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  /* -------------------------------------------------- */
  /*  Redirection selon rôle / perso                     */
  /* -------------------------------------------------- */
  async function handleUser(user) {
    dbg('handleUser', user.id);

    /* upsert profile */
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

    dbg('flags', profile);

    if (profile.is_mj) {
      navigate('/mj', { replace: true });
      return;
    }

    /* existing character ? */
    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id);

    if (chars.length) {
      navigate(`/character/${chars[0].id}`, { replace: true });
    } else if (profile.is_verified) {
      navigate('/create-character', { replace: true });
    } else {
      /* joueur non validé → MJ */
      navigate('/mj', { replace: true });
    }
  }

  /* -------------------------------------------------- */
  /*  useEffect : gère Auth                             */
  /* -------------------------------------------------- */
  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);

      /* ---------- 1. Code flow (query) --------------- */
      const code = url.searchParams.get('code');
      if (code) {
        dbg('Code flow detected');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) dbg('exchangeCodeForSession error', error.message);
        /* nettoie la query */
        window.history.replaceState({}, '', url.pathname + '#/');
      }

      /* ---------- 2. Implicit flow (fragment) -------- */
      const rawHash = window.location.hash;
      if (rawHash.includes('access_token=')) {
        /* supprime '#/' (2) ou '#' (1) */
        const fragment = rawHash.startsWith('#/')
          ? rawHash.slice(2)
          : rawHash.slice(1);

        const params = new URLSearchParams(fragment);
        const at = params.get('access_token');
        const rt = params.get('refresh_token');
        dbg('Implicit flow – token found ?', !!at);

        if (at && rt) {
          const { error } = await supabase.auth.setSession(at, rt);
          if (error) dbg('setSession error', error.message);
          /* remplace l’URL par /#/ */
          window.location.replace(url.pathname + '#/');
          return; // on laisse reloader
        }
      }

      /* ---------- 3. listener + session existante ---- */
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_e, sess) => {
        dbg('Auth event', _e);
        if (sess?.user) handleUser(sess.user);
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

  /* -------------------------------------------------- */
  /*  Bouton login                                      */
  /* -------------------------------------------------- */
  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://begliado.github.io/RPG_HP/' },
    });

  /* -------------------------------------------------- */
  /*  UI                                                */
  /* -------------------------------------------------- */
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
