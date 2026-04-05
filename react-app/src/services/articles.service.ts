/**
 * articles.service.ts
 *
 * Mirrors Angular's ArticlesService HTTP calls.
 *
 * Endpoints:
 *   GET    /articles               — list articles (supports filters)
 *   GET    /articles/feed          — personal feed (auth required)
 *   GET    /articles/:slug         — single article
 *   POST   /articles               — create article
 *   PUT    /articles/:slug         — update article
 *   DELETE /articles/:slug         — delete article
 *   POST   /articles/:slug/favorite   — favorite
 *   DELETE /articles/:slug/favorite   — unfavorite
 */
import client from '../api/client';
import type { Article } from '../types/article';

export interface ArticleFilters {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}

export interface ArticlesResponse {
  articles: Article[];
  articlesCount: number;
}

export async function getArticles(filters: ArticleFilters = {}): Promise<ArticlesResponse> {
  const { data } = await client.get<ArticlesResponse>('/articles', { params: filters });
  return data;
}

export async function getFeedArticles(
  filters: Pick<ArticleFilters, 'limit' | 'offset'> = {},
): Promise<ArticlesResponse> {
  const { data } = await client.get<ArticlesResponse>('/articles/feed', { params: filters });
  return data;
}

export async function getArticle(slug: string): Promise<Article> {
  const { data } = await client.get<{ article: Article }>(`/articles/${slug}`);
  return data.article;
}

export async function createArticle(
  article: Pick<Article, 'title' | 'description' | 'body' | 'tagList'>,
): Promise<Article> {
  const { data } = await client.post<{ article: Article }>('/articles', { article });
  return data.article;
}

export async function updateArticle(
  slug: string,
  article: Partial<Pick<Article, 'title' | 'description' | 'body' | 'tagList'>>,
): Promise<Article> {
  const { data } = await client.put<{ article: Article }>(`/articles/${slug}`, { article });
  return data.article;
}

export async function deleteArticle(slug: string): Promise<void> {
  await client.delete(`/articles/${slug}`);
}

export async function favoriteArticle(slug: string): Promise<Article> {
  const { data } = await client.post<{ article: Article }>(`/articles/${slug}/favorite`);
  return data.article;
}

export async function unfavoriteArticle(slug: string): Promise<Article> {
  const { data } = await client.delete<{ article: Article }>(`/articles/${slug}/favorite`);
  return data.article;
}
