// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // récupère/écoute la session Supabase et redirige en fonction du profil
  useEffect(() => {
    let sub = supabase.auth
      .onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await handleUser(session.user);
        } else {
          setLoading(false);
        }
      })
      .subscription;

    // au premier chargement, récupère la session stockée (detectSessionInUrl active)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUser(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => sub.unsubscribe();
  }, [navigate]);

  // crée/actualise le profil, récupère flags et redirige
  async function handleUser(u) {
    // upsert du profil
    await supabase
      .from('profiles')
      .upsert(
        { id: u.id, username: u.user_metadata.login || u.email },
        { onConflict: 'id' }
      );

    const { data: p } = await supabase
      .from('profiles')
      .select('is_verified, is_mj')
      .eq('id', u.id)
      .single();

    if (p.is_mj) {
      navigate('/mj', { replace: true });
      return;
    }

    // joueur : a-t-il déjà un personnage ?
    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', u.id);

    if (chars.length) {
      navigate(`/character/${chars[0].id}`, { replace: true });
    } else if (p.is_verified) {
      navigate('/create-character', { replace: true });
    } else {
      // non-verifié ; renvoyer au dashboard MJ pour validation
      navigate('/mj', { replace: true });
    }
  }

  const handleLogin = () => {
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://begliado.github.io/RPG_HP/' },
    });
  };

  if (loading) {
    return <p>Chargement…</p>;
  }
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
