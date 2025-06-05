// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------
 * Debug utilities (toggle with VITE_DEBUG=true in .env)
 * ------------------------------------------------------------------ */
const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[Home]', ...args);
const info = (...args) => console.info('[Home]', ...args);
const warn = (...args) => console.warn('[Home]', ...args);
const err = (...args) => console.error('[Home]', ...args);

export default function Home() {
  dbg('Component render start, href=', window.location.href);

  const navigate = useNavigate();

  const goToMj = () => {
    dbg('navigate("/mj")');
    navigate('/mj');
  };

  const goToCharacter = () => {
    if (characters[0]) {
      dbg('navigate("/character/" + characters[0].id)');
      navigate(`/character/${characters[0].id}`);
    }
  };

  const goToCreateCharacter = () => {
    dbg('navigate("/create-character")');
    navigate('/create-character');
  };
  const goToSpells = () => {
    dbg('navigate("/spells")');
    navigate('/spells');
  };
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ is_verified: false, is_mj: false });
  const [characters, setCharacters] = useState([]);

  /* ----------------------------------------------------------------
   * Après avoir récupéré un code OAuth dans l’URL, échangez-le contre
   * une session Supabase (PKCE flow)
   * ---------------------------------------------------------------- */
  async function exchangeCode() {
    // Try to read ?code= from search first
    let params = new URLSearchParams(window.location.search);
    let code = params.get('code');

    // With HashRouter on GitHub Pages, the provider may append the query
    // string after the hash (e.g. https://host/#/?code=XXX). In this case
    // window.location.search is empty, so fallback to parsing location.hash.
    if (!code && window.location.hash.includes('code=')) {
      params = new URLSearchParams(window.location.hash.split('?')[1]);
      code = params.get('code');
    }
    if (!code) {
      dbg('Aucun code dans l’URL');
      return false;
    }

    dbg('Found OAuth code in URL:', code);
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession({ code });
      if (error) {
        err('exchangeCodeForSession error', error);
        return false;
      }
      dbg('Session after exchange:', data.session);

      // Clean URL to remove the auth code so refreshing doesn't retry the exchange
      const url = new URL(window.location.href);
      url.search = '';
      if (url.hash.includes('?')) {
        url.hash = url.hash.split('?')[0];
      }
      window.history.replaceState({}, '', url);

      return true;
    } catch (e) {
      err('exchangeCodeForSession exception', e);
      return false;
    }
  }

  /* ----------------------------------------------------------------
   * Initialisation des données (profile + personnages) pour user authentifié
   * ---------------------------------------------------------------- */
  async function initData(user) {
    dbg('initData start for user', user.id);
    try {
      // Upsert profile (création si nécessaire)
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

      // Récupérer flags (is_verified, is_mj)
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

      // Récupérer personnages existants
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
   * Bouton “Se connecter” déclenche OAuth Discord (PKCE)
   * ---------------------------------------------------------------- */
  const login = async () => {
    dbg('login clicked – href actuelle:', window.location.href);
    info('Starting OAuth signInWithOAuth (code flow PKCE)');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',

        /* – optionnel – vous pouvez forcer un `redirectTo` si nécessaire, 
           mais assurez-vous que “Redirect URLs” est bien configuré
           dans Supabase Dashboard pour https://begliado.github.io/RPG_HP/ */
        options: { redirectTo: 'https://begliado.github.io/RPG_HP/' }  
      });
      if (error) {
        err('signInWithOAuth error', error);
      } else if (data?.url) {
        dbg('Redirecting to OAuth URL:', data.url);
        window.location.replace(data.url);
      } else {
        warn('Aucun URL OAuth retourné');
      }
    } catch (e) {
      err('signInWithOAuth exception', e);
    }
  };

  /* ----------------------------------------------------------------
   * Hook principal pour :
   * 1) si un “code” est présent dans l’URL → appeler `exchangeCodeForSession()`
   * 2) restaurer la session Supabase (si présente)
   * 3) écoute des événements onAuthStateChange
   * ---------------------------------------------------------------- */
  useEffect(() => {
    dbg('useEffect mount – href=', window.location.href);

    (async () => {
      // 1️⃣ Si on a un code dans l’URL, échangez-le d’abord
      const exchanged = await exchangeCode();
      if (exchanged) {
        // Quand exchange réussit, supabase.stocker la session dans localStorage
        dbg('Code échangé avec succès → session stockée');
      }

      // 2️⃣ Récupérer la session stockée (le cas échéant)
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        err('getSession error', error);
      }
      dbg('getSession returned', session);

      if (session?.user) {
        info('Session existante au montage, user:', session.user.id);
        setUser(session.user);
        initData(session.user);
      } else {
        info('Pas de session au montage');
        setUser(null);
        setLoading(false);
      }
    })();

    // 3️⃣ Écouteur onAuthStateChange pour capter les SIGNED_IN / SIGNED_OUT après callback
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      dbg('onAuthStateChange event', event, 'session', session);
      if (session?.user) {
        info('SIGNED_IN event pour', session.user.id);
        setUser(session.user);
        initData(session.user);
      } else {
        info('SIGNED_OUT ou pas de session');
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      dbg('Cleanup auth subscription');
      subscription?.unsubscribe();
    };
  }, []);

  /* ----------------------------------------------------------------
   * Phase de rendu
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
          Se connecter avec Discord

        </button>
      </div>
    );
  }

  dbg('Authenticated UI render, profile=', profile, 'characters=', characters);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-2">
        Bonjour, {user.user_metadata.login || user.email}
      </h1>
      <p>Statut de vérification : {profile.is_verified ? '✅ Vérifié' : '⏳ En attente'}</p>
      <p>Rôle : {profile.is_mj ? 'MJ' : 'Joueur'}</p>

      {profile.is_mj ? (
        <button
          onClick={goToMj}
          className="mt-4 px-4 py-2 bg-green-600 rounded"
        >
          Tableau de bord MJ
        </button>
      ) : characters.length > 0 ? (
        <button
          onClick={goToCharacter}
          className="mt-4 px-4 py-2 bg-blue-600 rounded"
        >
          Accéder à mon personnage ({characters[0].name})
        </button>
      ) : profile.is_verified ? (
        <button
          onClick={goToCreateCharacter}
          className="mt-4 px-4 py-2 bg-yellow-600 rounded"
        >
          Créer mon personnage
        </button>
      ) : (
        <p className="mt-4">Votre compte est en attente de validation par le MJ.</p>
      )}
      <button onClick={goToSpells} className="mt-4 px-4 py-2 bg-purple-600 rounded">
        Liste des sorts
      </button>
    </div>
  );
}