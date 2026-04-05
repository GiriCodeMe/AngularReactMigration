const TOKEN_KEY = 'jwtToken';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function destroyToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
