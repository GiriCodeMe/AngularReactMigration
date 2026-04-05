/**
 * comments.service.ts
 *
 * Mirrors Angular's ArticlesService comment-related HTTP calls.
 *
 * Endpoints:
 *   GET    /articles/:slug/comments   — list comments
 *   POST   /articles/:slug/comments   — add comment
 *   DELETE /articles/:slug/comments/:id — delete comment
 */
import client from '../api/client';
import type { Comment } from '../types/article';

export async function getComments(slug: string): Promise<Comment[]> {
  const { data } = await client.get<{ comments: Comment[] }>(`/articles/${slug}/comments`);
  return data.comments;
}

export async function addComment(slug: string, body: string): Promise<Comment> {
  const { data } = await client.post<{ comment: Comment }>(`/articles/${slug}/comments`, {
    comment: { body },
  });
  return data.comment;
}

export async function deleteComment(slug: string, commentId: number): Promise<void> {
  await client.delete(`/articles/${slug}/comments/${commentId}`);
}
