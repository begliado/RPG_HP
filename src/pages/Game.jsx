// src/pages/Game.jsx

import React from 'react';

export default function GamePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Salon de jeu</h1>
      <p>Bienvenue dans le lobby de jeu ! Choisissez une option :</p>
      <ul className="list-disc list-inside mt-2">
        <li>
          <a href="/character/test-student" className="text-blue-600 underline">
            Voir mon personnage test
          </a>
        </li>
        <li>
          <a href="/mj" className="text-blue-600 underline">
            Dashboard MJ
          </a>
        </li>
      </ul>
    </div>
  );
}
