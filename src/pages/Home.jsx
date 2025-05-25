// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ is_verified: false, is_mj: false });
  const [characters, setCharacters] = useState([]);

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        initData(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
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

  async function initData(user) {
    // Ensure profile
    await supabase
      .from('profiles')
      .upsert({ id: user.id, username: user.user_metadata.login || user.email }, { onConflict: 'id' });
    // Fetch profile flags
    const { data: p } = await supabase
      .from('profiles')
      .select('is_verified,is_mj')
      .eq('id', user.id)
      .single();
    setProfile({ is_verified: p.is_verified, is_mj: p.is_mj });
    // Fetch characters
    const { data: chars } = await supabase
      .from('characters')
      .select('id,name')
      .eq('user_id', user.id);
    setCharacters(chars || []);
    setLoading(false);
  }

  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://begliado.github.io/RPG_HP/' },
    });

  if (loading) {
    return <p>Chargement…</p>;
  }

  if (!user) {
    return (
      <div>
        <h1>Bienvenue à Poudlard</h1>
        <button onClick={login}>Se connecter avec GitHub</button>
      </div>
    );
  }

  // Authenticated UI
  return (
    <div>
      <h1>Bonjour, {user.user_metadata.login || user.email}</h1>
      <p>
        Statut de vérification :{' '}
        {profile.is_verified ? '✅ Vérifié' : '⏳ En attente'}
      </p>
      <p>Rôle : {profile.is_mj ? 'Maître du Jeu' : 'Joueur'}</p>

      {profile.is_mj ? (
        <button onClick={() => window.location.href = '/mj'}>
          Accéder au tableau de bord MJ
        </button>
      ) : (
        <>
          {characters.length > 0 ? (
            <button onClick={() => window.location.href = `/character/${characters[0].id}`}>
              Accéder à mon personnage
            </button>
          ) : profile.is_verified ? (
            <button onClick={() => window.location.href = '/create-character'}>
              Créer mon personnage
            </button>
          ) : (
            <p>Votre compte est en attente de validation par le MJ.</p>
          )}
        </>
      )}
    </div>
  );
}
