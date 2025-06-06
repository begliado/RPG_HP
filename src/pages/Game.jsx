// Game.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[Game]', ...args);
const info = (...args) => console.info('[Game]', ...args);
const warn = (...args) => console.warn('[Game]', ...args);
const err = (...args) => console.error('[Game]', ...args);

export default function Game() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dbg('Checking session for Game page');
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        info('Pas de session, redirection /');
        return navigate('/', { replace: true });
      }

      info('Session ok, vérification personnage existant');
      supabase
        .from('characters')
        .select('id')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }) => {
          if (!data) {
            warn('Aucun personnage, redirection /create-character');
            navigate('/create-character', { replace: true });
          } else {
            dbg('Personnage trouvé, accès jeu');
            setLoading(false);
          }
        })
        .catch((e) => {
          err('Erreur fetch personnage', e);
          navigate('/', { replace: true });
        });
    });
  }, [navigate]);

  if (loading) return <p>Chargement de votre partie…</p>;

  return (
    <div className="p-4 text-gray-100">
      <h1 className="text-2xl font-bold mb-4">Bienvenue dans le jeu</h1>
      {/* …contenu du jeu… */}
    </div>
  );
}
