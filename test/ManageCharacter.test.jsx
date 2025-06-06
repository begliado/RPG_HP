import { render, screen } from '@testing-library/react';
import ManageCharacter from '../src/pages/ManageCharacter.jsx';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';

const character = { id: 1, nom: 'Harry' };

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: '1' } } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: character })
    }))
  }
}));

describe('ManageCharacter', () => {
  it('renders character name after load', async () => {
    render(
      <MemoryRouter>
        <ManageCharacter />
      </MemoryRouter>
    );
    expect(await screen.findByText('Gestion du personnage')).toBeInTheDocument();
    expect(screen.getByText('Harry')).toBeInTheDocument();
  });

  it('redirects to create page when no character', async () => {
    const mod = await import('../src/supabaseClient');
    mod.supabase.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null })
    }));

    render(
      <MemoryRouter initialEntries={['/manage-character']}> 
        <Routes>
          <Route path="/manage-character" element={<ManageCharacter />} />
          <Route path="/create-character" element={<p>Create</p>} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText('Create')).toBeInTheDocument();
  });
});
