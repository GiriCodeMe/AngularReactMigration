# React Migration Requirements

## Overview

Migrate the **Conduit** Angular 21 app to React 18. The React app lives in `react-app/`.
The Angular app in `src/` is the reference implementation — do not modify it.

---

## Pages to Migrate

| Page                | Route                          | Status            |
| ------------------- | ------------------------------ | ----------------- |
| Home                | `/`                            | ✅ Done (Phase 2) |
| Article Detail      | `/article/:slug`               | 🔲 Pending        |
| Editor (create)     | `/editor`                      | 🔲 Pending        |
| Editor (edit)       | `/editor/:slug`                | 🔲 Pending        |
| Profile             | `/profile/:username`           | 🔲 Pending        |
| Profile — Favorites | `/profile/:username/favorites` | 🔲 Pending        |
| Login               | `/login`                       | 🔲 Pending        |
| Register            | `/register`                    | 🔲 Pending        |
| Settings            | `/settings`                    | 🔲 Pending        |

---

## Success Criteria

### Authentication

- [ ] Register with username, email, password — redirects to home on success
- [ ] Login with email, password — redirects to home on success
- [ ] Logout — clears session, redirects to home
- [ ] JWT token persisted in `localStorage` across page reloads
- [ ] Auth-protected routes (`/settings`, `/editor`) redirect to `/login` if not authenticated
- [ ] Auth pages (`/login`, `/register`) redirect to `/` if already authenticated

### Home Page

- [x] Global Feed tab — paginated list of all articles (10 per page)
- [x] Your Feed tab — articles from followed users (logged-in only)
- [x] Popular tags sidebar — click a tag filters articles
- [x] Pagination — page number reflected in URL as `?page=N`
- [x] Favorite / unfavorite article from feed card (logged-in only)

### Article Detail Page

- [ ] Displays article title, body (rendered from Markdown to HTML), author, date
- [ ] Favorite / unfavorite button with live count
- [ ] Follow / unfollow author button (logged-in only)
- [ ] Comment list — all comments shown below the article
- [ ] Add comment form (logged-in only)
- [ ] Delete own comment (author only)
- [ ] Delete article button (author only) — navigates to home on delete
- [ ] Edit article button (author only) — navigates to `/editor/:slug`

### Editor Page

- [ ] Create new article — form with title, description, body, tags
- [ ] Edit existing article — form pre-filled with existing data
- [ ] Tags: add on Enter key, remove by clicking ×
- [ ] Validation errors displayed below form
- [ ] Only the article author can edit (redirect home if not author)

### Profile Page

- [ ] Displays username, bio, avatar
- [ ] "My Articles" tab — articles written by this user
- [ ] "Favorited Articles" tab — articles favorited by this user
- [ ] Follow / unfollow button (logged-in, not own profile)
- [ ] "Edit Profile Settings" button (own profile only) — links to `/settings`

### Settings Page

- [ ] Form pre-filled with current user data (image URL, username, bio, email)
- [ ] Password field — only sent to API if filled in
- [ ] Save changes via PUT /user
- [ ] Validation errors displayed on failure
- [ ] Logout button — clears session, redirects to home

---

## Non-Functional Requirements

- [ ] No console errors on any page
- [ ] Styling matches Angular version (uses same Conduit CSS classes)
- [ ] Markdown in article body sanitized before rendering (DOMPurify)
- [ ] Pagination reflected in URL query params (bookmarkable)
- [ ] Protected routes enforce authentication
- [ ] Mobile responsive (Conduit CSS handles this)
- [ ] TypeScript — no `any` types, strict mode enabled

---

## Feature Checklist by Component

### Article Detail Page — `src/pages/ArticlePage.tsx`

- Key Angular source: `src/app/features/article/pages/article/article.component.ts`
- Uses: `ArticlesService`, `CommentsService`, `UserService`
- Child components needed: `ArticleMeta`, `ArticleComment`, `FavoriteButton`, `FollowButton`
- Markdown rendering: `marked.parse(body)` wrapped in `DOMPurify.sanitize()`

### Editor Page — `src/pages/EditorPage.tsx`

- Key Angular source: `src/app/features/article/pages/editor/editor.component.ts`
- Uses: `ArticlesService`, `UserService`
- New article: POST /articles
- Edit article: load via GET /articles/:slug, then PUT /articles/:slug
- Tag input: press Enter to add tag, click × to remove

### Profile Page — `src/pages/ProfilePage.tsx`

- Key Angular source: `src/app/features/profile/pages/profile/profile.component.ts`
- Uses: `ProfileService`, `ArticlesService`, `UserService`
- Nested routing: `/profile/:username` (articles) and `/profile/:username/favorites`
- Follow/unfollow via POST/DELETE /profiles/:username/follow

### Settings Page — `src/pages/SettingsPage.tsx`

- Key Angular source: `src/app/features/settings/settings.component.ts`
- Uses: `UserService`
- Form fields: image, username, bio, email, password (optional)
- Only send password if non-empty

### Login / Register Pages — `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`

- Key Angular source: `src/app/core/auth/auth.component.ts` (single component, split into two in React)
- Uses: `AuthContext` login() / register()
- Show field-level validation errors from API response

---

## Services Already Created

| Service              | File                               | Status     |
| -------------------- | ---------------------------------- | ---------- |
| Auth API functions   | `src/services/auth.service.ts`     | ✅ Done    |
| Auth state (Context) | `src/contexts/AuthContext.tsx`     | ✅ Done    |
| Articles API         | `src/services/articles.service.ts` | ✅ Done    |
| Tags API             | `src/services/tags.service.ts`     | ✅ Done    |
| Comments API         | `src/services/comments.service.ts` | 🔲 Pending |
| Profile API          | `src/services/profile.service.ts`  | 🔲 Pending |

---

## Remaining Services to Create

### `src/services/comments.service.ts`

```ts
getComments(slug: string): Promise<Comment[]>
addComment(slug: string, body: string): Promise<Comment>
deleteComment(slug: string, commentId: string): Promise<void>
```

### `src/services/profile.service.ts`

```ts
getProfile(username: string): Promise<Profile>
followUser(username: string): Promise<Profile>
unfollowUser(username: string): Promise<Profile>
```
