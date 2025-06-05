// src/App.jsx

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import MJPage from './pages/MJ';
import GamePage from './pages/Game';
import CharacterPage from './pages/Character';
import CreateCharacter from './pages/CreateCharacter';
import CreateResources from './pages/CreateResources';
import Spells from './pages/Spells';


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mj" element={<MJPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/character/:id" element={<CharacterPage />} />
        <Route path="/create-character" element={<CreateCharacter />} />
        <Route path="/spells" element={<Spells />} />
        <Route path="/create-resources" element={<CreateResources />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
