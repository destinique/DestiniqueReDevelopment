# Blog post details (-style) implementation guide

This guide explains how to redesign the **single blog post details page** to look/behave similar to Newsroom article pages, and how to prevent **WordPress/Elementor HTML content** from breaking when rendered inside Angular.

It also outlines how to add **share** options (copy link + social share) without needing backend changes.

---

## 1) What we’re building (target UX)

### Page structure (recommended)
- **Article header**
  - Category / date / reading time
  - Title (large)
  - Optional excerpt (dek)
  - Hero image
- **Article body**
  - Desktop: **sticky share rail** (left), article content (center), optional related posts (right)
  - Mobile: share actions collapse into a **single share button** (or inline row)
- **Footer**
  - Tags / author (optional)
  - Next/previous post links (optional)

### Layout rules (like)
- **Reading width**: keep the main content column around **720–780px** max
- **Typography**: line-height ~ **1.6–1.8**, consistent heading scale
- **Whitespace**: generous vertical spacing between sections

---

## 2) Why Elementor content breaks in Angular (common causes)

Elementor outputs HTML that assumes Elementor’s CSS/JS and theme styles. When rendered in Angular, you may see:
- **Overflow / horizontal scroll** (fixed widths, negative margins, absolute positioned sections)
- **Columns not stacking correctly** (Elementor grid classes missing)
- **Images/iframes overflowing** (hardcoded sizes)
- **Unexpected spacing** (inline styles + Elementor wrappers)
- **Inline `<style>` blocks or classes** affecting layout

**Recommendation:** render the post body, but add a **normalization layer** and sanitize content (sections 4–6).

---

## 3) Implementation plan (high-level steps)

1. **Audit current implementation**
   - Find the single post page component (likely `src/app/blog/pages/blog-post/`)
   - Identify how `post.content.rendered` is displayed (e.g. `[innerHTML]`)
2. Implement an **-style layout shell**
   - Header + body rails + footer
3. Add a **sanitization pipeline** for WP HTML
4. Add **scoped normalization CSS** so Elementor content can’t break the container
5. Add **share actions** (copy link + social share)
6. Test with multiple “problem” posts and iterate normalization overrides

---

## 4) Sanitization (security requirement)

When binding WP HTML into Angular, never trust the HTML as-is.

### Recommended approach
- Use **DOMPurify** to sanitize the HTML before rendering.
- Allow only required tags/attributes (e.g., `p`, `h2`, `h3`, `ul`, `ol`, `li`, `img`, `a`, `blockquote`, `figure`, `figcaption`, `iframe` if you allow embeds).
- Disallow:
  - `<script>`
  - `on*` event handler attributes
  - `javascript:` URLs

### Embeds
If you allow `iframe`, restrict to trusted hosts (e.g., YouTube/Vimeo) and remove everything else.

---

## 5) “Normalization layer” (fix broken layouts)

Wrap the rendered HTML inside a container like:
- `.blog-article-content`

Then add CSS scoped to that container to prevent overflow and normalize spacing.

### Minimum CSS rules (recommended)
- **Images**
  - `img { max-width: 100%; height: auto; }`
- **Media / embeds**
  - `iframe, video { max-width: 100%; }`
  - Consider an aspect ratio wrapper for iframes (16:9)
- **Tables**
  - Make tables horizontally scrollable:
    - `table { width: 100%; border-collapse: collapse; }`
    - Wrap with `overflow-x: auto` (recommended) or use `display:block`
- **Code blocks**
  - `pre { overflow-x: auto; }`
- **Headings + paragraphs**
  - Normalize margins so Elementor spacing doesn’t look random

### Neutralizing Elementor-specific layout wrappers
If you see overflow from Elementor wrappers, add overrides like:
- Force `max-width: 100%` and remove fixed widths:
  - `.blog-article-content [class*="elementor"] { max-width: 100% !important; }`
- Prevent layout breakouts:
  - `.blog-article-content :where(img, iframe, table, pre) { max-width: 100%; }`

**Important:** Keep overrides scoped to the article content container so you don’t break the rest of the app.

---

## 6) Share actions (no backend needed)

Share actions can be generated from the current page URL and article title.

### Copy link
- Use `navigator.clipboard.writeText(url)`
- Show a toast/snackbar or inline “Copied!” feedback

### Social share URLs
Assume:
- `title`: article title (plain text)
- `url`: current page URL

Build links:
- WhatsApp:
  - `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
- Facebook:
  - `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
- X (Twitter):
  - `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
- LinkedIn:
  - `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
- Email:
  - `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`

### UX patterns
- Desktop: sticky vertical share rail beside content
- Mobile: fixed “Share” button (bottom/right) opens a small share sheet (or inline row)

---

## 7) Optional-like enhancements

### Reading time
- Strip HTML to text, compute words
- Estimate: `minutes = ceil(words / 225)`

### Table of contents (TOC)
- After sanitization, parse `h2/h3`
- Generate anchors and a TOC list

### Scroll progress
- A thin progress bar at top or in the share rail

---

## 8) Testing checklist (important)

Test at least:
- A normal Gutenberg-style post
- A heavy Elementor post (multiple columns/sections)
- A post with iframes (YouTube/Vimeo)
- A post with tables

Check:
- No horizontal overflow
- Images and iframes never exceed container
- Headings/paragraph spacing looks consistent
- Share links open correctly and copy-link works

---

## 9) Project-specific pointers (this repo)

Blog module files are under:
- `src/app/blog/`

Likely single post page location:
- `src/app/blog/pages/blog-post/`

Routing:
- `src/app/blog/blog-routing.module.ts`

WordPress API service:
- `src/app/blog/services/wp-blog.service.ts`

---

## Next step

When you give the “GO” sign, implement:
- -like post layout shell
- Sanitized rendering of WP content
- Scoped normalization CSS for Elementor HTML
- Share rail + mobile share UX

