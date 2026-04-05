import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getArticles,
  getFeedArticles,
  favoriteArticle,
  unfavoriteArticle,
  type ArticleFilters,
} from '../services/articles.service'
import { getTags } from '../services/tags.service'
import type { Article } from '../types/article'

const LIMIT = 10

// ─── Article Preview Card ─────────────────────────────────────────────────────

function ArticlePreview({ article: initial }: { article: Article }) {
  const { isAuthenticated } = useAuth()
  const [article, setArticle] = useState(initial)
  const [toggling, setToggling] = useState(false)

  const date = new Date(article.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  async function handleFavorite() {
    if (!isAuthenticated || toggling) return
    setToggling(true)
    try {
      const updated = article.favorited
        ? await unfavoriteArticle(article.slug)
        : await favoriteArticle(article.slug)
      setArticle(updated)
    } catch {
      // ignore — user sees no change
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="article-preview">
      <div className="article-meta">
        <Link to={`/profile/${article.author.username}`}>
          <img
            src={article.author.image ?? 'https://api.realworld.io/images/smiley-cyrus.jpeg'}
            alt={article.author.username}
          />
        </Link>
        <div className="info">
          <Link to={`/profile/${article.author.username}`} className="author">
            {article.author.username}
          </Link>
          <span className="date">{date}</span>
        </div>
        <button
          className={`btn btn-sm pull-xs-right ${article.favorited ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={handleFavorite}
          disabled={toggling || !isAuthenticated}
        >
          <i className="ion-heart" /> {article.favoritesCount}
        </button>
      </div>

      <Link to={`/article/${article.slug}`} className="preview-link">
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        {article.tagList.length > 0 && (
          <ul className="tag-list">
            {article.tagList.map(tag => (
              <li key={tag} className="tag-default tag-pill tag-outline">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </Link>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number
  total: number
  onChange: (page: number) => void
}) {
  if (total <= 1) return null
  return (
    <nav>
      <ul className="pagination">
        {Array.from({ length: total }, (_, i) => i + 1).map(page => (
          <li key={page} className={`page-item ${current === page ? 'active' : ''}`}>
            <button className="page-link" onClick={() => onChange(page)}>
              {page}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────

type FeedType = 'global' | 'feed' | 'tag'

export default function Home() {
  const { isAuthenticated, status } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const tag = searchParams.get('tag') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const feedParam = searchParams.get('feed')

  // Derive active tab: tag > personal feed > global feed
  const activeFeed: FeedType =
    tag ? 'tag'
    : feedParam === 'personal' && isAuthenticated ? 'feed'
    : 'global'

  const [articles, setArticles] = useState<Article[]>([])
  const [articlesCount, setArticlesCount] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [loadingTags, setLoadingTags] = useState(true)

  // Fetch popular tags once on mount
  useEffect(() => {
    getTags()
      .then(setTags)
      .catch(() => setTags([]))
      .finally(() => setLoadingTags(false))
  }, [])

  // Fetch articles whenever feed type, tag, or page changes.
  // Also wait until auth state is resolved so personal feed works correctly.
  useEffect(() => {
    if (status === 'loading') return

    setLoadingArticles(true)
    const filters: ArticleFilters = { limit: LIMIT, offset: (page - 1) * LIMIT }
    if (tag) filters.tag = tag

    const fetch = activeFeed === 'feed' ? getFeedArticles(filters) : getArticles(filters)

    fetch
      .then(({ articles, articlesCount }) => {
        setArticles(articles)
        setArticlesCount(articlesCount)
      })
      .catch(() => {
        setArticles([])
        setArticlesCount(0)
      })
      .finally(() => setLoadingArticles(false))
  }, [activeFeed, tag, page, status]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(articlesCount / LIMIT)

  function setFeed(type: FeedType, tagName?: string) {
    if (type === 'tag' && tagName) {
      setSearchParams({ tag: tagName })
    } else if (type === 'feed') {
      setSearchParams({ feed: 'personal' })
    } else {
      setSearchParams({})
    }
  }

  function setPage(p: number) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    })
  }

  return (
    <div className="home-page">
      {/* Banner */}
      <div className="banner">
        <div className="container">
          <h1 className="logo-font">conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>

      <div className="container page">
        <div className="row">
          {/* ── Article feed ── */}
          <div className="col-md-9">
            {/* Feed tabs */}
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                {isAuthenticated && (
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeFeed === 'feed' ? 'active' : ''}`}
                      onClick={() => setFeed('feed')}
                    >
                      Your Feed
                    </button>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeFeed === 'global' ? 'active' : ''}`}
                    onClick={() => setFeed('global')}
                  >
                    Global Feed
                  </button>
                </li>
                {tag && (
                  <li className="nav-item">
                    <span className="nav-link active">
                      <i className="ion-pound" /> {tag}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Articles */}
            {loadingArticles || status === 'loading' ? (
              <div className="article-preview">Loading articles...</div>
            ) : articles.length === 0 ? (
              <div className="article-preview">No articles are here... yet.</div>
            ) : (
              articles.map(a => <ArticlePreview key={a.slug} article={a} />)
            )}

            <Pagination current={page} total={totalPages} onChange={setPage} />
          </div>

          {/* ── Tags sidebar ── */}
          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>
              {loadingTags ? (
                <p>Loading tags...</p>
              ) : (
                <div className="tag-list">
                  {tags.map(t => (
                    <button
                      key={t}
                      className="tag-pill tag-default"
                      onClick={() => setFeed('tag', t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
