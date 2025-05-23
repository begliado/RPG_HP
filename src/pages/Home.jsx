// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ is_verified: false, is_mj: false });

  // Vérifie / crée le profil, puis redirige selon le rôle et l’existence d’un perso
  async function initUser(u) {
    // ensure profile exists
    await supabase
      .from('profiles')
      .upsert({ id: u.id, username: u.user_metadata.login || u.email }, { onConflict: 'id' });

    // récupère flags is_verified / is_mj
    const { data: p } = await supabase
      .from('profiles')
      .select('is_verified, is_mj')
      .eq('id', u.id)
      .single();
    setProfile({ is_verified: p.is_verified, is_mj: p.is_mj });

    if (p.is_mj) {
      // MJ → dashboard MJ
      navigate('/mj', { replace: true });
      return;
    }

    // joueur classique → regarde s’il a déjà un personnage
    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', u.id);
    if (chars.length > 0) {
      // redirige vers son premier perso existant
      navigate(`/character/${chars[0].id}`, { replace: true });
    } else if (p.is_verified) {
      // joueur validé mais sans perso → page création
      navigate('/create-character', { replace: true });
    } else {
      // joueur non vérifié
      navigate('/mj', { replace: true });
    }
  }

  useEffect(() => {
    let { data: listener } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user;
      setUser(u || null);
      if (u) {
        await initUser(u);
      }
      setLoading(false);
    });

    // initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user;
      setUser(u || null);
      if (u) initUser(u);
      else setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

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

  return null;  // on ne doit jamais arriver ici, on redirige toujours avant
}
