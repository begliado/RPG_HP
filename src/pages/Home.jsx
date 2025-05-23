// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState({ is_verified: false, is_mj: false });

  // crée ou met à jour le profil, charge les flags et redirige
  async function initUser(u) {
    await supabase
      .from('profiles')
      .upsert({ id: u.id, username: u.user_metadata.login || u.email }, { onConflict: 'id' });

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
    // sinon, joueur : regarde s’il a déjà un perso
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
    // 1) écoute les changements d’auth et garde la session
    const { subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user;
      setUser(u || null);
      if (u) await initUser(u);
      else setLoading(false);
    });

    // 2) au premier chargement, récupère la session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user;
      setUser(u || null);
      if (u) initUser(u);
      else setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = () => {
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://begliado.github.io/RPG_HP/' }
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

  // on ne rend rien : l’utilisateur est redirigé par initUser
  return null;
}
