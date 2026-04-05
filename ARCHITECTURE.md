# Architecture Overview — Angular Conduit App

This document describes the high-level architecture of the **Conduit** app — a Medium.com clone built with Angular 21.

---

## What the App Does

Conduit is a social blogging platform. Users can:

- Register and log in
- Read and write articles (with Markdown support)
- Comment on articles
- Favorite articles
- Follow other users
- Filter articles by tag

All data comes from a live public API at `https://api.realworld.show/api`.

---

## Tech Stack

| Concern          | Technology                              | Notes                                              |
| ---------------- | --------------------------------------- | -------------------------------------------------- |
| Framework        | Angular 21                              | Standalone components — no NgModules               |
| Language         | TypeScript 5.9                          | Strict mode enabled                                |
| State management | Angular Signals + RxJS BehaviorSubjects | Signals for local state; BehaviorSubjects for auth |
| Forms            | ReactiveFormsModule                     | FormBuilder, FormGroup, FormControl                |
| HTTP             | Angular HttpClient                      | Three functional interceptors (see below)          |
| Routing          | Angular Router                          | Lazy-loaded routes via `loadComponent`             |
| Markdown         | `marked` (dynamic import)               | Loaded on demand to keep initial bundle small      |
| CSS              | Conduit theme                           | Served from the `realworld` git submodule          |
| Testing          | Vitest + Playwright                     | Unit and E2E tests                                 |
| Build            | Angular CLI / `@angular/build`          | Dev server on port 4200                            |

---

## Folder Structure

```
src/
  main.ts                        # App bootstrap (bootstrapApplication)
  app/
    app.component.ts             # Root shell: Header + RouterOutlet + Footer
    app.config.ts                # Providers: router, HttpClient, interceptors, app init
    app.routes.ts                # Top-level route table (all lazy-loaded)
    core/                        # App-wide singletons (auth, layout, interceptors)
      auth/
        auth.component.ts        # Login + Register page
        if-authenticated.directive.ts
        user.model.ts
        services/
          jwt.service.ts         # localStorage wrapper for JWT
          user.service.ts        # Auth state, login, register, logout, update
      interceptors/
        api.interceptor.ts       # Prepends base API URL to all requests
        token.interceptor.ts     # Adds Authorization header when logged in
        error.interceptor.ts     # Handles 401 globally, normalizes errors
      layout/
        header.component.ts      # Top nav bar
        footer.component.ts      # Footer
      models/
        errors.model.ts
        loading-state.model.ts
    features/                    # Feature modules (each self-contained)
      article/                   # Everything related to articles
        components/              # Reusable article UI pieces
        pages/                   # Full page components (home, article, editor)
        models/                  # Article, Comment, ArticleListConfig types
        services/                # ArticlesService, CommentsService, TagsService
      profile/                   # User profile feature
        components/              # FollowButton, article/favorites tabs
        pages/                   # Profile page shell
        models/                  # Profile type
        services/                # ProfileService
        profile.routes.ts        # Nested child routes for profile tabs
      settings/
        settings.component.ts    # Account settings page
    shared/                      # Cross-feature utilities
      components/
        list-errors.component.ts # Reusable error list display
      pipes/
        default-image.pipe.ts    # Fallback avatar URL
        markdown.pipe.ts         # Async Markdown → safe HTML
realworld/                       # Git submodule — Conduit CSS theme
```

---

## Key Architectural Decisions

### 1. Standalone Components (No NgModules)

Angular 21 uses the standalone component API throughout. There are **no `@NgModule` declarations** anywhere. Each component declares its own `imports: [...]` array directly.

```ts
@Component({
  standalone: true, // ← every component has this
  imports: [RouterLink, AsyncPipe],
  template: `...`,
})
export class HeaderComponent {}
```

This makes each component self-contained and much easier to port to React — each one maps directly to a React function component with its own imports.

### 2. Three HTTP Interceptors (functional style)

Registered in `app.config.ts` as `withInterceptors([...])`. They run on every HTTP request/response in order:

```
Request  →  [apiInterceptor] →  [tokenInterceptor] →  Angular HttpClient  →  API server
Response ←  [errorInterceptor]  ←─────────────────────────────────────────────────────
```

| Interceptor        | Direction | What it does                                           |
| ------------------ | --------- | ------------------------------------------------------ |
| `apiInterceptor`   | Request   | Prepends `https://api.realworld.show/api` to every URL |
| `tokenInterceptor` | Request   | Adds `Authorization: Token <jwt>` if logged in         |
| `errorInterceptor` | Response  | 401 → logout; normalizes all error objects             |

### 3. Auth State Machine

`UserService` manages auth as a state machine with four states:

```
loading  →  authenticated    (token found, /user fetch succeeded)
         →  unauthenticated  (no token, or /user returned 401)
         →  unavailable      (server error — retries with backoff)
```

Components subscribe to `authState$` to react to state changes.
`isAuthenticated` is a derived observable used by route guards.

### 4. Lazy Loading

Every page-level component is lazy-loaded via `loadComponent()`. Only the root shell (Header, Footer, RouterOutlet) is eager. This keeps the initial JS bundle small.

```ts
{
  path: 'article/:slug',
  loadComponent: () => import('./features/article/pages/article/article.component')
}
```

### 5. Change Detection: OnPush + Signals

Every component uses `ChangeDetectionStrategy.OnPush`. Local state is managed with Angular signals (`signal()`, `.set()`, `.update()`). This means Angular only re-renders a component when:

- An `@Input()` reference changes, OR
- A signal it reads changes, OR
- An `async` pipe emits a new value

---

## Data Flow

```
User action
    │
    ▼
Component (OnPush + Signals)
    │  calls
    ▼
Service method (ArticlesService, UserService, etc.)
    │  returns Observable / Promise
    ▼
Angular HttpClient
    │  passes through interceptors
    ▼
https://api.realworld.show/api
    │  JSON response
    ▼
Component updates signal / async pipe emits
    │
    ▼
UI re-renders
```

---

## Routing Structure

```
/                       → HomeComponent         (lazy)
/tag/:tag               → HomeComponent         (lazy, filtered)
/login                  → AuthComponent         (lazy, blocked if logged in)
/register               → AuthComponent         (lazy, blocked if logged in)
/settings               → SettingsComponent     (lazy, requires auth)
/editor                 → EditorComponent       (lazy, requires auth)
/editor/:slug           → EditorComponent       (lazy, requires auth, pre-fills form)
/article/:slug          → ArticleComponent      (lazy, public)
/profile/:username      → ProfileComponent      (eager shell)
  ├── (default)         → ProfileArticlesComponent   (lazy tab)
  └── /favorites        → ProfileFavoritesComponent  (lazy tab)
```

**Route guards** are plain functions using `inject()`:

```ts
const requireAuth = () => {
  const isAuth = inject(UserService).isAuthenticated;
  const router = inject(Router);
  return isAuth.pipe(map(ok => ok || router.createUrlTree(['/login'])));
};
```

---

## CSS Architecture

The app uses the **Conduit** open-source CSS theme. It lives in the `realworld/` git submodule and is imported in `angular.json`:

```json
"styles": ["realworld/assets/theme/styles.css"]
```

All styling is done through predefined Conduit CSS classes (`.btn`, `.article-preview`, `.feed-toggle`, etc.) — there are no component-specific stylesheets except `home.component.css` for minor layout tweaks.

> **Important:** Run `git submodule update --init --recursive` to clone the submodule before the first build.

---

## Component Dependency Map

The diagram below shows which components depend on which services.

```
UserService ──────────────────────────────────────────────────────────┐
    │ used by                                                           │
    ├── HeaderComponent                                                 │
    ├── AuthComponent                                                   │
    ├── SettingsComponent                                               │
    ├── ArticleComponent                                                │
    ├── ArticlePreviewComponent                                         │
    ├── ArticleCommentComponent                                         │
    ├── FavoriteButtonComponent                                         │
    ├── FollowButtonComponent                                           │
    └── ProfileComponent                                                │
                                                                        │
ArticlesService ──────────────────────────────────────────┐             │
    │ used by                                              │             │
    ├── ArticleListComponent                               │             │
    ├── ArticlePreviewComponent ──────────────────────────┤             │
    ├── FavoriteButtonComponent ──────────────────────────┤             │
    ├── ArticleComponent ─────────────────────────────────┤─────────────┤
    ├── EditorComponent ──────────────────────────────────┘             │
    └── HomeComponent                                                   │
                                                                        │
ProfileService                                                          │
    │ used by                                                           │
    ├── ProfileComponent ─────────────────────────────────────────────┘
    ├── FollowButtonComponent
    └── ArticleComponent
```

---

## What's Different from a Standard Angular App

| Standard Angular                   | This App                                   |
| ---------------------------------- | ------------------------------------------ |
| NgModules everywhere               | Zero NgModules — all standalone            |
| `ngOnInit` + subscriptions         | Angular signals + async pipe               |
| Class-based route guards           | Inline functional guards with `inject()`   |
| Global error handling in services  | Centralized in `errorInterceptor`          |
| `CommonModule` imported per module | Individual pipes imported per component    |
| Manual subscription management     | `async` pipe handles subscribe/unsubscribe |
