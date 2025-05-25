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
    if (p.is_mj) return navigate('/mj', { replace: true });
    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id);
    if (chars.length) return navigate(`/character/${chars[0].id}`, { replace: true });
    if (p.is_verified) return navigate('/create-character', { replace: true });
    navigate('/mj', { replace: true });
  }

  useEffect(() => {
    dbg('URL:', window.location.href, 'hash:', window.location.hash);
    supabase.auth.getSession().then(({ data: { session } }) => {
      dbg('initial session', session);
      if (session?.user) handleUser(session.user);
      else setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      dbg('onAuthStateChange', _e, session);
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

  if (loading) {
    dbg('Rendering loading…');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Chargement…</p>
      </div>
    );
  }

  dbg('Rendering login UI');
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Bienvenue à Poudlard</h1>
      <button
        onClick={login}
        className="px-6 py-3 bg-blue-700 hover:bg-blue-600 rounded-lg text-white font-medium shadow"
      >
        Se connecter avec GitHub
      </button>
    </div>
  );
}
