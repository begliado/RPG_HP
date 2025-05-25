// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Home() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 1) Restaure la session active (si cookie/localStorage présent)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2) Écoute les changements (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3) Bouton minimal qui lance GitHub OAuth
  const login = () => {
    supabase.auth.signInWithOAuth({ provider: 'github' });
  };

  // 4) Rendu élémentaire
  if (session?.user) {
    return (
      <div style={{ padding: 32, background: '#222', color: '#eee', minHeight: '100vh' }}>
        <h1>Connecté en tant que {session.user.email}</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, background: '#222', color: '#eee', minHeight: '100vh' }}>
      <h1>Non connecté</h1>
      <button onClick={login} style={{ padding: '8px 16px', marginTop: 16 }}>
        Se connecter avec GitHub
      </button>
    </div>
  );
}
