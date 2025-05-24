// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';
function dbg(...args) {
  if (DEBUG) console.debug('[Home Debug]', ...args);
}

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // traite l’utilisateur connecté : upsert profil et redirection
  async function handleUser(u) {
    dbg('handleUser for', u.id);
    setUser(u);

    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert(
        { id: u.id, username: u.user_metadata.login || u.email },
        { onConflict: 'id' }
      );
    if (upsertErr) dbg('Upsert profile error:', upsertErr.message);

    const { data: p, error: profErr } = await supabase
      .from('profiles')
      .select('is_verified, is_mj')
      .eq('id', u.id)
      .single();
    if (profErr) dbg('Fetch profile error:', profErr.message);
    dbg('Profile flags:', p);

    if (p.is_mj) {
      dbg('Redirecting to MJ');
      navigate('/mj', { replace: true });
      return;
    }

    const { data: chars, error: charErr } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', u.id);
    if (charErr) dbg('Fetch characters error:', charErr.message);
    dbg('Characters:', chars);

    if (chars && chars.length) {
      dbg('Redirecting to character', chars[0].id);
      navigate(`/character/${chars[0].id}`, { replace: true });
    } else if (p.is_verified) {
      dbg('Redirecting to create-character');
      navigate('/create-character', { replace: true });
    } else {
      dbg('Redirecting to MJ for verification');
      navigate('/mj', { replace: true });
    }
  }

  useEffect(() => {
    // 1) Si l’URL contient un access_token, on le parse et on l’applique
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const fragment = hash.slice(1); // supprime le '#'
      const params = new URLSearchParams(fragment);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      dbg('Manual token parse', access_token);
      if (access_token) {
        supabase.auth
          .setSession({ access_token, refresh_token })
          .then(({ error }) => {
            if (error) dbg('setSession error:', error.message);
            // nettoyage de l’URL pour ne garder que '#/'
            window.location.replace(
              window.location.pathname + window.location.search + '#/'
            );
          });
        return; // on attend la redirection
      }
    }

    // 2) écoute des changements de session
    dbg('Setting up auth listener');
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      dbg('Auth change event', session);
      if (session?.user) {
        handleUser(session.user);
      } else {
        dbg('No session user, stop loading');
        setLoading(false);
      }
    });

    // 3) vérification initiale de la session stockée
    dbg('Initial session check');
    supabase.auth.getSession().then(({ data: { session } }) => {
      dbg('getSession returned', session);
      if (session?.user) {
        handleUser(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      dbg('Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = () => {
    dbg('Triggering OAuth login');
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://begliado.github.io/RPG_HP/' },
    });
  };

  if (loading) {
    dbg('Rendering loading state');
    return <p>Chargement…</p>;
  }

  // si pas d’utilisateur, affiche le bouton de connexion
  dbg('Rendering login button');
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Bienvenue à Poudlard</h1>
      <button
        onClick={handleLogin}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Se connecter avec GitHub
      </button>
    </div>
  );
}
