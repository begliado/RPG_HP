// src/pages/Home.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ is_verified: false, is_mj: false });
  const [debugLogs, setDebugLogs] = useState([]);

  // Ajoute un log en mémoire + console
  function logDebug(msg) {
    console.debug('[Home Debug]', msg);
    setDebugLogs((logs) => [...logs, msg]);
  }

  async function ensureProfile(u) {
    logDebug(`ensureProfile for ${u.id}`);
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', u.id)
      .single();
    if (error && error.code !== 'PGRST116') {
      logDebug(`❌ select profile error: ${error.message}`);
      return;
    }
    if (!data) {
      logDebug(`→ inserting new profile for ${u.id}`);
      const { data: ins, error: insErr } = await supabase
        .from('profiles')
        .insert({ id: u.id, username: u.user_metadata.login || u.email });
      if (insErr) {
        logDebug(`❌ insert profile error: ${insErr.message}`);
      } else {
        logDebug(`✅ profile created: ${JSON.stringify(ins)}`);
      }
    } else {
      logDebug('→ profile already exists');
    }
  }

  useEffect(() => {
    let subscription;
    (async () => {
      logDebug('🔄 initializing session');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) logDebug(`❌ getSession error: ${error.message}`);
        logDebug(`session: ${session?.user?.id || 'none'}`);
        const u = session?.user;
        if (u) {
          setUser(u);
          await ensureProfile(u);
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('is_verified, is_mj')
            .eq('id', u.id)
            .single();
          if (profErr) {
            logDebug(`❌ select is_verified error: ${profErr.message}`);
          } else {
            setProfile({ is_verified: prof.is_verified, is_mj: prof.is_mj });
            logDebug(`profile flags: verified=${prof.is_verified}, mj=${prof.is_mj}`);
          }
        }
      } catch (err) {
        logDebug(`❌ unexpected init error: ${err}`);
      } finally {
        setLoading(false);
      }

      subscription = supabase.auth.onAuthStateChange(async (_e, sess) => {
        logDebug(`🛰 onAuthStateChange event: ${_e}`);
        const u2 = sess?.user;
        setUser(u2 || null);
        if (u2) await ensureProfile(u2);
        setLoading(false);
      }).subscription;
    })();

    return () => {
      if (subscription) supabase.auth.removeSubscription(subscription);
    };
  }, []);

  const handleLogin = async () => {
    logDebug('🔐 signInWithOAuth start');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
    if (error) {
      logDebug(`❌ signIn error: ${error.message}`);
    }
  };

  if (loading) return <p>Chargement…</p>;
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">Bienvenue à Poudlard</h1>
        <button
          onClick={handleLogin}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Se connecter avec GitHub
        </button>
        <pre className="mt-4 p-2 bg-gray-100 text-xs overflow-auto">
          {debugLogs.join('\n')}
        </pre>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">
        Bonjour, {user.user_metadata.login || user.email}
      </h1>
      <p>
        Statut de vérification :{' '}
        {profile.is_verified ? (
          <span className="text-green-600 font-semibold">OK</span>
        ) : (
          <span className="text-yellow-600 font-semibold">
            En attente de vérif
          </span>
        )}
      </p>
      <pre className="mt-4 p-2 bg-gray-100 text-xs overflow-auto">
        {debugLogs.join('\n')}
      </pre>
    </div>
  );
}
