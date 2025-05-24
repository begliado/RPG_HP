// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Initialise ou récupère la session et redirige selon le profil
  async function initUserSession() {
    // Récupère la session stockée ou dans l'URL
    const {
      data: { session: urlSession },
      error: urlError
    } = await supabase.auth.getSessionFromUrl({ storeSession: true });
    if (urlError) console.warn('Auth redirect error:', urlError.error_description);

    const {
      data: { session: storedSession }
    } = await supabase.auth.getSession();

    const currentSession = urlSession || storedSession;

    if (currentSession?.user) {
      const u = currentSession.user;
      setUser(u);

      // Upsert profil
      await supabase
        .from('profiles')
        .upsert(
          { id: u.id, username: u.user_metadata.login || u.email },
          { onConflict: 'id' }
        );

      // Récupère les flags
      const { data: p } = await supabase
        .from('profiles')
        .select('is_verified, is_mj')
        .eq('id', u.id)
        .single();

      if (p.is_mj) {
        navigate('/mj', { replace: true });
        return;
      }

      // Joueur classique
      const {
        data: chars
      } = await supabase
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

    setLoading(false);
  }

  useEffect(() => {
    // Abonnement aux changements d’auth
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) initUserSession();
    });

    // Premier init
    initUserSession();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = () => {
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: 'https://begliado.github.io/RPG_HP/#/'
      }
    });
  };

  if (loading) return <p>Chargement…</p>;
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

  return null; // on redirige toujours avant de rendre
}
