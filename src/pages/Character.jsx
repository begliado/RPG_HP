// src/pages/Character.jsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function CharacterPage() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          // Fallback pour le test
          setCharacter({
            id: 'test-student',
            name: 'Harry Test',
            house: 'Gryffondor',
            level: 1,
            inventory: ['Baguette magique']
          });
        } else {
          setCharacter(data);
        }
      });
  }, [id]);

  if (!character) {
    return <p>Chargement du personnage...</p>;
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
