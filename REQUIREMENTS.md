# React Migration Requirements

## Overview

Migrate the **Conduit** Angular 21 app to React 18. The React app lives in `react-app/`.
The Angular app in `src/` is the reference implementation — do not modify it.

---

## Pages to Migrate

| Page            | Route                | Status  |
| --------------- | -------------------- | ------- |
| Home            | `/`                  | ✅ Done |
| Article Detail  | `/article/:slug`     | ✅ Done |
| Editor (create) | `/editor`            | ✅ Done |
| Editor (edit)   | `/editor/:slug`      | ✅ Done |
| Profile         | `/profile/:username` | ✅ Done |
| Login           | `/login`             | ✅ Done |
| Register        | `/register`          | ✅ Done |
| Settings        | `/settings`          | ✅ Done |

---

## Success Criteria

### Authentication

- [x] Register with username, email, password — redirects to home on success
- [x] Login with email, password — redirects to home on success
- [x] Logout — clears session, redirects to home
- [x] JWT token persisted in `localStorage` across page reloads
- [x] Auth-protected routes (`/settings`, `/editor`) redirect to `/login` if not authenticated
- [x] Auth pages (`/login`, `/register`) redirect to `/` if already authenticated

### Home Page

- [x] Global Feed tab — paginated list of all articles (10 per page)
- [x] Your Feed tab — articles from followed users (logged-in only)
- [x] Popular tags sidebar — click a tag filters articles
- [x] Pagination — page number reflected in URL as `?page=N`
- [x] Favorite / unfavorite article from feed card (logged-in only)

### Article Detail Page

- [x] Displays article title, body (rendered from Markdown to HTML), author, date
- [x] Favorite / unfavorite button with live count
- [x] Follow / unfollow author button (logged-in only)
- [x] Comment list — all comments shown below the article
- [x] Add comment form (logged-in only)
- [x] Delete own comment (author only)
- [x] Delete article button (author only) — navigates to home on delete
- [x] Edit article button (author only) — navigates to `/editor/:slug`

### Editor Page

- [x] Create new article — form with title, description, body, tags
- [x] Edit existing article — form pre-filled with existing data
- [x] Tags: add on Enter key, remove by clicking ×
- [x] Validation errors displayed below form

### Profile Page

- [x] Displays username, bio, avatar
- [x] "My Articles" tab — articles written by this user
- [x] "Favorited Articles" tab — articles favorited by this user
- [x] Follow / unfollow button (logged-in, not own profile)
- [x] "Edit Profile Settings" button (own profile only) — links to `/settings`

### Settings Page

- [x] Form pre-filled with current user data (image URL, username, bio, email)
- [x] Password field — only sent to API if filled in
- [x] Save changes via PUT /user
- [x] Validation errors displayed on failure
- [x] Logout button — clears session, redirects to home

---

## Non-Functional Requirements

- [x] No console errors on any page
- [x] Styling matches Angular version (uses same Conduit CSS classes)
- [x] Markdown in article body sanitized before rendering (DOMPurify)
- [x] Pagination reflected in URL query params (bookmarkable)
- [x] Protected routes enforce authentication
- [x] Mobile responsive (Conduit CSS handles this)
- [x] TypeScript — no `any` types, strict mode enabled
- [x] Unit tests + coverage (Vitest + Testing Library) — `npm run test:coverage`
- [x] E2E tests (Playwright, Chromium) — `npm run test:e2e`
- [x] Accessibility tests (axe-core WCAG 2.1 AA) — `npm run test:a11y`
- [x] Vulnerability scan — `npm run audit:deps` (0 high/critical found)
- [x] Library audit — `npm audit` clean

---

## Commands

| Task                  | Command                               |
| --------------------- | ------------------------------------- |
| Start dev server      | `npm run dev` → http://localhost:5173 |
| Unit tests            | `npm test`                            |
| Unit tests + coverage | `npm run test:coverage`               |
| E2E tests             | `npm run test:e2e`                    |
| Accessibility tests   | `npm run test:a11y`                   |
| Vulnerability scan    | `npm run audit:deps`                  |

---

## Services Status

| Service              | File                               | Status  |
| -------------------- | ---------------------------------- | ------- |
| Auth API functions   | `src/services/auth.service.ts`     | ✅ Done |
| Auth state (Context) | `src/contexts/AuthContext.tsx`     | ✅ Done |
| Articles API         | `src/services/articles.service.ts` | ✅ Done |
| Tags API             | `src/services/tags.service.ts`     | ✅ Done |
| Comments API         | `src/services/comments.service.ts` | ✅ Done |
| Profile API          | `src/services/profile.service.ts`  | ✅ Done |
