// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------
 * Debug utilities (toggle with VITE_DEBUG=true)
 * ------------------------------------------------------------------ */
const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[Home]', ...args);
const info = (...args) => console.info('[Home]', ...args);
const warn = (...args) => console.warn('[Home]', ...args);
const err = (...args) => console.error('[Home]', ...args);

export default function Home() {
  dbg('Component render start');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ is_verified: false, is_mj: false });
  const [characters, setCharacters] = useState([]);

  /* ----------------------------------------------------------------
   * Initialize data for authenticated user
   * ---------------------------------------------------------------- */
  async function initData(user) {
    dbg('initData start for user', user.id);
    try {
      // Upsert profile
      info('Upserting profile for', user.id);
      const { data: upserted, error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, username: user.user_metadata.login || user.email },
          { onConflict: 'id' }
        );
      if (upsertError) {
        err('Upsert error', upsertError);
      } else {
        dbg('Upsert result', upserted);
      }

      // Fetch profile flags
      info('Fetching profile flags for', user.id);
      const { data: p, error: profileErr } = await supabase
        .from('profiles')
        .select('is_verified,is_mj')
        .eq('id', user.id)
        .single();
      if (profileErr) {
        err('Fetch profile flags error', profileErr);
      } else {
        dbg('Profile flags fetched', p);
        setProfile({ is_verified: p.is_verified, is_mj: p.is_mj });
      }

      // Fetch characters
      info('Fetching characters for', user.id);
      const { data: chars, error: charErr } = await supabase
        .from('characters')
        .select('id,name')
        .eq('user_id', user.id);
      if (charErr) {
        err('Fetch characters error', charErr);
      } else {
        dbg('Characters fetched', chars);
        setCharacters(chars || []);
      }
    } catch (e) {
      err('Unexpected initData exception', e);
    } finally {
      dbg('initData end');
      setLoading(false);
    }
  }

  /* ----------------------------------------------------------------
   * Handle login button click
   * ---------------------------------------------------------------- */
  const login = async () => {
    dbg('login clicked');
    info('Starting OAuth signInWithOAuth');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: 'https://begliado.github.io/RPG_HP/' }
      });
      if (error) {
        err('signInWithOAuth error', error);
      } else if (data?.url) {
        dbg('Redirecting to OAuth URL', data.url);
        window.location.href = data.url;
      } else {
        warn('No OAuth URL returned');
      }
    } catch (e) {
      err('signInWithOAuth exception', e);
    }
  };

  /* ----------------------------------------------------------------
   * Listen for authentication state
   * ---------------------------------------------------------------- */
  useEffect(() => {
    dbg('useEffect mount');
    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        err('getSession error', error);
      }
      dbg('getSession returned', session);
      if (session?.user) {
        info('Session found on mount, user:', session.user.id);
        setUser(session.user);
        initData(session.user);
      } else {
        info('No session on mount');
        setUser(null);
        setLoading(false);
      }
    });

    // Auth state change listener
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      dbg('onAuthStateChange event', event, 'session', session);
      if (session?.user) {
        info('SIGNED_IN event for', session.user.id);
        setUser(session.user);
        initData(session.user);
      } else {
        info('SIGNED_OUT or no session event');
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      dbg('Cleanup auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  /* ----------------------------------------------------------------
   * Render logic
   * ---------------------------------------------------------------- */
  dbg('Render phase, loading=', loading, 'user=', user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">
        <p>Chargement…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100 p-4">
        <h1 className="text-3xl font-bold mb-4">Bienvenue à Poudlard</h1>
        <button
          onClick={login}
          className="px-6 py-3 bg-blue-700 hover:bg-blue-600 rounded-lg text-white font-medium shadow"
        >
          Se connecter avec GitHub
        </button>
      </div>
    );
  }

  dbg('Authenticated UI render, profile=', profile, 'characters=', characters);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-2">Bonjour, {user.user_metadata.login || user.email}</h1>
      <p>Statut de vérification : {profile.is_verified ? '✅ Vérifié' : '⏳ En attente'}</p>
      <p>Rôle : {profile.is_mj ? 'MJ' : 'Joueur'}</p>

      {profile.is_mj ? (
        <button
          onClick={() => navigate('/mj')}
          className="mt-4 px-4 py-2 bg-green-600 rounded"
        >
          Tableau de bord MJ
        </button>
      ) : characters.length > 0 ? (
        <button
          onClick={() => navigate(`/character/${characters[0].id}`)}
          className="mt-4 px-4 py-2 bg-blue-600 rounded"
        >
          Accéder à mon personnage ({characters[0].name})
        </button>
      ) : profile.is_verified ? (
        <button
          onClick={() => navigate('/create-character')}
          className="mt-4 px-4 py-2 bg-yellow-600 rounded"
        >
          Créer mon personnage
        </button>
      ) : (
        <p className="mt-4">Votre compte est en attente de validation par le MJ.</p>
      )}
    </div>
  );
}
