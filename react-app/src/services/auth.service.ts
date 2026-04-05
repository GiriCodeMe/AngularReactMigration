/**
 * auth.service.ts
 *
 * Mirrors Angular's UserService HTTP calls — pure async functions,
 * no framework dependency. State management lives in AuthContext.tsx.
 *
 * Endpoints (base URL handled by Axios client):
 *   POST /users/login      — login with email + password
 *   POST /users            — register new account
 *   GET  /user             — get current authenticated user
 *   PUT  /user             — update current user
 */
import client from '../api/client';
import type { User } from '../types/user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export type UpdateUserPayload = Partial<Omit<User, 'token'>> & { password?: string };

export async function login(credentials: LoginCredentials): Promise<User> {
  const { data } = await client.post<{ user: User }>('/users/login', { user: credentials });
  return data.user;
}

export async function register(credentials: RegisterCredentials): Promise<User> {
  const { data } = await client.post<{ user: User }>('/users', { user: credentials });
  return data.user;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await client.get<{ user: User }>('/user');
  return data.user;
}

export async function updateUser(payload: UpdateUserPayload): Promise<User> {
  const { data } = await client.put<{ user: User }>('/user', { user: payload });
  return data.user;
}
