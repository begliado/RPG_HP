// src/pages/CreateResources.jsx
// TODO: future page for NPC management and player edits
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const DEBUG = import.meta.env.VITE_DEBUG === 'true';
const dbg = (...args) => DEBUG && console.debug('[CreateResources]', ...args);
const info = (...args) => console.info('[CreateResources]', ...args);
const warn = (...args) => console.warn('[CreateResources]', ...args);
const err = (...args) => console.error('[CreateResources]', ...args);

export default function CreateResources() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [spellName, setSpellName] = useState('');
  const [spellDesc, setSpellDesc] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');

  useEffect(() => {
    dbg('Checking session for CreateResources page');
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        info('Pas de session, redirection /');
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
            dbg('Accès MJ autorisé pour ressources');
            setLoading(false);
          }
        })
        .catch((e) => {
          err('Erreur fetch profil', e);
          navigate('/', { replace: true });
        });
    });
  }, [navigate]);

  const createSpell = async (e) => {
    e.preventDefault();
    info('Création sort', spellName);
    const { error } = await supabase
      .from('spells')
      .insert({ name: spellName, description: spellDesc });
    if (error) {
      err('insert spell', error);
    } else {
      setSpellName('');
      setSpellDesc('');
    }
  };

  const createBook = async (e) => {
    e.preventDefault();
    info('Création livre', bookTitle);
    const { error } = await supabase
      .from('books')
      .insert({ title: bookTitle, author: bookAuthor });
    if (error) {
      err('insert book', error);
    } else {
      setBookTitle('');
      setBookAuthor('');
    }
  };

  if (loading) {
    return <p>Chargement...</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestion des ressources</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Créer un sort</h2>
        <form onSubmit={createSpell} className="space-y-2">
          <input
            className="w-full p-2 rounded bg-gray-800"
            value={spellName}
            onChange={(e) => setSpellName(e.target.value)}
            placeholder="Nom du sort"
          />
          <textarea
            className="w-full p-2 rounded bg-gray-800"
            value={spellDesc}
            onChange={(e) => setSpellDesc(e.target.value)}
            placeholder="Description"
          />
          <button className="px-4 py-2 bg-green-600 rounded" type="submit">
            Sauvegarder le sort
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Créer un livre</h2>
        <form onSubmit={createBook} className="space-y-2">
          <input
            className="w-full p-2 rounded bg-gray-800"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder="Titre du livre"
          />
          <input
            className="w-full p-2 rounded bg-gray-800"
            value={bookAuthor}
            onChange={(e) => setBookAuthor(e.target.value)}
            placeholder="Auteur"
          />
          <button className="px-4 py-2 bg-green-600 rounded" type="submit">
            Sauvegarder le livre
          </button>
        </form>
      </section>
    </div>
  );
}
