import { useState, useEffect } from 'react';
import { useParams, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, followUser, unfollowUser } from '../services/profile.service';
import { getArticles } from '../services/articles.service';
import { favoriteArticle, unfavoriteArticle } from '../services/articles.service';
import type { Profile } from '../types/profile';
import type { Article } from '../types/article';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, status } = useAuth();
  const isAuthenticated = status === 'authenticated';
  const isOwn = isAuthenticated && user?.username === username;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [tab, setTab] = useState<'authored' | 'favorited'>('authored');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getProfile(username).then(setProfile).catch(() => setProfile(null));
  }, [username]);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    const filters =
      tab === 'authored' ? { author: username } : { favorited: username };
    getArticles(filters)
      .then((res) => setArticles(res.articles))
      .finally(() => setLoading(false));
  }, [username, tab]);

  async function handleFollow() {
    if (!profile) return;
    const updated = profile.following
      ? await unfollowUser(profile.username)
      : await followUser(profile.username);
    setProfile(updated);
  }

  async function handleFavorite(article: Article) {
    const updated = article.favorited
      ? await unfavoriteArticle(article.slug)
      : await favoriteArticle(article.slug);
    setArticles(articles.map((a) => (a.slug === updated.slug ? updated : a)));
  }

  if (!profile) return null;

  return (
    <div className="profile-page">
      <div className="user-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              {profile.image && (
                <img src={profile.image} className="user-img" alt={profile.username} />
              )}
              <h4>{profile.username}</h4>
              {profile.bio && <p>{profile.bio}</p>}

              {isOwn ? (
                <Link to="/settings" className="btn btn-sm btn-outline-secondary action-btn">
                  <i className="ion-gear-a" /> Edit Profile Settings
                </Link>
              ) : isAuthenticated ? (
                <button
                  className={`btn btn-sm action-btn ${
                    profile.following ? 'btn-secondary' : 'btn-outline-secondary'
                  }`}
                  onClick={handleFollow}
                >
                  <i className="ion-plus-round" />
                  &nbsp;{profile.following ? 'Unfollow' : 'Follow'} {profile.username}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-10 offset-md-1">
            <div className="articles-toggle">
              <ul className="nav nav-pills outline-active">
                <li className="nav-item">
                  <button
                    className={`nav-link ${tab === 'authored' ? 'active' : ''}`}
                    onClick={() => setTab('authored')}
                  >
                    My Articles
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${tab === 'favorited' ? 'active' : ''}`}
                    onClick={() => setTab('favorited')}
                  >
                    Favorited Articles
                  </button>
                </li>
              </ul>
            </div>

            {loading ? (
              <div className="article-preview">Loading articles...</div>
            ) : articles.length === 0 ? (
              <div className="article-preview">No articles here... yet.</div>
            ) : (
              articles.map((article) => (
                <div className="article-preview" key={article.slug}>
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
                      <span className="date">
                        {new Date(article.createdAt).toDateString()}
                      </span>
                    </div>
                    <button
                      className={`btn btn-outline-primary btn-sm pull-xs-right ${
                        article.favorited ? 'active' : ''
                      }`}
                      onClick={() => handleFavorite(article)}
                    >
                      <i className="ion-heart" /> {article.favoritesCount}
                    </button>
                  </div>
                  <Link to={`/article/${article.slug}`} className="preview-link">
                    <h1>{article.title}</h1>
                    <p>{article.description}</p>
                    <span>Read more...</span>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
