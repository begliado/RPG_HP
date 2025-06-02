// Game.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';

export default function Game() {
  const navigate = useNavigate();
  const { id } = useParams(); // si tu veux charger /game/:id
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return navigate('/', { replace: true });

      supabase
        .from('characters')
        .select('id')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }) => {
          if (!data) {
            // pas de personnage : retour sur création
            navigate('/create-character', { replace: true });
          } else {
            setLoading(false);
          }
        })
        .catch(() => navigate('/', { replace: true }));
    });
  }, [navigate]);

  if (loading) return <p>Chargement de votre partie…</p>;

  return (
    <div>
      <h1>Bienvenue dans le jeu</h1>
      {/* …contenu du jeu… */}
    </div>
  );
}
