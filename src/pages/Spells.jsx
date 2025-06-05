// src/pages/Spells.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[Spells]', ...args);
const info = (...args) => console.info('[Spells]', ...args);
const warn = (...args) => console.warn('[Spells]', ...args);
const err = (...args) => console.error('[Spells]', ...args);

export default function Spells() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [spells, setSpells] = useState([]);

  useEffect(() => {
    dbg('Checking session for Spells page');
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        info('Pas de session, redirection /');
        navigate('/', { replace: true });
        return;
      }
      try {
        const { data, error } = await supabase
          .from('spells')
          .select('*')
          .order('name');
        if (error) {
          err('fetch spells error', error);
        }
        setSpells(data || []);
      } catch (e) {
        err('exception fetching spells', e);
      } finally {
        setLoading(false);
      }
    });
  }, [navigate]);

  if (loading) return <p>Chargement des sorts...</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Liste des sorts</h1>
      <ul className="space-y-2">
        {spells.map((s) => (
          <li key={s.id} className="bg-gray-800 p-2 rounded">
            <div className="font-semibold">{s.name}</div>
            <div className="text-sm">{s.description}</div>
            <div className="text-sm">
              Niveau {s.level} – {s.school}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
