// src/App.jsx

import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Home from './pages/Home';
import MJPage from './pages/MJ';
import GamePage from './pages/Game';
import CharacterPage from './pages/Character';

export default function App() {
  return (
    <Router basename="/RPG_HP/">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mj" element={<MJPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/character/:id" element={<CharacterPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
