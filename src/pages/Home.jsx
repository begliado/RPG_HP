// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

/* Simple debug utility (toggle with VITE_DEBUG) */
const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[Home]', ...args);

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  /* Redirect based on profile */
  async function handleUser(user) {
    dbg('handleUser', user.id);

    await supabase
      .from('profiles')
      .upsert({ id: user.id, username: user.user_metadata.login || user.email }, { onConflict: 'id' });

    const { data: p } = await supabase
      .from('profiles')
      .select('is_verified,is_mj')
      .eq('id', user.id)
      .single();

    if (p.is_mj) {
      dbg('→ MJ');
      return navigate('/mj', { replace: true });
    }

    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id);

    if (chars.length) {
      dbg('→ character', chars[0].id);
      return navigate(`/character/${chars[0].id}`, { replace: true });
    }

    if (p.is_verified) {
      dbg('→ create-character');
      return navigate('/create-character', { replace: true });
    }

    dbg('→ MJ (pending verification)');
    navigate('/mj', { replace: true });
  }

  useEffect(() => {
    (async () => {
      // 1️⃣ Consume OAuth redirect (code flow or implicit) automatically
      const { data: { session }, error: redirectError } = await supabase.auth.getSessionFromUrl({ storeSession: true });
      if (redirectError) {
        dbg('getSessionFromUrl error', redirectError.message);
      } else {
        dbg('getSessionFromUrl session', session);
      }

      // If a session was established, redirect immediately
      if (session?.user) {
        await handleUser(session.user);
        return;
      }

      // 2️⃣ Fallback: listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, sbSession) => {
        dbg('onAuthStateChange', _event, sbSession);
        if (sbSession?.user) {
          handleUser(sbSession.user);
        } else {
          setLoading(false);
        }
      });

      // 3️⃣ Initial session check (in case stored)
      const { data: { session: storedSession } } = await supabase.auth.getSession();
      dbg('initial getSession', storedSession);
      if (storedSession?.user) {
        await handleUser(storedSession.user);
      } else {
        setLoading(false);
      }

      return () => subscription.unsubscribe();
    })();
  }, [navigate]);

  // Trigger GitHub OAuth
  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: 'https://begliado.github.io/RPG_HP/',
      },
    });

  if (loading) {
    dbg('Rendering loading…');
    return <p>Chargement…</p>;
  }

  dbg('Rendering login UI');
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
