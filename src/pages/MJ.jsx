// src/pages/MJ.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function MJPage() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, username, is_verified, is_mj')
      .eq('is_mj', false)
      .then(({ data }) => setPlayers(data || []));
  }, []);

  const verifyPlayer = async (id) => {
    await supabase.from('profiles').update({ is_verified: true }).eq('id', id);
    setPlayers(players.filter(p => p.id !== id));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard MJ</h1>
      {players.length === 0 ? (
        <p>Aucun joueur en attente.</p>
      ) : (
        <ul>
          {players.map(p => (
            <li key={p.id} className="flex justify-between items-center mb-2">
              <span>{p.username}</span>
              <button
                onClick={() => verifyPlayer(p.id)}
                className="px-2 py-1 bg-green-500 text-white rounded"
              >
                Vérifier
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
