import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import CreateCharacter from '../src/pages/CreateCharacter.jsx';
import { supabase } from '../src/supabaseClient';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
}));

describe('CreateCharacter page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to manage page when character already exists', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });
    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    }));

    render(
      <MemoryRouter initialEntries={['/create-character']}>
        <Routes>
          <Route path="/create-character" element={<CreateCharacter />} />
          <Route path="/manage-character" element={<p>Manage</p>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Manage')).toBeInTheDocument();
  });
});
