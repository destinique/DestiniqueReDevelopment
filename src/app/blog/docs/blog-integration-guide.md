# Destinique Angular — WordPress Blog Integration Guide

## Goal

Use `https://blog.destinique.com/` only for content management, but **render the blog inside this Angular app** at **`/blog`** (and post detail at **`/blog/:slug`**) using the **WordPress REST API**.

Key constraint: blog must be **self-contained** under `src/app/blog/` and **must not affect other modules/services**, except:

- It plugs into routing (`/blog/...`)
- It uses the existing global layout (header/footer already live in `app.component.html`)

## What I observed in this repo (important for your implementation)

- **Angular 15** with **lazy-loaded feature modules** (see `src/app/app-routing.module.ts`).
- Global layout is handled in `src/app/app.component.html`:
  - `<app-navbar>` (header)
  - `<router-outlet>`
  - `<app-dest-footer>`
- The app already uses `HttpClientModule` in `AppModule` (`src/app/app.module.ts`).
- Project supports **SSR and prerender** (`@nguniversal` + `ng run ...:prerender` in `package.json` / `angular.json`).

Implication: make the blog module lazy-loaded and SSR-safe (no direct `window` usage without platform guards).

## Target folder structure

Create a dedicated feature module folder:

```
src/app/blog/
  blog.module.ts
  blog-routing.module.ts
  pages/
    blog-list/
      blog-list.component.ts|html|scss
    blog-post/
      blog-post.component.ts|html|scss
  components/
    post-card/
      post-card.component.ts|html|scss
    pagination/ (optional)
  services/
    wp-blog.service.ts
  models/
    wp-post.model.ts
    wp-media.model.ts (optional)
    wp-category.model.ts (optional)
  utils/
    wp-html.util.ts (optional)
```

This keeps the blog isolated and easy to remove/upgrade later.

## Step-by-step implementation checklist

### 1) Confirm WordPress REST API requirements

You’ll use endpoints like:

- **Posts**: `GET /wp-json/wp/v2/posts`
- **Single post by slug**: `GET /wp-json/wp/v2/posts?slug={slug}`
- **Categories** (optional): `GET /wp-json/wp/v2/categories`
- **Featured media** (optional): `GET /wp-json/wp/v2/media/{id}`

Recommended REST query options:

- `per_page`, `page` for pagination
- `_embed=1` to include featured images/author info in one call
- `search=` for blog search
- `categories=` for filtering

**CORS**: your Angular domain (`destinique.com`) must be allowed by the WordPress origin. If WordPress blocks it, you’ll need a CORS rule/plugin on `blog.destinique.com` or a server-side proxy.

### 2) Add environment config for the WP base URL

Add a value to:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Example:

- `wpBlogBaseUrl: 'https://blog.destinique.com'`

Why: keep the blog host configurable per environment and avoid hardcoding URLs in services.

### 3) Create the blog feature module + lazy route

Create:

- `src/app/blog/blog.module.ts`
- `src/app/blog/blog-routing.module.ts`

Routes inside `BlogRoutingModule`:

- `path: ''` → Blog list page
- `path: ':slug'` → Blog detail page

Then register lazy-loading in `src/app/app-routing.module.ts`:

- Add a new route:
  - `path: 'blog'`
  - `loadChildren: () => import('./blog/blog.module').then(m => m.BlogModule)`

This matches the repo’s existing approach for `home`, `properties`, etc.

### 4) Implement a WordPress API service inside `src/app/blog/services/`

Create `WpBlogService` that:

- Uses Angular `HttpClient`
- Uses the env `wpBlogBaseUrl`
- Provides:
  - `getPosts(page, perPage, search?, categoryId?)`
  - `getPostBySlug(slug)`

Implementation notes:

- Use `_embed=1` when listing posts so you can render featured image without extra calls.
- Read response headers for pagination:
  - `X-WP-Total`
  - `X-WP-TotalPages`
- Use `observe: 'response'` so you can read headers.
- Add `shareReplay(1)` where it’s helpful (e.g., when multiple components subscribe).

### 5) Build the Blog list page (`/blog`)

`BlogListComponent` should support:

- Pagination (page/perPage)
- Optional category filter
- Optional search box

Suggested UI output per post:

- Title
- Date (format)
- Excerpt (WP returns HTML excerpt)
- Featured image (from `_embedded['wp:featuredmedia'][0].source_url`)
- “Read more” link to `/blog/{slug}`

### 6) Build the Blog detail page (`/blog/:slug`)

`BlogPostComponent` should:

- Read `slug` from route params
- Call `getPostBySlug(slug)`
- Render:
  - Title
  - Published date
  - Featured image (optional)
  - Content HTML (`post.content.rendered`)

**HTML safety**:

- WordPress returns HTML strings. Angular will sanitize a lot automatically when binding `[innerHTML]`, but you should still be deliberate:
  - Prefer binding `[innerHTML]="post.content.rendered"` (Angular sanitizes).
  - Avoid `bypassSecurityTrustHtml` unless you fully trust content (it disables sanitization).
  - If you need custom transforms (e.g. add `rel="nofollow noopener"` to external links), do it in a small utility function that rewrites HTML.

### 7) SEO/meta + canonical (recommended)

Because this app has SSR/prerender, you can improve SEO:

- Use `Title` + `Meta` services in the blog pages:
  - Set page title to post title (and list page title for `/blog`)
  - Set description from excerpt (strip HTML)
- If WordPress SEO plugin exposes metadata via REST, optionally consume it later.

Canonical URL plan:

- Canonical should be `https://destinique.com/blog/{slug}` (not the WordPress subdomain), since that’s the public page you want indexed.

### 8) Styling + assets

Keep blog styles scoped under:

- `src/app/blog/**.scss`

Do not alter global `styles.scss` unless you truly need shared typography changes.

### 9) Error handling + UX

For both list and detail:

- Show a loading state (spinner or skeleton)
- Handle “no post found for slug” gracefully (show a friendly message + link back to `/blog`)
- Handle network failures

### 10) SSR/prerender considerations (important in this repo)

Because SSR exists:

- Avoid direct `window`, `document`, `localStorage` usage inside blog components/services.
- If you must use them (e.g., share buttons), guard with `isPlatformBrowser`.
- Prefer API calls that can run on the server (plain HTTP requests are fine).

If you plan to prerender blog routes:

- You must decide how routes are discovered (since posts are dynamic).
- Options:
  - Don’t prerender blog detail pages; only SSR them on-demand.
  - Build a prerender list dynamically in CI (fetch slugs and pass routes).

### 11) WordPress-side setup checklist

On `blog.destinique.com`:

- Confirm REST is enabled (default in WP).
- Ensure posts are public and accessible.
- Ensure CORS allows `https://destinique.com` (or your Angular host).
- Ensure permalinks/slugs are stable.
- Optional: install/configure a plugin to expose SEO/meta via REST if you want richer SEO fields.

## Suggested milestones (so you can ship safely)

- **Milestone A**: `/blog` list page working with basic title/excerpt + pagination.
- **Milestone B**: `/blog/:slug` detail page renders content + featured image.
- **Milestone C**: SEO meta tags + canonical + nicer UI.
- **Milestone D**: Category filter + search + caching.

## Notes specific to “standalone and non-impacting”

- Keep everything under `src/app/blog/` (components/services/models).
- Only touch global files to:
  - Add lazy route in `app-routing.module.ts`
  - Add one environment variable for WP base URL
- Do not reuse existing “CRUD” services (`CrudService`) because those are tied to `api.destinique.com` and would couple concerns.

