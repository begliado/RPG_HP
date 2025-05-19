// src/pages/Game.jsx

import React from 'react';
import { Link } from 'react-router-dom';

export default function GamePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Salon de jeu</h1>
      <ul className="list-disc list-inside mt-2">
        <li>
          <Link to="/character/test-student" className="text-blue-600 underline">
            Voir mon personnage test
          </Link>
        </li>
        <li>
          <Link to="/mj" className="text-blue-600 underline">
            Dashboard MJ
          </Link>
        </li>
      </ul>
    </div>
  );
}
