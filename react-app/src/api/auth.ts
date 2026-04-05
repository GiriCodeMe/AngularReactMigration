import client from './client';
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

export async function updateUser(user: Partial<Omit<User, 'token'>> & { password?: string }): Promise<User> {
  const { data } = await client.put<{ user: User }>('/user', { user });
  return data.user;
}
