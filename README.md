# Crossref Search

Crossref Search is a Vue 3 single-page application for searching Crossref works with faceted filters (record type and publication year), cursor-based pagination, and URL-driven state. The data layer is powered by TanStack Vue Query (`useInfiniteQuery`) for cache-aware fetching, incremental page loading, and cancellation support via `AbortSignal`.

## Setup

```bash
npm install
```

## Scripts

| Command              | Description                |
| -------------------- | -------------------------- |
| `npm run dev`        | Start dev server           |
| `npm run build`      | Production build           |
| `npm run preview`    | Preview production build   |
| `npm run test`       | Run unit tests (Vitest)    |
| `npm run test:watch` | Unit tests in watch mode   |
| `npm run test:e2e`   | Run E2E tests (Playwright) |
| `npm run lint`       | Lint and fix               |

## Tech stack

- Vue 3 (Composition API, `<script setup>`)
- TypeScript
- Vite
- Vue Router
- @tanstack/vue-query (server-state fetching, caching, infinite cursor pagination)
- Zod (runtime response validation and normalization)
- Tailwind CSS (via `@tailwindcss/vite`)
- Vitest (unit)
- Playwright (E2E)

## Technical Description

The app is organized around three core layers:

- `src/services/crossrefApi.ts`: builds Crossref API requests, applies min/max year range filters, executes fetches, and performs year post-filtering on returned items.
- `src/schemas/crossref.ts`: validates and transforms raw API payloads into stable UI-facing models.
- `src/composables/useSearch.ts`: orchestrates query state from the route, infinite fetching via Vue Query, facet behavior, and UI pagination for fetched data.

## Technical Notes

- Pagination uses Crossref cursoring: `cursor=*` for the first fetch, then `next-cursor` from each response for subsequent fetches.
- `ROWS_PER_FETCH = 200` and `ROWS_PER_PAGE = 20`; moving between pages within already-fetched rows does not require a new request.
- Year filtering is applied client-side after each fetch (Crossref does not support OR-style year filters directly). `total-results` is recomputed from matching published facet buckets.
- Facets keep a baseline snapshot from the unfiltered response, while counts are merged with the current response for active filters.
- Search state is URL-driven (`query`, `types`, `years`) so filters and query are shareable and restorable on reload.
- Zod `transform()` normalizes raw Crossref data into UI-ready data.
- Query behavior uses TanStack Query infinite-query features: cache keys are derived from `q/types/years`, cached data is reused until invalidated, and in-flight requests are cancelable through propagated abort signals.

## Accessibility

- Pagination controls provide descriptive accessible names:
  - Previous/next buttons use explicit labels (`Go to previous page`, `Go to next page`).
  - Numbered page buttons expose labels in the form `Go to page N`.
- The active page button is exposed to assistive technology with `aria-current="page"` while remaining `disabled` to prevent redundant re-selection.
- Result count updates are announced through polite live regions so screen-reader users receive loading and completion context.

## Testing Scope

- Schema tests verify Zod parsing, transforms, defaults, and validation failures.
- Service tests verify URL construction, error handling, and year post-filtering semantics.
