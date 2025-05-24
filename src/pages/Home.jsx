// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...a) => DEBUG && console.debug('[Home]', ...a);

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------------ */
  /* Redirect après login                                   */
  /* ------------------------------------------------------ */
  async function handleUser(u) {
    dbg('handleUser', u.id);

    await supabase
      .from('profiles')
      .upsert({ id: u.id, username: u.user_metadata.login || u.email }, { onConflict: 'id' });

    const { data: p } = await supabase
      .from('profiles')
      .select('is_verified,is_mj')
      .eq('id', u.id)
      .single();

    dbg('flags', p);

    if (p.is_mj) {
      navigate('/mj', { replace: true });
      return;
    }

    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', u.id);

    if (chars.length) navigate(`/character/${chars[0].id}`, { replace: true });
    else if (p.is_verified) navigate('/create-character', { replace: true });
    else navigate('/mj', { replace: true }); // joueur non vérifié
  }

  /* ------------------------------------------------------ */
  /* useEffect                                              */
  /* ------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      /* 1 — Flux “code + state” */
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (code && state) {
        dbg('Code flow detected, exchanging code…');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          dbg('exchangeCodeForSession error', error.message);
          setLoading(false);
          return;
        }
        dbg('Session obtained via code');
        // Nettoie l’URL → « #/ »
        window.history.replaceState({}, '', url.pathname + url.search.replace(/\\?.*/, '') + '#/');
      }

      /* 2 — Flux “#access_token” */
      const hash = window.location.hash;
      if (hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.slice(1));
        const at = params.get('access_token');
        const rt = params.get('refresh_token');
        if (at && rt) {
          dbg('Implicit flow detected, setSession');
          const { error } = await supabase.auth.setSession(at, rt);
          if (error) dbg('setSession error', error.message);
          window.location.replace(url.pathname + '#/');
          return;
        }
      }

      /* 3 — Listener auth + session initiale */
      const { data: { subscription } } =
        supabase.auth.onAuthStateChange((_e, sess) => {
          dbg('Auth event', _e);
          if (sess?.user) handleUser(sess.user);
          else setLoading(false);
        });

      const { data: { session } } = await supabase.auth.getSession();
      dbg('Initial session', session);
      if (session?.user) handleUser(session.user);
      else setLoading(false);

      return () => subscription.unsubscribe();
    })();
  }, [navigate]);

  /* ------------------------------------------------------ */
  /* Bouton login                                           */
  /* ------------------------------------------------------ */
  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://begliado.github.io/RPG_HP/' },
    });

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
