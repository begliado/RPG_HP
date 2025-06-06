// src/pages/ManageCharacter.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[ManageCharacter]', ...args);
const info = (...args) => console.info('[ManageCharacter]', ...args);
const warn = (...args) => console.warn('[ManageCharacter]', ...args);
const err = (...args) => console.error('[ManageCharacter]', ...args);

export default function ManageCharacter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    dbg('Checking session for ManageCharacter page');
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        info('Pas de session, redirection /');
        navigate('/', { replace: true });
        return;
      }

      info('Session ok, fetch personnage');
      supabase
        .from('characters')
        .select('id, nom')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            warn('Aucun personnage, redirection /create-character');
            navigate('/create-character', { replace: true });
          } else {
            dbg('Personnage chargé', data);
            setCharacter(data);
            setLoading(false);
          }
        })
        .catch((e) => {
          err('Erreur fetch personnage', e);
          navigate('/', { replace: true });
        });
    });
  }, [navigate]);

  if (loading) return <p>Chargement…</p>;

  if (!character) return <p>Personnage introuvable</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Gestion du personnage</h1>
      <p className="mb-4">{character.nom}</p>
      <div className="space-x-2">
        <button
          onClick={() => navigate(`/character/${character.id}`)}
          className="px-4 py-2 bg-blue-600 rounded"
        >
          Voir la fiche de personnage
        </button>
        <button
          onClick={() => navigate('/game')}
          className="px-4 py-2 bg-green-600 rounded"
        >
          Reprendre la partie
        </button>
      </div>
    </div>
  );
}
