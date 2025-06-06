// src/pages/CreateCharacter.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import HouseWheel from '../components/HouseWheel';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[CreateCharacter]', ...args);
const info = (...args) => console.info('[CreateCharacter]', ...args);
const err = (...args) => console.error('[CreateCharacter]', ...args);

export default function CreateCharacter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  const [nom, setNom] = useState('');
  const [dortoir, setDortoir] = useState('fille');
  const [maison, setMaison] = useState('');
  const [ascendance, setAscendance] = useState('');
  const [annee, setAnnee] = useState(1);
  const [background, setBackground] = useState('');
  const [esprit, setEsprit] = useState(5);
  const [coeur, setCoeur] = useState(5);
  const [corps, setCorps] = useState(5);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    dbg('Checking session for CreateCharacter page');
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        info('Pas de session, redirection /');
        navigate('/', { replace: true });
        return;
      }
      setSession(session);

      // Vérifier qu'aucun personnage n'existe déjà
      supabase
        .from('characters')
        .select('id')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            info('Personnage déjà créé, redirection manage-character');
            navigate('/manage-character', { replace: true });
          } else {
            dbg('Pas de personnage existant');
            setLoading(false);
          }
        })
        .catch((e) => {
          err('Erreur vérification personnage', e);
          setLoading(false);
        });
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    const magie = Math.round((Number(esprit) + Number(coeur) + Number(corps)) / 3);
    const { data, error } = await supabase
      .from('characters')
      .insert({
        user_id: session.user.id,
        nom,
        dortoir,
        maison,
        ascendance,
        annee: Number(annee),
        background,
        esprit: Number(esprit),
        coeur: Number(coeur),
        corps: Number(corps),
        magie,
      })
      .select()
      .single();

    if (error || !data) {
      err('Erreur insert personnage', error);
      setErrorMsg('Erreur lors de la création du personnage');
      setSaving(false);
    } else {
      navigate(`/character/${data.id}`);
    }
  };

  if (loading) {
    return <p>Chargement…</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Créer un personnage</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <input
          className="w-full p-2 rounded bg-gray-800"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom complet"
          required
        />
        <select
          className="w-full p-2 rounded bg-gray-800"
          value={dortoir}
          onChange={(e) => setDortoir(e.target.value)}
        >
          <option value="fille">Dortoir des filles</option>
          <option value="garçon">Dortoir des garçons</option>
        </select>
        <div className="text-center">
          <HouseWheel value={maison} onChange={setMaison} />
          {maison && <p className="mt-2 capitalize">Maison : {maison}</p>}
        </div>
        <input
          className="w-full p-2 rounded bg-gray-800"
          value={ascendance}
          onChange={(e) => setAscendance(e.target.value)}
          placeholder="Ascendance (facultatif)"
        />
        <input
          type="number"
          min="1"
          className="w-full p-2 rounded bg-gray-800"
          value={annee}
          onChange={(e) => setAnnee(e.target.value)}
          placeholder="Année"
        />
        <textarea
          className="w-full p-2 rounded bg-gray-800"
          rows="3"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          placeholder="Background (optionnel)"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            className="w-full p-2 rounded bg-gray-800"
            value={esprit}
            onChange={(e) => setEsprit(e.target.value)}
            placeholder="Esprit"
          />
          <input
            type="number"
            className="w-full p-2 rounded bg-gray-800"
            value={coeur}
            onChange={(e) => setCoeur(e.target.value)}
            placeholder="Cœur"
          />
          <input
            type="number"
            className="w-full p-2 rounded bg-gray-800"
            value={corps}
            onChange={(e) => setCorps(e.target.value)}
            placeholder="Corps"
          />
        </div>
        {errorMsg && <p className="text-red-500">{errorMsg}</p>}
        <button
          className="px-4 py-2 bg-green-600 rounded disabled:opacity-50"
          type="submit"
          disabled={saving}
        >
          Créer le personnage
        </button>
      </form>
    </div>
  );
}
