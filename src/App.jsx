import React from 'react';
import Home from './pages/Home';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* tes autres routes (MJ, game, character) */}
      </Routes>
    </Router>
  );
}
