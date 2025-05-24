// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...a) => DEBUG && console.debug('[Home]', ...a);

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------------------------ */
  /* Redirect logic                                                     */
  /* ------------------------------------------------------------------ */
  async function handleUser(u) {
    dbg('handleUser', u.id);

    /* upsert profil */
    await supabase
      .from('profiles')
      .upsert({ id: u.id, username: u.user_metadata.login || u.email }, { onConflict: 'id' });

    /* flags */
    const { data: p } = await supabase
      .from('profiles')
      .select('is_verified,is_mj')
      .eq('id', u.id)
      .single();

    if (p.is_mj) {
      navigate('/mj', { replace: true });
      return;
    }

    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', u.id);

    if (chars.length) {
      navigate(`/character/${chars[0].id}`, { replace: true });
    } else if (p.is_verified) {
      navigate('/create-character', { replace: true });
    } else {
      navigate('/mj', { replace: true }); // en attente de vérif
    }
  }

  /* ------------------------------------------------------------------ */
  /* useEffect                                                           */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    /* 1. Parse manuellement le fragment #access_token=… et setSession  */
    const h = window.location.hash;
    if (h.includes('access_token')) {
      const params = new URLSearchParams(h.slice(1)); // enlève le «#»
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      dbg('Token fragment détecté', access_token);

      if (access_token && refresh_token) {
        // v1.x : setSession(access_token, refresh_token)
        supabase.auth
          .setSession(access_token, refresh_token)
          .then(({ error }) => {
            if (error) dbg('setSession error', error.message);
            else dbg('Session enregistrée');
            // nettoie l’URL -> #/
            window.location.replace(
              window.location.pathname + window.location.search + '#/'
            );
          });
        return; // on attend le reload
      }
    }

    /* 2. Listener auth */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
      dbg('Auth event', _e, sess);
      if (sess?.user) handleUser(sess.user);
      else setLoading(false);
    });

    /* 3. Session existante */
    supabase.auth.getSession().then(({ data: { session } }) => {
      dbg('getSession', session);
      if (session?.user) handleUser(session.user);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  /* ------------------------------------------------------------------ */
  /* UI login                                                           */
  /* ------------------------------------------------------------------ */
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
