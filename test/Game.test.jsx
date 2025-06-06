import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import Game from '../src/pages/Game.jsx';
import { supabase } from '../src/supabaseClient';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
}));

describe('Game page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to create character when none exists', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    });

    render(
      <MemoryRouter initialEntries={['/game']}>
        <Routes>
          <Route path="/" element={<p>HOME</p>} />
          <Route path="/create-character" element={<p>CREATE</p>} />
          <Route path="/game" element={<Game />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('CREATE')).toBeInTheDocument();
  });

  it('shows game when character exists', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    });

    render(
      <MemoryRouter initialEntries={['/game']}>
        <Routes>
          <Route path="/game" element={<Game />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Bienvenue dans le jeu')).toBeInTheDocument();
  });
});
