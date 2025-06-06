import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import CharacterPage from '../src/pages/Character.jsx';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: '1' } } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: '1',
          user_id: '1',
          nom: 'Harry',
          esprit: 5,
          coeur: 5,
          corps: 5,
          magie: 5,
          dortoir: 'fille',
          maison: 'gryffondor',
          ascendance: 'n/a',
          annee: 1,
        },
      }),
    })),
  },
}));

describe('CharacterPage', () => {
  it('displays character data and skills', async () => {
    render(
      <MemoryRouter initialEntries={['/character/1']}>
        <Routes>
          <Route path="/character/:id" element={<CharacterPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText('Harry')).toBeInTheDocument();
    expect(screen.getByText('Bluff : 5')).toBeInTheDocument();
  });
});
