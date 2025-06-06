import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import Spells from '../src/pages/Spells.jsx';
import { supabase } from '../src/supabaseClient';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
}));

describe('Spells page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows list of spells', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });
    supabase.from.mockImplementation(() => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [
          { id: 1, name: 'Accio', description: 'Call object', level: 1, school: 'Charms' }
        ] }),
      };
      return chain;
    });
    render(
      <MemoryRouter initialEntries={['/spells']}>
        <Routes>
          <Route path="/spells" element={<Spells />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText('Accio')).toBeInTheDocument();
  });
});
