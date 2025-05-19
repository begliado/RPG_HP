// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ is_verified: false, is_mj: false });

  // Vérifie ou crée le profil en base
  async function ensureProfile(u) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', u.id)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Erreur lors de la vérification du profil :', error);
      return;
    }
    if (!data) {
      await supabase.from('profiles').insert({
        id: u.id,
        username: u.user_metadata.login || u.email
      });
    }
  }

  useEffect(() => {
    let subscription;

    async function initialize() {
      // Récupère la session actuelle
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user;
      if (u) {
        setUser(u);
        await ensureProfile(u);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_verified, is_mj')
          .eq('id', u.id)
          .single();
        if (profileData) {
          setProfile({
            is_verified: profileData.is_verified,
            is_mj: profileData.is_mj
          });
        }
      }
      setLoading(false);

      // Écoute les changements d'authentification
      subscription = supabase.auth.onAuthStateChange(
        async (_event, sess) => {
          const usr = sess?.user;
          setUser(usr || null);
          if (usr) {
            await ensureProfile(usr);
            const { data: pd } = await supabase
              .from('profiles')
              .select('is_verified, is_mj')
              .eq('id', usr.id)
              .single();
            if (pd) {
              setProfile({
                is_verified: pd.is_verified,
                is_mj: pd.is_mj
              });
            }
          }
          setLoading(false);
        }
      ).subscription;
    }

    initialize();
    return () => {
      if (subscription) supabase.auth.removeSubscription(subscription);
    };
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
  };

  if (loading) {
    return <p>Chargement...</p>;
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

  // Affiche le statut de vérification pour les tests
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">
        Bonjour, {user.user_metadata.login || user.email}
      </h1>
      <p>
        Statut de vérification :{' '}
        {profile.is_verified ? (
          <span className="text-green-600 font-semibold">OK</span>
        ) : (
          <span className="text-yellow-600 font-semibold">
            En attente de vérif
          </span>
        )}
      </p>
    </div>
  );
}
