# Angular → React Migration Plan

## What We're Migrating

The **Conduit** app (a Medium.com clone) from Angular 21 → React 18 + React Router v6 + TypeScript.

**Live API:** `https://api.realworld.show/api` — no backend changes needed. The API stays the same.

---

## Recommended Tech Stack (React)

| Angular concept                  | React equivalent                                        |
| -------------------------------- | ------------------------------------------------------- |
| Component                        | React function component                                |
| `@Injectable` Service            | Custom hook (`useArticles`) or Zustand/Context store    |
| Angular Router                   | React Router v6                                         |
| `HttpClient` + interceptors      | Axios instance with interceptors                        |
| Reactive Forms                   | React Hook Form                                         |
| `AsyncPipe` / RxJS Observables   | `useState` + `useEffect` or TanStack Query              |
| Angular signals (`signal()`)     | `useState` / `useReducer`                               |
| Structural directives (`*ngIf`)  | Plain JSX conditionals (`{condition && <Component />}`) |
| Pipes                            | Utility functions                                       |
| `ChangeDetectionStrategy.OnPush` | `React.memo`                                            |

---

## Migration Order

Migrate in this order. Each phase builds on the previous one.

---

### Phase 1 — Project Setup (Day 1)

**No components yet — just scaffolding.**

1. Create a new React + Vite + TypeScript project
2. Install dependencies: `react-router-dom`, `axios`, `react-hook-form`, `marked`
3. Set up Axios instance with the three interceptors:
   - Base URL: `https://api.realworld.show/api`
   - Add JWT token from localStorage to every request
   - Handle 401 errors globally (logout user)
4. Copy all TypeScript interfaces from Angular (`User`, `Article`, `Comment`, `Profile`) — they work in React as-is
5. Copy `JwtService` logic into a simple `tokenStorage.ts` utility file (it's just localStorage reads/writes)

**Why first:** Everything depends on the API layer. Get this working before touching UI.

---

### Phase 2 — Auth Store (Day 1-2)

**Files to create:** `src/store/auth.ts` (or `src/hooks/useAuth.ts`)

Replaces: `UserService`, `JwtService`

Create a global auth state (using React Context + `useReducer`, or Zustand):

- State: `{ user: User | null, status: 'loading' | 'authenticated' | 'unauthenticated' }`
- Actions: `login()`, `register()`, `logout()`, `updateUser()`, `loadCurrentUser()`
- On app startup, read the token from localStorage and fetch `/user` to hydrate state

**Why second:** Auth state is read by nearly every component. It must exist before building any UI.

---

### Phase 3 — Shared / Layout Components (Day 2)

**Simple, no business logic — good for warming up.**

Migrate in this order:

1. **`FooterComponent`** → `Footer.tsx`
   - Pure HTML, no logic, no dependencies
   - Just add `new Date().getFullYear()` for the year

2. **`ListErrorsComponent`** → `ListErrors.tsx`
   - Takes an `errors` prop, renders a `<ul>` of error messages
   - Used by every form page — get it done early

3. **`HeaderComponent`** → `Header.tsx`
   - Uses `useAuth()` hook to show/hide nav links
   - Uses `NavLink` from React Router instead of `RouterLink`

4. **Root layout** → `App.tsx`
   - Wraps `<Header />`, `<Outlet />` (React Router), `<Footer />`

---

### Phase 4 — Auth Pages (Day 3)

Replaces: `AuthComponent`

**Files to create:** `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`

- Split the single Angular component into two separate React pages (cleaner)
- Use `react-hook-form` for form state and validation
- Call `login()` or `register()` from the auth store
- On success, navigate to `/` using `useNavigate()`
- Show `<ListErrors />` on API errors

**Challenges:**

- Angular used a single component with a URL check to pick mode — in React, just make two separate pages. Much simpler.

---

### Phase 5 — Settings Page (Day 3)

Replaces: `SettingsComponent`

**File:** `src/pages/SettingsPage.tsx`

- Pre-fill form with current user data from `useAuth()`
- On submit, call `updateUser()` from auth store
- Log Out button calls `logout()` then navigates to `/`
- Protect this route (redirect to `/login` if not authenticated)

**Challenges:**

- Password field: only send it if the user typed something (don't send empty string)

---

### Phase 6 — Article Reusable Components (Day 4)

These are building blocks needed by the feed and profile pages.

Migrate in this order:

1. **`DefaultImagePipe`** → `defaultImage.ts` utility function

   ```ts
   export const defaultImage = (url: string | null) => url ?? '/assets/default-avatar.svg';
   ```

2. **`MarkdownPipe`** → `useMarkdown.ts` hook or inline `marked.parse()`

3. **`FavoriteButtonComponent`** → `FavoriteButton.tsx`
   - Props: `article: Article`, `onToggle: (article: Article) => void`
   - Calls favorite/unfavorite API
   - Redirects to `/register` if not logged in

4. **`ArticleMetaComponent`** → `ArticleMeta.tsx`
   - Props: `article: Article`, `children: ReactNode` (for action buttons)
   - Pure display component

5. **`ArticlePreviewComponent`** → `ArticlePreview.tsx`
   - Props: `article: Article`
   - Renders one article card with title, tags, favorites

6. **`ArticleListComponent`** → `ArticleList.tsx`
   - Props: `config: ArticleListConfig`
   - Manages its own `loading`, `articles`, `totalPages` state
   - Renders pagination + list of `<ArticlePreview />`

---

### Phase 7 — Home Page (Day 5)

Replaces: `HomeComponent`

**File:** `src/pages/HomePage.tsx`

- Fetch tags from `/tags` API
- Show Global Feed / Your Feed tabs (Your Feed only if logged in)
- Support filtering by tag (from URL params)
- Use `<ArticleList />` from Phase 6

**Challenges:**

- The Angular version uses `@rx-angular/template`'s `RxLet` directive — in React, just use `useState` + `useEffect`. Much simpler.

---

### Phase 8 — Profile Pages (Day 6)

Replaces: `ProfileComponent`, `ProfileArticlesComponent`, `ProfileFavoritesComponent`, `FollowButtonComponent`

**Files:**

- `src/components/FollowButton.tsx`
- `src/pages/ProfilePage.tsx` (shell with tabs)
- `src/pages/ProfileArticlesPage.tsx`
- `src/pages/ProfileFavoritesPage.tsx`

**Route structure:**

```
/profile/:username              → ProfilePage (shell)
/profile/:username              → ProfileArticlesPage (default tab)
/profile/:username/favorites    → ProfileFavoritesPage
```

**Challenges:**

- Nested routing: React Router v6 handles this with `<Outlet />` in `ProfilePage` — same pattern as Angular.
- The "follow" and "edit settings" button swap: check `currentUser.username === profile.username`.

---

### Phase 9 — Article Detail Page (Day 7)

Replaces: `ArticleComponent`, `ArticleCommentComponent`

**Files:** `src/pages/ArticlePage.tsx`, `src/components/ArticleComment.tsx`

This is the most complex page.

- Load article + comments in parallel on mount
- Render article body using `marked.parse()` (set via `dangerouslySetInnerHTML`)
- Add/delete comments
- Delete article (author only) → navigate to `/`
- Favorite/follow buttons

**Challenges:**

- `dangerouslySetInnerHTML` — sanitize the marked output before setting it (use `DOMPurify` library)
- Auth checks before allowing comment/delete actions

---

### Phase 10 — Article Editor (Day 8)

Replaces: `EditorComponent`

**File:** `src/pages/EditorPage.tsx`

- If `/editor` → new article form
- If `/editor/:slug` → load existing article, check author matches current user
- Tag management: add tag on Enter key, remove tag by clicking `×`
- On submit: call create or update API

---

### Phase 11 — Route Guards (Day 8)

Replaces: inline `requireAuth` guard in `app.routes.ts`

**File:** `src/components/RequireAuth.tsx`

```tsx
// Wrap protected routes:
// <Route path="settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
export function RequireAuth({ children }) {
  const { status } = useAuth();
  if (status === 'loading') return <Spinner />;
  if (status === 'unauthenticated') return <Navigate to="/login" />;
  return children;
}
```

Also block `/login` and `/register` for already-logged-in users:

```tsx
export function RequireGuest({ children }) {
  const { status } = useAuth();
  if (status === 'authenticated') return <Navigate to="/" />;
  return children;
}
```

---

## Dependency Map

This shows which things must exist before you can build each component.

```
tokenStorage.ts (Phase 1)
    └── axiosInstance (Phase 1)
            └── AuthStore / useAuth (Phase 2)
                    ├── Header (Phase 3)
                    ├── ListErrors (Phase 3)
                    ├── LoginPage / RegisterPage (Phase 4)
                    ├── SettingsPage (Phase 5)
                    ├── FavoriteButton (Phase 6)
                    │       └── ArticlePreview (Phase 6)
                    │               └── ArticleList (Phase 6)
                    │                       ├── HomePage (Phase 7)
                    │                       ├── ProfileArticlesPage (Phase 8)
                    │                       └── ProfileFavoritesPage (Phase 8)
                    ├── FollowButton (Phase 8)
                    │       └── ProfilePage (Phase 8)
                    └── ArticlePage (Phase 9)
                            └── EditorPage (Phase 10)
```

---

## Potential Challenges

### 1. RxJS Observables → Promises / async-await

**Angular uses:** RxJS streams (`Observable`, `combineLatest`, `switchMap`)
**React uses:** Promises and `async/await` (or TanStack Query)
**Solution:** Replace `ArticlesService.get(slug).pipe(...)` with `await getArticle(slug)`. Most Angular services here only make a single HTTP call — they convert to plain async functions easily.

### 2. Angular Signals → React useState

**Angular uses:** `signal(false)`, `.set(true)`, `.update(x => !x)`
**React uses:** `const [value, setValue] = useState(false)`
**Solution:** Direct 1:1 mapping. This is straightforward.

### 3. Reactive Forms → React Hook Form

**Angular uses:** `FormBuilder`, `FormGroup`, `FormControl` with validators
**React uses:** `react-hook-form` with `register()`, `handleSubmit()`, `formState.errors`
**Solution:** The validation rules are the same; only the syntax changes.

### 4. `IfAuthenticatedDirective` → JSX conditionals

**Angular uses:** `<button *ifAuthenticated="true">Delete</button>`
**React uses:** `{isAuthenticated && <button>Delete</button>}`
**Solution:** Remove the directive entirely. Replace every usage with a simple `{condition && ...}` in JSX.

### 5. Lazy loading routes

**Angular uses:** `loadComponent(() => import(...))`
**React uses:** `const ArticlePage = React.lazy(() => import('./pages/ArticlePage'))`
**Solution:** Same concept, slightly different syntax. Wrap lazy routes in `<Suspense fallback={<Spinner />}>`.

### 6. Markdown + XSS safety

**Angular uses:** `DomSanitizer.bypassSecurityTrustHtml()`
**React uses:** `dangerouslySetInnerHTML={{ __html: sanitizedHtml }}`
**Solution:** Install `dompurify` and wrap all `marked.parse()` output: `DOMPurify.sanitize(marked.parse(body))`.

### 7. HTTP Interceptors

**Angular has:** Three built-in interceptors registered in `app.config.ts`
**React has:** No built-in interceptor system
**Solution:** Create a single Axios instance:

```ts
// src/api/client.ts
const client = axios.create({ baseURL: 'https://api.realworld.show/api' });
client.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});
client.interceptors.response.use(null, error => {
  if (error.response?.status === 401) logout();
  return Promise.reject(error);
});
```

### 8. Pagination state in URL

The Angular app reads `queryParams` from the URL for current page. Do the same in React with `useSearchParams()` from React Router to keep pagination bookmarkable.

---

## Estimated Timeline

| Phase     | Work                                           | Days         |
| --------- | ---------------------------------------------- | ------------ |
| 1         | Project setup + API layer                      | 1            |
| 2         | Auth store                                     | 1            |
| 3         | Layout components (Header, Footer, ListErrors) | 1            |
| 4-5       | Auth + Settings pages                          | 1            |
| 6         | Article building blocks                        | 1            |
| 7         | Home page                                      | 1            |
| 8         | Profile pages                                  | 1            |
| 9-10      | Article detail + Editor                        | 2            |
| 11        | Route guards + wiring up                       | 1            |
| —         | Testing + bug fixes                            | 2            |
| **Total** |                                                | **~12 days** |

---

## What You Can Skip / Simplify

- **`@rx-angular/template`** (`RxLet`) — used only in `HomeComponent`. Replace with `useState`. Delete the dependency.
- **`IfAuthenticatedDirective`** — replace all usages with `{isAuthenticated && ...}` in JSX. No equivalent needed.
- **`DefaultImagePipe`** — replace with a one-line utility function. No pipe system needed.
- **`LoadingState` enum** — replace with `'idle' | 'loading' | 'loaded' | 'error'` string union type. Same idea, cleaner in React.
