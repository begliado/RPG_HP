// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ is_verified: false, is_mj: false });

  // S’assure que le profil existe en base
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
    const session = supabase.auth.session();
    const u = session?.user;

    if (u) {
      setUser(u);
      ensureProfile(u).then(async () => {
        const { data } = await supabase
          .from('profiles')
          .select('is_verified, is_mj')
          .eq('id', u.id)
          .single();
        if (data) {
          setProfile({ is_verified: data.is_verified, is_mj: data.is_mj });
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const usr = session?.user;
      setUser(usr || null);
      if (usr) {
        await ensureProfile(usr);
        const { data } = await supabase
          .from('profiles')
          .select('is_verified, is_mj')
          .eq('id', usr.id)
          .single();
        if (data) {
          setProfile({ is_verified: data.is_verified, is_mj: data.is_mj });
        }
      }
      setLoading(false);
    });

    return () => listener.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signIn({ provider: 'github' });
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
