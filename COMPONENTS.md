# Component Inventory — Angular RealWorld (Conduit)

This document lists every component, service, pipe, and directive in the app.
The app is a Medium.com clone called **Conduit**. It uses Angular 21 with standalone components (no NgModules).

---

## Root

### AppComponent

- **File:** `src/app/app.component.ts`
- **What it does:** The outermost shell of the app. It renders the top navigation bar, the main page content (via RouterOutlet), and the footer. Think of it as the HTML skeleton that wraps everything.
- **Key dependencies:** `HeaderComponent`, `FooterComponent`, `RouterOutlet` (Angular Router)

---

## Layout (always visible on every page)

### HeaderComponent

- **File:** `src/app/core/layout/header.component.ts`
- **What it does:** The navigation bar at the top. Shows the app logo and links that change depending on whether the user is logged in or out (e.g., shows "Sign In" when logged out, or the username when logged in).
- **Key dependencies:** `UserService` (to know who is logged in), `RouterLink`

### FooterComponent

- **File:** `src/app/core/layout/footer.component.ts`
- **What it does:** The footer at the bottom of every page. Shows the current year dynamically.
- **Key dependencies:** None

---

## Auth (Login / Register)

### AuthComponent

- **File:** `src/app/core/auth/auth.component.ts`
- **What it does:** A single page that handles both Login and Register. It looks at the URL (`/login` vs `/register`) to decide which form to show. On success, it redirects to the home page.
- **Key dependencies:** `UserService` (API calls), `ReactiveFormsModule` (form handling), `ListErrorsComponent`

---

## Home Page

### HomeComponent

- **File:** `src/app/features/article/pages/home/home.component.ts`
- **What it does:** The main feed page. Shows a list of articles, a tag cloud on the right, and tabs to switch between "Global Feed" and "Your Feed". Supports filtering by tag.
- **Key dependencies:** `ArticlesService`, `TagsService`, `ArticleListComponent`, `UserService`

---

## Article Pages

### ArticleComponent

- **File:** `src/app/features/article/pages/article/article.component.ts`
- **What it does:** The full article detail page. Displays the article body (rendered as Markdown), all comments, and action buttons (delete, favorite, follow author). Only the article's author can delete it.
- **Key dependencies:** `ArticlesService`, `CommentsService`, `UserService`, `ArticleMetaComponent`, `ArticleCommentComponent`, `FavoriteButtonComponent`, `FollowButtonComponent`

### EditorComponent

- **File:** `src/app/features/article/pages/editor/editor.component.ts`
- **What it does:** The article editor page used for both creating new articles and editing existing ones. Has fields for title, description, body, and tags. If a slug is in the URL, it pre-fills the form with the existing article data.
- **Key dependencies:** `ArticlesService`, `UserService`, `ListErrorsComponent`, `ReactiveFormsModule`

---

## Article Reusable Components

### ArticleListComponent

- **File:** `src/app/features/article/components/article-list.component.ts`
- **What it does:** A paginated list of article cards. Handles loading state, empty state ("No articles here"), and pagination. Used on the home page and profile page.
- **Key dependencies:** `ArticlesService`, `ArticlePreviewComponent`

### ArticlePreviewComponent

- **File:** `src/app/features/article/components/article-preview.component.ts`
- **What it does:** A single article card showing title, description, author, date, tags, and a favorite count. Clicking the heart icon favorites/unfavorites the article.
- **Key dependencies:** `ArticlesService`, `UserService`, `FavoriteButtonComponent`, `RouterLink`

### ArticleMetaComponent

- **File:** `src/app/features/article/components/article-meta.component.ts`
- **What it does:** A small block showing the article author's avatar, name, and the publish date. Used at the top and bottom of the full article page. The action buttons (favorite, follow) are slotted in next to it.
- **Key dependencies:** `DefaultImagePipe`, `RouterLink`

### ArticleCommentComponent

- **File:** `src/app/features/article/components/article-comment.component.ts`
- **What it does:** A single comment card with body text, author info, and date. Shows a delete button only if the logged-in user is the comment's author.
- **Key dependencies:** `UserService`, `DefaultImagePipe`

### FavoriteButtonComponent

- **File:** `src/app/features/article/components/favorite-button.component.ts`
- **What it does:** The heart/favorite button. Calls the API to favorite or unfavorite an article. If the user is not logged in, it redirects them to the register page instead.
- **Key dependencies:** `ArticlesService`, `UserService`, `Router`

---

## Profile Pages

### ProfileComponent

- **File:** `src/app/features/profile/pages/profile/profile.component.ts`
- **What it does:** The user profile page shell. Shows the user's bio, avatar, and either a "Follow" button (for other users' profiles) or an "Edit Settings" button (for the current user's own profile). Has tabs for Articles and Favorites.
- **Key dependencies:** `ProfileService`, `UserService`, `FollowButtonComponent`, `RouterOutlet`, `RouterLink`

### ProfileArticlesComponent

- **File:** `src/app/features/profile/components/profile-articles.component.ts`
- **What it does:** The "My Articles" tab on a profile page. Fetches and displays articles written by that user.
- **Key dependencies:** `ArticlesService`, `ArticleListComponent`

### ProfileFavoritesComponent

- **File:** `src/app/features/profile/components/profile-favorites.component.ts`
- **What it does:** The "Favorited Articles" tab on a profile page. Fetches and displays articles that user has favorited.
- **Key dependencies:** `ArticlesService`, `ArticleListComponent`

### FollowButtonComponent

- **File:** `src/app/features/profile/components/follow-button.component.ts`
- **What it does:** The Follow/Unfollow button on a profile page. Calls the API to follow or unfollow. Redirects to login if not authenticated.
- **Key dependencies:** `ProfileService`, `UserService`, `Router`

---

## Settings Page

### SettingsComponent

- **File:** `src/app/features/settings/settings.component.ts`
- **What it does:** The account settings page. Pre-fills a form with the current user's details (image URL, username, bio, email, password). On save, calls the update API. Also has a "Log Out" button.
- **Key dependencies:** `UserService`, `ListErrorsComponent`, `ReactiveFormsModule`

---

## Shared Components

### ListErrorsComponent

- **File:** `src/app/shared/components/list-errors.component.ts`
- **What it does:** A simple error display box. Takes an errors object and renders the messages as a bulleted list. Used below forms when validation or API errors occur.
- **Key dependencies:** None

---

## Services

### UserService

- **File:** `src/app/core/auth/services/user.service.ts`
- **What it does:** The central authentication service. Tracks whether the user is logged in, stores their info, and provides `login()`, `register()`, `logout()`, and `update()` methods. Also handles token persistence in localStorage and retries if the auth server is temporarily unavailable.
- **Used by:** Almost every component that needs to know the current user

### JwtService

- **File:** `src/app/core/auth/services/jwt.service.ts`
- **What it does:** A thin wrapper around `localStorage` for reading, writing, and deleting the JWT auth token. Has three methods: `getToken()`, `saveToken()`, `destroyToken()`.
- **Used by:** `UserService`, `tokenInterceptor`

### ArticlesService

- **File:** `src/app/features/article/services/articles.service.ts`
- **What it does:** All API calls related to articles — list, get, create, update, delete, favorite, unfavorite.
- **Used by:** `HomeComponent`, `ArticleComponent`, `EditorComponent`, `ArticleListComponent`, `ArticlePreviewComponent`, `FavoriteButtonComponent`

### CommentsService

- **File:** `src/app/features/article/services/comments.service.ts`
- **What it does:** API calls for article comments — get all, add one, delete one.
- **Used by:** `ArticleComponent`

### TagsService

- **File:** `src/app/features/article/services/tags.service.ts`
- **What it does:** Fetches the list of popular tags from the API. Single method: `getAll()`.
- **Used by:** `HomeComponent`

### ProfileService

- **File:** `src/app/features/profile/services/profile.service.ts`
- **What it does:** API calls for user profiles — get a profile, follow a user, unfollow a user.
- **Used by:** `ProfileComponent`, `FollowButtonComponent`, `ArticleComponent`

---

## HTTP Interceptors (global request/response handlers)

### apiInterceptor

- **File:** `src/app/core/interceptors/api.interceptor.ts`
- **What it does:** Automatically prepends `https://api.realworld.show/api` to every HTTP request URL so services don't need to hard-code the base URL.

### tokenInterceptor

- **File:** `src/app/core/interceptors/token.interceptor.ts`
- **What it does:** Automatically adds the `Authorization: Token <jwt>` header to every HTTP request when the user is logged in.

### errorInterceptor

- **File:** `src/app/core/interceptors/error.interceptor.ts`
- **What it does:** Global error handler for all HTTP responses. On a 401 Unauthorized response, it logs the user out. Normalizes all error shapes so the rest of the app receives a consistent error format.

---

## Pipes and Directives

### DefaultImagePipe

- **File:** `src/app/shared/pipes/default-image.pipe.ts`
- **What it does:** A template helper that returns a fallback avatar image (`/assets/default-avatar.svg`) when a user's profile image is `null` or missing.

### MarkdownPipe

- **File:** `src/app/shared/pipes/markdown.pipe.ts`
- **What it does:** Converts a Markdown string into safe HTML. Used to render article body content. Dynamically loads the `marked` library to keep the initial bundle small.

### IfAuthenticatedDirective

- **File:** `src/app/core/auth/if-authenticated.directive.ts`
- **What it does:** A structural directive (like Angular's `*ngIf`) that shows or hides elements based on whether the user is logged in. `[ifAuthenticated]="true"` = show when logged in; `[ifAuthenticated]="false"` = show when logged out.
- **Used by:** `ArticleComponent`, `ArticleCommentComponent`

---

## Data Models (TypeScript interfaces)

| Interface           | File                                                           | Shape                                                                            |
| ------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `User`              | `src/app/core/auth/user.model.ts`                              | `{ email, token, username, bio, image }`                                         |
| `Article`           | `src/app/features/article/models/article.model.ts`             | `{ slug, title, description, body, tagList, favorited, favoritesCount, author }` |
| `Comment`           | `src/app/features/article/models/comment.model.ts`             | `{ id, body, createdAt, author }`                                                |
| `Profile`           | `src/app/features/profile/models/profile.model.ts`             | `{ username, bio, image, following }`                                            |
| `ArticleListConfig` | `src/app/features/article/models/article-list-config.model.ts` | `{ type, filters: { tag?, author?, favorited?, limit?, offset? } }`              |
| `Errors`            | `src/app/core/models/errors.model.ts`                          | `{ errors: { [key: string]: string } }`                                          |
