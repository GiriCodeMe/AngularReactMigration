# AngularReactMigration — Agent Guide

## Project Context

This repo contains the **Conduit** Angular 21 app (a Medium.com clone) that is being migrated to React 18.
The Angular source lives in `src/`. The React migration will be built alongside it.

Full architecture documentation:

- `COMPONENTS.md` — every Angular component, service, pipe, and model explained
- `MIGRATION_PLAN.md` — recommended migration order, challenges, and dependency map

**Live API (shared by both Angular and React apps):** `https://api.realworld.show/api`
No backend changes are needed — the API spec is stable.

---

## Stack

### Angular (existing — do not modify)

| Layer     | Technology                                       |
| --------- | ------------------------------------------------ |
| Framework | Angular 21 (standalone components, no NgModules) |
| State     | Angular Signals + RxJS BehaviorSubjects          |
| Forms     | ReactiveFormsModule                              |
| HTTP      | Angular HttpClient + 3 functional interceptors   |
| Routing   | Angular Router with lazy `loadComponent`         |
| Markdown  | `marked` library via async pipe                  |
| CSS       | Conduit theme (`realworld` git submodule)        |
| Tests     | Vitest + Playwright                              |

### React (migration target)

| Layer     | Technology                              |
| --------- | --------------------------------------- |
| Framework | React 18 + TypeScript                   |
| Build     | Vite                                    |
| Routing   | React Router v6                         |
| HTTP      | Axios with interceptors                 |
| Forms     | React Hook Form                         |
| State     | React Context + useReducer (or Zustand) |
| Markdown  | `marked` + `dompurify`                  |

---

## Commands

### Angular App

| Task                            | Command                                   |
| ------------------------------- | ----------------------------------------- |
| Start dev server                | `npm start` → http://localhost:4200       |
| Build                           | `npm run build`                           |
| Run unit tests                  | `npm run test`                            |
| Run E2E tests                   | `npm run e2e`                             |
| Init git submodule (first time) | `git submodule update --init --recursive` |

> **Important:** The CSS depends on the `realworld` git submodule. If styles are missing, run `git submodule update --init --recursive`.

---

## Critical Rules

- **Do not modify** the Angular source code in `src/` — it is the reference implementation to migrate from
- **Read `COMPONENTS.md` first** before working on any component — it explains what each piece does
- **Follow the migration order in `MIGRATION_PLAN.md`** — later phases depend on earlier ones
- **The React app must call the same API** (`https://api.realworld.show/api`) — no backend changes
- **One component per file** in the React app, PascalCase filename matching component name
- **TypeScript throughout** — copy model interfaces from Angular as-is (they work in React unchanged)
- **Do not add NgModules** to the Angular side — it uses the standalone component API

---

## Migration Rules

When migrating a component from Angular to React:

1. **Read the Angular source file first** — understand what it does before writing React code
2. **Keep the same props/interface shape** — rename Angular `@Input()` → React prop, `@Output()` → callback prop
3. **Replace RxJS with async/await** — most services make one HTTP call; `service.get(slug).pipe(...)` → `await getArticle(slug)`
4. **Replace signals with useState** — `signal(false)` → `const [value, setValue] = useState(false)`
5. **Replace structural directives with JSX** — `*ngIf` → `{condition && <Component />}`
6. **Sanitize markdown** — always wrap `marked.parse()` output in `DOMPurify.sanitize()` before setting via `dangerouslySetInnerHTML`
7. **Protect auth routes** — use the `RequireAuth` wrapper component from Phase 11 of the migration plan

---

## Project Structure (React migration target)

```
src-react/                     ← React app lives here (separate from Angular src/)
  main.tsx
  App.tsx                      ← Router setup, AuthProvider wrapper
  api/
    client.ts                  ← Axios instance with base URL + interceptors
    articles.ts                ← Article API functions
    auth.ts                    ← Login, register, get current user
    comments.ts                ← Comment API functions
    profile.ts                 ← Profile API functions
    tags.ts                    ← Tags API function
  store/
    auth.tsx                   ← AuthContext + useAuth hook
  components/
    Header.tsx
    Footer.tsx
    ListErrors.tsx
    ArticleList.tsx
    ArticlePreview.tsx
    ArticleMeta.tsx
    ArticleComment.tsx
    FavoriteButton.tsx
    FollowButton.tsx
    RequireAuth.tsx
    RequireGuest.tsx
  pages/
    HomePage.tsx
    LoginPage.tsx
    RegisterPage.tsx
    SettingsPage.tsx
    ArticlePage.tsx
    EditorPage.tsx
    ProfilePage.tsx
    ProfileArticlesPage.tsx
    ProfileFavoritesPage.tsx
  utils/
    defaultImage.ts            ← Returns fallback avatar URL
    markdown.ts                ← Wraps marked.parse + DOMPurify.sanitize
    tokenStorage.ts            ← localStorage read/write for JWT
  types/
    user.ts                    ← User interface (copied from Angular)
    article.ts                 ← Article, Comment interfaces
    profile.ts                 ← Profile interface
```

---

## Functional Requirements

These are the features the migrated React app must support:

### Authentication

- [ ] Register with username, email, password
- [ ] Login with email, password
- [ ] Logout (clears JWT, redirects to home)
- [ ] Persist login across page reloads (JWT in localStorage)
- [ ] Redirect unauthenticated users away from protected pages

### Home Page

- [ ] Global feed: list all articles with pagination
- [ ] Personal feed: list articles from followed users (logged-in only)
- [ ] Filter by tag: click a tag to see only articles with that tag
- [ ] Paginate articles (10 per page)
- [ ] Show popular tags sidebar

### Articles

- [ ] View full article with markdown body rendered as HTML
- [ ] Favorite / unfavorite an article (logged-in only)
- [ ] Create new article (title, description, body, tags)
- [ ] Edit existing article (author only)
- [ ] Delete article (author only)

### Comments

- [ ] View all comments on an article
- [ ] Add a comment (logged-in only)
- [ ] Delete own comments (author only)

### Profiles

- [ ] View any user's profile (bio, avatar)
- [ ] Follow / unfollow users (logged-in only)
- [ ] View a user's articles tab
- [ ] View a user's favorited articles tab

### Settings

- [ ] Update profile image URL, username, bio, email, password

---

## Non-Functional Mandates

- All pages must work without a backend restart (API is external)
- Protected routes (`/settings`, `/editor`, `/editor/:slug`) must redirect to `/login` if not authenticated
- Auth pages (`/login`, `/register`) must redirect to `/` if already authenticated
- Markdown in article body must be sanitized before rendering (prevent XSS)
- The app must be mobile-responsive (same CSS from the `realworld` submodule can be reused)
- Pagination must be reflected in the URL as a query parameter (`?page=2`) so links are bookmarkable
- No new CSS frameworks — use the existing Conduit CSS from the `realworld` submodule

---

## Key Files to Read Before Working

| File                                                    | Why it matters                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------- |
| `COMPONENTS.md`                                         | What each Angular component does and what it depends on             |
| `MIGRATION_PLAN.md`                                     | What order to migrate things in and known challenges                |
| `src/app/core/auth/services/user.service.ts`            | Central auth logic — understand this before building the auth store |
| `src/app/core/interceptors/api.interceptor.ts`          | The base URL for all API calls                                      |
| `src/app/app.routes.ts`                                 | All routes and their guards                                         |
| `src/app/features/article/services/articles.service.ts` | All article API calls                                               |

---

## API Reference

**Base URL:** `https://api.realworld.show/api`

Full API spec: [https://realworld-docs.netlify.app/specifications/backend/endpoints/](https://realworld-docs.netlify.app/specifications/backend/endpoints/)

| Endpoint                       | Method | Description                                                                        |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------- |
| `/users/login`                 | POST   | Login → returns `{ user: { token, ... } }`                                         |
| `/users`                       | POST   | Register → returns `{ user: { token, ... } }`                                      |
| `/user`                        | GET    | Get current user (requires auth header)                                            |
| `/user`                        | PUT    | Update current user                                                                |
| `/articles`                    | GET    | List articles (supports `?tag=`, `?author=`, `?favorited=`, `?limit=`, `?offset=`) |
| `/articles/feed`               | GET    | Personal feed (requires auth)                                                      |
| `/articles`                    | POST   | Create article                                                                     |
| `/articles/:slug`              | GET    | Get single article                                                                 |
| `/articles/:slug`              | PUT    | Update article                                                                     |
| `/articles/:slug`              | DELETE | Delete article                                                                     |
| `/articles/:slug/comments`     | GET    | Get comments                                                                       |
| `/articles/:slug/comments`     | POST   | Add comment                                                                        |
| `/articles/:slug/comments/:id` | DELETE | Delete comment                                                                     |
| `/articles/:slug/favorite`     | POST   | Favorite article                                                                   |
| `/articles/:slug/favorite`     | DELETE | Unfavorite article                                                                 |
| `/profiles/:username`          | GET    | Get profile                                                                        |
| `/profiles/:username/follow`   | POST   | Follow user                                                                        |
| `/profiles/:username/follow`   | DELETE | Unfollow user                                                                      |
| `/tags`                        | GET    | Get popular tags                                                                   |
