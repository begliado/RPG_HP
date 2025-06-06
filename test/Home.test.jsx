import { render, screen } from '@testing-library/react';
import Home from '../src/pages/Home';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithOAuth: vi.fn()
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ data: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null })
    }))
  }
}));

describe('Home', () => {
  it('shows login when not authenticated', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(await screen.findByText('Se connecter avec Discord')).toBeInTheDocument();
  });

  it('shows dashboard when user session exists', async () => {
    const user = { id: '1', user_metadata: { login: 'testuser' }, email: 'test@example.com' };
    const getSession = vi.fn().mockResolvedValue({ data: { session: { user } } });
    const mod = await import('../src/supabaseClient');
    mod.supabase.auth.getSession = getSession;
    mod.supabase.from = vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ data: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { is_verified: true, is_mj: false } }),
    }));
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Bonjour/)).toBeInTheDocument();
  });

  it('shows MJ dashboard link when user is MJ', async () => {
    const user = { id: '2', user_metadata: { login: 'mj' }, email: 'mj@example.com' };
    const mod = await import('../src/supabaseClient');
    mod.supabase.auth.getSession = vi.fn().mockResolvedValue({ data: { session: { user } } });
    mod.supabase.from = vi.fn((table) => ({
      upsert: vi.fn().mockResolvedValue({ data: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(
        table === 'profiles'
          ? { data: { is_verified: true, is_mj: true } }
          : { data: [] }
      )
    }));
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(await screen.findByText('Tableau de bord MJ')).toBeInTheDocument();
  });

  it('prompts to create character when verified user has none', async () => {
    const user = { id: '3', user_metadata: { login: 'newuser' }, email: 'n@example.com' };
    const mod = await import('../src/supabaseClient');
    mod.supabase.auth.getSession = vi.fn().mockResolvedValue({ data: { session: { user } } });
    mod.supabase.from = vi.fn((table) => ({
      upsert: vi.fn().mockResolvedValue({ data: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(
        table === 'profiles'
          ? { data: { is_verified: true, is_mj: false } }
          : { data: [] }
      )
    }));
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(await screen.findByText('Créer mon personnage')).toBeInTheDocument();
  });
});
