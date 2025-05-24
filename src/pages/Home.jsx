// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[Home]', ...args);

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  async function handleUser(user) {
    dbg('handleUser', user.id);

    await supabase
      .from('profiles')
      .upsert(
        { id: user.id, username: user.user_metadata.login || user.email },
        { onConflict: 'id' }
      );

    const { data: p } = await supabase
      .from('profiles')
      .select('is_verified,is_mj')
      .eq('id', user.id)
      .single();

    if (p.is_mj) {
      dbg('→ MJ');
      navigate('/mj', { replace: true });
      return;
    }

    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id);

    if (chars.length) {
      dbg('→ character', chars[0].id);
      navigate(`/character/${chars[0].id}`, { replace: true });
    } else if (p.is_verified) {
      dbg('→ create-character');
      navigate('/create-character', { replace: true });
    } else {
      dbg('→ MJ (pending verif)');
      navigate('/mj', { replace: true });
    }
  }

  useEffect(() => {
    // 1) v2 va automatiquement consommer le code ou le fragment
    //    grâce à `detectSessionInUrl: true`

    // 2) on écoute ensuite les changements de session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      dbg('Auth event', session);
      if (session?.user) handleUser(session.user);
      else setLoading(false);
    });

    // 3) enfin on récupère la session existante (si stockée)
    supabase.auth.getSession().then(({ data: { session } }) => {
      dbg('Initial session', session);
      if (session?.user) handleUser(session.user);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://begliado.github.io/RPG_HP/' },
    });

  if (loading) return <p>Chargement…</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Bienvenue à Poudlard</h1>
      <button
        onClick={login}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Se connecter avec GitHub
      </button>
    </div>
  );
}
