import { CrossrefResponseSchema } from '@/schemas/crossref';
import type { CrossrefResponse } from '@/schemas/crossref';
import { yearToRange } from '@/helpers/transformers';

export const ROWS_PER_PAGE = 20; // items shown per UI page
export const ROWS_PER_FETCH = 200;

export type WorksFilters = {
  types: string[];
  years: string[];
};

export type FetchWorksParams = {
  query: string;
  cursor: string;
  filters: WorksFilters;
  rows?: number;
  signal?: AbortSignal;
};

export async function fetchWorks(params: FetchWorksParams): Promise<CrossrefResponse> {
  const { query, filters, cursor, rows = ROWS_PER_FETCH, signal } = params;

  const facet = 'type-name:*,published:10';

  const selectedTypes = filters.types.filter(Boolean);
  const selectedYears = filters.years.filter(Boolean);

  const yearNums = selectedYears
    .map((y) => Number(y))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  const minYear = yearNums.length ? String(yearNums[0]) : null;
  const maxYear = yearNums.length ? String(yearNums[yearNums.length - 1]) : null;

  const searchParams = new URLSearchParams();
  searchParams.set('query', query);
  searchParams.set('cursor', cursor || '*');
  searchParams.set('facet', facet);
  searchParams.set('rows', String(rows));

  const filterParts: string[] = [];

  for (const t of selectedTypes) {
    filterParts.push(`type-name:${t}`);
  }

  if (minYear && maxYear) {
    const { from, until } = yearToRange(minYear, maxYear);

    filterParts.push(`from-pub-date:${from}`);
    filterParts.push(`until-pub-date:${until}`);
  }

  if (filterParts.length > 0) {
    searchParams.set('filter', filterParts.join(','));
  }

  const url = new URL('https://api.crossref.org/works');
  url.search = searchParams.toString();

  const res = await fetch(url.toString(), {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    const err = new Error(`Crossref request failed (${res.status}): ${bodyText}`);
    (err as { status?: number }).status = res.status;
    throw err;
  }

  const json = await res.json();
  const parsed = CrossrefResponseSchema.parse(json);

  if (selectedYears.length > 0) {
    const selectedYearSet = new Set(selectedYears);
    parsed.message.items = parsed.message.items.filter((item) =>
      selectedYearSet.has(item.published),
    );

    const publishedFacet = parsed.message.facets?.published ?? [];
    const computedTotal = publishedFacet
      .filter((b) => selectedYearSet.has(b.value))
      .reduce((sum, b) => sum + b.count, 0);

    if (Number.isFinite(computedTotal) && computedTotal > 0) {
      parsed.message['total-results'] = computedTotal;
    }
  }

  return parsed;
}
