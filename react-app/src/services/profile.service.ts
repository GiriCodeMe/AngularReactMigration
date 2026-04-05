/**
 * profile.service.ts
 *
 * Mirrors Angular's ProfilesService HTTP calls.
 *
 * Endpoints:
 *   GET    /profiles/:username          — get profile
 *   POST   /profiles/:username/follow   — follow user
 *   DELETE /profiles/:username/follow   — unfollow user
 */
import client from '../api/client';
import type { Profile } from '../types/profile';

export async function getProfile(username: string): Promise<Profile> {
  const { data } = await client.get<{ profile: Profile }>(`/profiles/${username}`);
  return data.profile;
}

export async function followUser(username: string): Promise<Profile> {
  const { data } = await client.post<{ profile: Profile }>(`/profiles/${username}/follow`);
  return data.profile;
}

export async function unfollowUser(username: string): Promise<Profile> {
  const { data } = await client.delete<{ profile: Profile }>(`/profiles/${username}/follow`);
  return data.profile;
}
