// MJ.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[MJ]', ...args);
const info = (...args) => console.info('[MJ]', ...args);
const warn = (...args) => console.warn('[MJ]', ...args);
const err = (...args) => console.error('[MJ]', ...args);

export default function MJ() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dbg('Checking session for MJ page');
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        info('Aucune session, redirection vers /');
        return navigate('/', { replace: true });
      }
      info('Session ok, vérification rôle MJ');
      supabase
        .from('profiles')
        .select('is_mj')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (!data?.is_mj) {
            warn('Utilisateur non MJ, redirection /');
            navigate('/', { replace: true });
          } else {
            dbg('Accès MJ autorisé');
            setLoading(false);
          }
        })
        .catch((e) => {
          err('Erreur fetch profil', e);
          navigate('/', { replace: true });
        });
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
