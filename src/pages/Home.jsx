// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Home() {
  const [loading, setLoading]     = useState(true);
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState({ is_verified: false, is_mj: false });
  const [characters, setCharacters] = useState([]);

  // 👉 Cette fonction est appelée dès qu’on a une session valide
  async function initData(user) {
    // 1) Upsert : si pas de ligne dans profiles, on la crée
    await supabase
      .from('profiles')
      .upsert(
        { id: user.id, username: user.user_metadata.login || user.email },
        { onConflict: 'id' }
      );

    // 2) Récupère les flags
    const { data: p } = await supabase
      .from('profiles')
      .select('is_verified,is_mj')
      .eq('id', user.id)
      .single();
    setProfile({ is_verified: p.is_verified, is_mj: p.is_mj });

    // 3) Récupère les persos
    const { data: chars } = await supabase
      .from('characters')
      .select('id,name')
      .eq('user_id', user.id);
    setCharacters(chars || []);

    setLoading(false);
  }

  useEffect(() => {
    // Au chargement : tente de restaurer la session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        initData(session.user);      // ← crée le profil si nécessaire
      } else {
        setLoading(false);
      }
    });

    // Écoute les login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser(session.user);
        initData(session.user);      // ← idem, upsert si nouveau user
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://begliado.github.io/RPG_HP/' },
    });

  if (loading) return <p>Chargement…</p>;

  if (!user) {
    return (
      <div>
        <h1>Bienvenue à Poudlard</h1>
        <button onClick={login}>Se connecter avec GitHub</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Bonjour, {user.user_metadata.login || user.email}</h1>
      <p>
        Statut : {profile.is_verified ? '✅ Vérifié' : '⏳ En attente'}
      </p>
      <p>Rôle : {profile.is_mj ? 'MJ' : 'Joueur'}</p>

      {profile.is_mj ? (
        <button onClick={() => (window.location.href = '/mj')}>
          Tableau de bord MJ
        </button>
      ) : characters.length > 0 ? (
        <button
          onClick={() =>
            (window.location.href = `/character/${characters[0].id}`)
          }
        >
          Accéder à mon personnage
        </button>
      ) : profile.is_verified ? (
        <button onClick={() => (window.location.href = '/create-character')}>
          Créer mon personnage
        </button>
      ) : (
        <p>En attente de validation par le MJ.</p>
      )}
    </div>
  );
}
