// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ is_verified: false, is_mj: false });

  // initialise ou récupère la session OAuth depuis l’URL
  async function handleRedirect() {
    const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
    if (error && error.error_description) {
      console.warn('Auth redirect error:', error.error_description);
    }
    return data?.session ?? null;
  }

  // logique post-auth : upsert profil, fetch flags et redirection
  async function initUser(u) {
    // create/update profile
    await supabase
      .from('profiles')
      .upsert({ id: u.id, username: u.user_metadata.login || u.email }, { onConflict: 'id' });

    // fetch flags
    const { data: p } = await supabase
      .from('profiles')
      .select('is_verified, is_mj')
      .eq('id', u.id)
      .single();

    setProfile({ is_verified: p.is_verified, is_mj: p.is_mj });

    if (p.is_mj) {
      navigate('/mj', { replace: true });
      return;
    }

    // joueur : existe-t-il déjà un perso ?
    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', u.id);

    if (chars.length) {
      navigate(`/character/${chars[0].id}`, { replace: true });
    } else if (p.is_verified) {
      navigate('/create-character', { replace: true });
    } else {
      navigate('/mj', { replace: true });
    }
  }

  useEffect(() => {
    let sub;

    (async () => {
      // 1) handle OAuth redirect if present
      const redirectedSession = await handleRedirect();
      const currentSession = redirectedSession ?? (await supabase.auth.getSession()).data.session;

      if (currentSession?.user) {
        setUser(currentSession.user);
        await initUser(currentSession.user);
      }

      setLoading(false);

      // 2) listen for future auth changes
      sub = supabase.auth.onAuthStateChange(async (_event, session) => {
        const u = session?.user;
        setUser(u || null);
        if (u) await initUser(u);
      }).subscription;
    })();

    return () => {
      if (sub) supabase.auth.removeSubscription(sub);
    };
  }, [navigate]);

  const handleLogin = () => {
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: 'https://begliado.github.io/RPG_HP/',
      },
    });
  };

  if (loading) {
    return <p>Chargement…</p>;
  }
  if (!user) {
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
  return null; // on ne rend rien, on redirige
}
