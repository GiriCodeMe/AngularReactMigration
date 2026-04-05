import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import * as authService from '../services/auth.service';

vi.mock('../services/auth.service');

function AuthStatusDisplay() {
  const { status, user } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.username ?? 'none'}</span>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AuthStatusDisplay />
      </AuthProvider>
    </BrowserRouter>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it('starts as unauthenticated with no stored token', async () => {
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    });
  });

  it('resolves to authenticated when stored token is valid', async () => {
    localStorage.setItem('jwtToken', 'valid-token');
    vi.mocked(authService.getCurrentUser).mockResolvedValueOnce({
      email: 'test@test.com',
      token: 'valid-token',
      username: 'testuser',
      bio: '',
      image: '',
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated');
      expect(screen.getByTestId('user').textContent).toBe('testuser');
    });
  });

  it('clears auth on 401 from getCurrentUser', async () => {
    localStorage.setItem('jwtToken', 'expired-token');
    vi.mocked(authService.getCurrentUser).mockRejectedValueOnce({
      response: { status: 401 },
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    });
    expect(localStorage.getItem('jwtToken')).toBeNull();
  });
});
