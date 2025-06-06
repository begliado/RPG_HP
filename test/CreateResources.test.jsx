import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import CreateResources from '../src/pages/CreateResources.jsx';
import { supabase } from '../src/supabaseClient';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
}));

describe('CreateResources page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when user is MJ', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });
    supabase.from.mockImplementation((table) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(
        table === 'profiles' ? { data: { is_mj: true } } : { data: [] }
      ),
      order: vi.fn().mockResolvedValue({ data: [] }),
      insert: vi.fn().mockResolvedValue({}),
    }));

    render(
      <MemoryRouter initialEntries={['/create-resources']}>
        <Routes>
          <Route path="/create-resources" element={<CreateResources />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Gestion des ressources')).toBeInTheDocument();
  });
});
