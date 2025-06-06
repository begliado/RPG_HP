import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import MJ from '../src/pages/MJ.jsx';
import { supabase } from '../src/supabaseClient';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
}));

describe('MJ page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects non-MJ users to home', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });
    supabase.from.mockImplementation((table) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(
        table === 'profiles' ? { data: { is_mj: false } } : { data: [] }
      ),
      order: vi.fn().mockResolvedValue({ data: [] }),
    }));

    render(
      <MemoryRouter initialEntries={['/mj']}>
        <Routes>
          <Route path="/" element={<p>HOME</p>} />
          <Route path="/mj" element={<MJ />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('HOME')).toBeInTheDocument();
  });

  it('shows dashboard for MJ users', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });
    supabase.from.mockImplementation((table) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(
        table === 'profiles' ? { data: { is_mj: true } } : { data: [] }
      ),
      order: vi.fn().mockResolvedValue({ data: [] }),
    }));

    render(
      <MemoryRouter initialEntries={['/mj']}>
        <Routes>
          <Route path="/mj" element={<MJ />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Tableau de bord MJ')).toBeInTheDocument();
  });
});
