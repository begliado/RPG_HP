// src/pages/Character.jsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[Character]', ...args);
const info = (...args) => console.info('[Character]', ...args);
const warn = (...args) => console.warn('[Character]', ...args);
const err = (...args) => console.error('[Character]', ...args);

export default function CharacterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    dbg('Checking session for Character page');
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        info('Pas de session, redirection /');
        navigate('/', { replace: true });
        return;
      }

      info('Session ok, fetch personnage', id);
      supabase
        .from('characters')
        .select('*, user_id')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            warn('Personnage introuvable, id=', id, 'error', error);
            navigate('/', { replace: true });
          } else if (data.user_id !== session.user.id) {
            warn('User mismatch, redirection /');
            navigate('/', { replace: true });
          } else {
            dbg('Personnage chargé', data);
            setCharacter(data);
          }
        })
        .catch((e) => {
          err('Erreur fetch personnage', e);
          navigate('/', { replace: true });
        })
        .finally(() => setLoading(false));
    });
  }, [id, navigate]);

  if (loading) {
    return <p>Chargement du personnage...</p>;
  }

  if (!character) {
    return <p>Personnage introuvable</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">{character.name}</h1>
      <p>
        <strong>Maison :</strong> {character.house}
      </p>
      <p>
        <strong>Niveau :</strong> {character.level}
      </p>
      <div className="mt-2">
        <strong>Inventaire :</strong>
        <ul className="list-disc list-inside">
          {character.inventory.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
