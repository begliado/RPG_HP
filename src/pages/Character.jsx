// src/pages/Character.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { computeSkills } from '../utils/skills';

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

  const skills = useMemo(() => computeSkills(character), [character]);

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
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">{character.nom}</h1>

      <section className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Identité &amp; Origines</h2>
        <p>Dortoir : {character.dortoir}</p>
        <p>Maison : {character.maison}</p>
        <p>Ascendance : {character.ascendance}</p>
        <p>Année : {character.annee}</p>
        {character.background && (
          <p className="mt-2 whitespace-pre-line">{character.background}</p>
        )}
      </section>

      <section className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Caractéristiques</h2>
        <p>Esprit : {character.esprit}</p>
        <p>Cœur : {character.coeur}</p>
        <p>Corps : {character.corps}</p>
        <p>Magie : {character.magie}</p>
      </section>

      {skills && (
        <section className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Compétences</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <li>Bluff : {skills.bluff}</li>
            <li>Farce : {skills.farce}</li>
            <li>Tactique : {skills.tactique}</li>
            <li>Rumeur : {skills.rumeur}</li>
            <li>Décorum : {skills.decorum}</li>
            <li>Discrétion : {skills.discretion}</li>
            <li>Persuasion : {skills.persuasion}</li>
            <li>Romance : {skills.romance}</li>
            <li>Bagarre : {skills.bagarre}</li>
            <li>Endurance : {skills.endurance}</li>
            <li>Perception : {skills.perception}</li>
            <li>Précision : {skills.precision}</li>
          </ul>
        </section>
      )}
    </div>
  );
}
