// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';

function dbg(...args) {
  if (DEBUG) console.debug('[Home Debug]', ...args);
}

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  async function handleUser(u) {
    dbg('handleUser start for', u.id);

    setUser(u);

    dbg('Upsert profile');
    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert(
        { id: u.id, username: u.user_metadata.login || u.email },
        { onConflict: 'id' }
      );
    if (upsertErr) dbg('Upsert error:', upsertErr.message);

    dbg('Fetch profile flags');
    const { data: p, error: profErr } = await supabase
      .from('profiles')
      .select('is_verified, is_mj')
      .eq('id', u.id)
      .single();
    if (profErr) dbg('Profile fetch error:', profErr.message);

    dbg('Flags:', p);

    if (p.is_mj) {
      dbg('User is MJ, navigate to /mj');
      navigate('/mj', { replace: true });
      return;
    }

    dbg('Fetch characters for', u.id);
    const { data: chars, error: charErr } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', u.id);
    if (charErr) dbg('Characters fetch error:', charErr.message);

    dbg('Characters:', chars);

    if (chars.length) {
      dbg('Existing character, navigate to', `/character/${chars[0].id}`);
      navigate(`/character/${chars[0].id}`, { replace: true });
    } else if (p.is_verified) {
      dbg('Verified player without character, navigate to /create-character');
      navigate('/create-character', { replace: true });
    } else {
      dbg('Unverified player, navigate to /mj for validation');
      navigate('/mj', { replace: true });
    }
  }

  useEffect(() => {
    dbg('Setting up onAuthStateChange listener');
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      dbg('onAuthStateChange event:', event, session);
      if (session?.user) {
        handleUser(session.user);
      } else {
        dbg('No session user, stopping loading');
        setLoading(false);
      }
    });

    dbg('Initial session check');
    supabase.auth.getSession().then(({ data: { session } }) => {
      dbg('getSession returned', session);
      if (session?.user) {
        handleUser(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      dbg('Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = () => {
    dbg('Triggering signInWithOAuth');
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://begliado.github.io/RPG_HP/' },
    });
  };

  if (loading) {
    dbg('Rendering loading state');
    return <p>Chargement…</p>;
  }
  if (!user) {
    dbg('Rendering login button');
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">Bienvenue à Poudlard</h1>
        <button
          onClick={handleLogin}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Se connecter avec GitHub
        </button>
      </div>
    );
  }

  dbg('User is set but Home returns null (should have redirected)');
  return null;
}
