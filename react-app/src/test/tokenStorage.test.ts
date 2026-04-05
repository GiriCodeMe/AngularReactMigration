import { describe, it, expect, beforeEach } from 'vitest';
import { getToken, saveToken, destroyToken } from '../utils/tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('saves and retrieves a token', () => {
    saveToken('my-jwt');
    expect(getToken()).toBe('my-jwt');
  });

  it('destroys the stored token', () => {
    saveToken('my-jwt');
    destroyToken();
    expect(getToken()).toBeNull();
  });

  it('overwrites an existing token on save', () => {
    saveToken('first');
    saveToken('second');
    expect(getToken()).toBe('second');
  });
});
