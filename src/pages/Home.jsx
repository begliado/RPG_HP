// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...a) => DEBUG && console.debug('[Home]', ...a);

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  /* -------------------------------------------------- */
  /*  Redirige selon rôle / persos                      */
  /* -------------------------------------------------- */
  async function handleUser(u) {
    dbg('handleUser', u.id);

    await supabase
      .from('profiles')
      .upsert({ id: u.id, username: u.user_metadata.login || u.email }, { onConflict: 'id' });

    const { data: p } = await supabase
      .from('profiles')
      .select('is_verified,is_mj')
      .eq('id', u.id)
      .single();

    if (p.is_mj) {
      dbg('→ MJ');
      navigate('/mj', { replace: true });
      return;
    }

    const { data: chars } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', u.id);

    if (chars.length) {
      dbg('→ character', chars[0].id);
      navigate(`/character/${chars[0].id}`, { replace: true });
    } else if (p.is_verified) {
      dbg('→ create-character');
      navigate('/create-character', { replace: true });
    } else {
      dbg('→ MJ (en attente vérif)');
      navigate('/mj', { replace: true });
    }
  }

  /* -------------------------------------------------- */
  /*  useEffect : gère le fragment / query OAuth        */
  /* -------------------------------------------------- */
  useEffect(() => {
    (async () => {
      const fullURL = new URL(window.location.href);

      /* --- 1. code flow (query   OU   fragment) ------- */
      let code = fullURL.searchParams.get('code');
      if (!code && window.location.hash.includes('code=')) {
        const frag = window.location.hash.slice(1).replace(/^\\/?/, ''); // enlève #/ ou #
        code = new URLSearchParams(frag).get('code');
      }
      if (code) {
        dbg('Code flow : exchangeCodeForSession');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) dbg('exchangeCodeForSession error', error.message);
        window.history.replaceState({}, '', fullURL.pathname + '#/');
      }

      /* --- 2. implicit flow (#access_token…) --------- */
      const h = window.location.hash;
      if (h.includes('access_token=')) {
        const clean = h.startsWith('#/') ? h.slice(2) : h.slice(1);
        const params = new URLSearchParams(clean);
        const at = params.get('access_token');
        const rt = params.get('refresh_token');
        if (at && rt) {
          dbg('Implicit flow : setSession');
          const { error } = await supabase.auth.setSession(at, rt);
          if (error) dbg('setSession error', error.message);
          window.location.replace(fullURL.pathname + '#/');
          return; // re‐chargement
        }
      }

      /* --- 3. listener + session existante ----------- */
      const { data: { subscription } } =
        supabase.auth.onAuthStateChange((_e, sess) => {
          dbg('Auth event', _e);
          if (sess?.user) handleUser(sess.user);
          else setLoading(false);
        });

      const { data: { session } } = await supabase.auth.getSession();
      dbg('Initial session', session);
      if (session?.user) handleUser(session.user);
      else setLoading(false);

      return () => subscription.unsubscribe();
    })();
  }, [navigate]);

  /* -------------------------------------------------- */
  /*  Login                                             */
  /* -------------------------------------------------- */
  const login = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://begliado.github.io/RPG_HP/' },
    });

  /* -------------------------------------------------- */
  /*  UI                                                */
  /* -------------------------------------------------- */
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
