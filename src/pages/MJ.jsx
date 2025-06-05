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
  const [actions, setActions] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [quests, setQuests] = useState([]);

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

  // Récupération des données asynchrones (actions, timeline, agenda, quêtes)
  useEffect(() => {
    if (!loading) {
      dbg('Chargement des données MJ');
      const loadData = async () => {
        try {
          const { data: act, error: actErr } = await supabase
            .from('actions')
            .select('*')
            .order('created_at');
          if (actErr) err('actions error', actErr);
          setActions(act || []);

          const { data: time, error: timeErr } = await supabase
            .from('timeline')
            .select('*')
            .order('position');
          if (timeErr) err('timeline error', timeErr);
          setTimeline(time || []);

          const { data: ag, error: agErr } = await supabase
            .from('agenda')
            .select('*')
            .order('date');
          if (agErr) err('agenda error', agErr);
          setAgenda(ag || []);

          const { data: qs, error: qsErr } = await supabase
            .from('quests')
            .select('*')
            .order('created_at');
          if (qsErr) err('quests error', qsErr);
          setQuests(qs || []);
        } catch (e) {
          err('loadData exception', e);
        }
      };
      loadData();
    }
  }, [loading]);

  const skipPlayer = (name) => {
    info('Passer le tour de', name);
    setTimeline((prev) =>
      prev.map((t) => (t.player === name ? { ...t, status: 'passé' } : t))
    );
  };

  const remindPlayer = (name) => {
    info('Relance du joueur', name);
    // Intégration de notifications à prévoir (Discord/email)
  };

  if (loading) return <p>Chargement du dashboard MJ…</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Tableau de bord MJ</h1>
      <button
        onClick={() => navigate('/create-resources')}
        className="mb-6 px-4 py-2 bg-green-600 rounded"
      >
        Gérer les ressources (sorts &amp; livres)
      </button>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Progression de la partie</h2>
        {actions.length === 0 ? (
          <p>Aucune action en attente.</p>
        ) : (
          <ul className="space-y-1">
            {actions.map((a) => (
              <li key={a.id} className="bg-gray-800 p-2 rounded">
                <span className="font-medium">{a.player}</span> : {a.description} ({a.status})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Timeline</h2>
        <ul className="space-y-1">
          {timeline.map((t, i) => (
            <li key={i} className="flex items-center justify-between bg-gray-800 p-2 rounded">
              <span>
                {t.player} - {t.status}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => skipPlayer(t.player)}
                  className="px-2 py-1 bg-red-600 rounded text-sm"
                >
                  Passer
                </button>
                <button
                  onClick={() => remindPlayer(t.player)}
                  className="px-2 py-1 bg-blue-600 rounded text-sm"
                >
                  Relancer
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Agenda</h2>
        <ul className="space-y-1">
          {agenda.map((evt) => (
            <li key={evt.id} className="bg-gray-800 p-2 rounded">
              {evt.date} – {evt.title}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Quêtes</h2>
        <ul className="space-y-1">
          {quests.map((q) => (
            <li key={q.id} className="bg-gray-800 p-2 rounded">
              {q.title} – {q.status}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
