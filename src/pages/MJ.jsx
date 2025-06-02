// MJ.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function MJ() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        // pas connecté, on redirige
        return navigate('/', { replace: true });
      }
      // on fetch le profil
      supabase
        .from('profiles')
        .select('is_mj')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (!data?.is_mj) {
            // pas MJ, renvoyer au Home ou “accès refusé”
            navigate('/', { replace: true });
          } else {
            setLoading(false);
          }
        })
        .catch(() => navigate('/', { replace: true }));
    });
  }, [navigate]);

  if (loading) return <p>Chargement du dashboard MJ…</p>;

  return (
    <div>
      <h1>Tableau de bord MJ</h1>
      {/* …contenu MJ… */}
    </div>
  );
}
