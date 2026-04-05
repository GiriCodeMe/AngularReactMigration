import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useAuth } from '../contexts/AuthContext';
import {
  getArticle,
  deleteArticle,
  favoriteArticle,
  unfavoriteArticle,
} from '../services/articles.service';
import { getComments, addComment, deleteComment } from '../services/comments.service';
import { followUser, unfollowUser } from '../services/profile.service';
import type { Article, Comment } from '../types/article';

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, status } = useAuth();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = status === 'authenticated';
  const isOwner = isAuthenticated && article?.author.username === user?.username;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([getArticle(slug), getComments(slug)])
      .then(([art, cmts]) => {
        setArticle(art);
        setComments(cmts);
      })
      .catch(() => setError('Article not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleFavorite() {
    if (!article) return;
    const updated = article.favorited
      ? await unfavoriteArticle(article.slug)
      : await favoriteArticle(article.slug);
    setArticle(updated);
  }

  async function handleFollow() {
    if (!article) return;
    const profile = article.author.following
      ? await unfollowUser(article.author.username)
      : await followUser(article.author.username);
    setArticle({ ...article, author: profile });
  }

  async function handleDelete() {
    if (!article) return;
    await deleteArticle(article.slug);
    navigate('/');
  }

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    if (!slug || !commentBody.trim()) return;
    const comment = await addComment(slug, commentBody);
    setComments([comment, ...comments]);
    setCommentBody('');
  }

  async function handleDeleteComment(commentId: number) {
    if (!slug) return;
    await deleteComment(slug, commentId);
    setComments(comments.filter((c) => c.id !== commentId));
  }

  if (loading) return null;
  if (error || !article) return <div className="container page"><p>{error}</p></div>;

  const bodyHtml = DOMPurify.sanitize(marked.parse(article.body) as string);

  return (
    <div className="article-page">
      <div className="banner">
        <div className="container">
          <h1>{article.title}</h1>
          <ArticleMeta
            article={article}
            isOwner={isOwner}
            isAuthenticated={isAuthenticated}
            onFavorite={handleFavorite}
            onFollow={handleFollow}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <div className="container page">
        <div className="row article-content">
          <div className="col-md-12">
            <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            <ul className="tag-list">
              {article.tagList.map((tag) => (
                <li key={tag} className="tag-default tag-pill tag-outline">
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr />

        <div className="article-actions">
          <ArticleMeta
            article={article}
            isOwner={isOwner}
            isAuthenticated={isAuthenticated}
            onFavorite={handleFavorite}
            onFollow={handleFollow}
            onDelete={handleDelete}
          />
        </div>

        <div className="row">
          <div className="col-xs-12 col-md-8 offset-md-2">
            {isAuthenticated ? (
              <form className="card comment-form" onSubmit={handleAddComment}>
                <div className="card-block">
                  <textarea
                    className="form-control"
                    placeholder="Write a comment..."
                    rows={3}
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                  />
                </div>
                <div className="card-footer">
                  {user?.image && (
                    <img src={user.image} className="comment-author-img" alt={user.username} />
                  )}
                  <button className="btn btn-sm btn-primary" type="submit">
                    Post Comment
                  </button>
                </div>
              </form>
            ) : (
              <p>
                <Link to="/login">Sign in</Link> or <Link to="/register">sign up</Link> to add
                comments on this article.
              </p>
            )}

            {comments.map((comment) => (
              <div key={comment.id} className="card">
                <div className="card-block">
                  <p className="card-text">{comment.body}</p>
                </div>
                <div className="card-footer">
                  <Link
                    to={`/profile/${comment.author.username}`}
                    className="comment-author"
                  >
                    {comment.author.image && (
                      <img
                        src={comment.author.image}
                        className="comment-author-img"
                        alt={comment.author.username}
                      />
                    )}
                    &nbsp;{comment.author.username}
                  </Link>
                  <span className="date-posted">
                    {new Date(comment.createdAt).toDateString()}
                  </span>
                  {isAuthenticated && user?.username === comment.author.username && (
                    <span className="mod-options">
                      <i
                        className="ion-trash-a"
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetaProps {
  article: Article;
  isOwner: boolean;
  isAuthenticated: boolean;
  onFavorite: () => void;
  onFollow: () => void;
  onDelete: () => void;
}

function ArticleMeta({ article, isOwner, isAuthenticated, onFavorite, onFollow, onDelete }: MetaProps) {
  return (
    <div className="article-meta">
      <Link to={`/profile/${article.author.username}`}>
        {article.author.image && (
          <img src={article.author.image} alt={article.author.username} />
        )}
      </Link>
      <div className="info">
        <Link to={`/profile/${article.author.username}`} className="author">
          {article.author.username}
        </Link>
        <span className="date">{new Date(article.createdAt).toDateString()}</span>
      </div>

      {isOwner ? (
        <>
          <Link to={`/editor/${article.slug}`} className="btn btn-outline-secondary btn-sm">
            <i className="ion-edit" /> Edit Article
          </Link>
          &nbsp;
          <button className="btn btn-outline-danger btn-sm" onClick={onDelete}>
            <i className="ion-trash-a" /> Delete Article
          </button>
        </>
      ) : (
        <>
          {isAuthenticated && (
            <button
              className={`btn btn-sm ${article.author.following ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={onFollow}
            >
              <i className="ion-plus-round" />
              &nbsp;{article.author.following ? 'Unfollow' : 'Follow'} {article.author.username}
            </button>
          )}
          &nbsp;
          <button
            className={`btn btn-sm ${article.favorited ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={onFavorite}
          >
            <i className="ion-heart" />
            &nbsp;{article.favorited ? 'Unfavorite' : 'Favorite'} Article
            <span className="counter">({article.favoritesCount})</span>
          </button>
        </>
      )}
    </div>
  );
}
