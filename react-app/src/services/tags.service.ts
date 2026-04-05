/**
 * tags.service.ts
 *
 * Mirrors Angular's TagsService.
 *
 * Endpoints:
 *   GET /tags — returns popular tags list
 */
import client from '../api/client';

export async function getTags(): Promise<string[]> {
  const { data } = await client.get<{ tags: string[] }>('/tags');
  return data.tags;
}
