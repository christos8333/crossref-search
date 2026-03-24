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

## First 2 Hours

In the first two hours, I prioritized system architecture and data integrity.

I started by reading the Crossref API docs to understand cursor pagination and facet behavior. While researching the most efficient way to handle large-scale pagination, I used Crossref's cursor tutorial to evaluate how to navigate to [page cursor-based-pagination](https://crossref.gitlab.io/tutorials/cursor-based-pagination/) reliably with incremental fetching.

Also, I evaluated whether TanStack Query was the right fit for server-state management and started implementing the Zod schemas and mappers to ensure the API data were validated and normalized before reaching the UI.

## Out of Scope / Future Improvements

The current implementation prioritizes correctness of search, filters, and pagination. The items below are intentionally out of scope for now, and are good candidates for future iterations:

- Performance optimization for sparse multi-year selections (reduce over-fetching from range-based cursor queries plus client-side year filtering).
- Performance optimization for rapid pagination clicks: when users navigate quickly, in-flight prefetch requests for the same batch can be canceled and restarted. Add an outer in-flight guard to deduplicate batch fetches, prevent unnecessary cancellations, and avoid duplicate requests.
- Additional sort modes (for example relevance/newest/oldest) with clear compatibility rules for cursor pagination.
- Broader facet support (more Crossref facet families, larger year windows, and clearer handling of selected values with zero results).
- Stronger API resilience (retry/backoff strategy, richer error categories, and clear user-facing recovery messaging).
- Expanded testing surface (component-level tests for facet panel and pagination interactions, plus integration tests for URL-state restoration).
- Filter persistence confirmation flow: when users have active filters (`years`, `types`, etc.) and submit a new search query, prompt them to keep existing filters or reset filters before running the search.
- Saved searches / sharable presets for common filter combinations.
- Lightweight observability (request timing, error-rate tracking, and fetch volume metrics).
