// src/pages/CreateCharacter.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[CreateCharacter]', ...args);
const info = (...args) => console.info('[CreateCharacter]', ...args);
const err = (...args) => console.error('[CreateCharacter]', ...args);

export default function CreateCharacter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dbg('Checking session for CreateCharacter page');
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        info('Pas de session, redirection /');
        navigate('/', { replace: true });
      } else {
        dbg('Session ok pour création personnage');
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return <p>Chargement…</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Créer un personnage</h1>
      <p className="text-gray-600">Ici, tu pourras bientôt remplir le formulaire pour créer ton personnage.</p>
    </div>
  );
}
