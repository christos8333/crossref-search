import { CrossrefResponseSchema } from '@/schemas/crossref';
import type { CrossrefResponse } from '@/schemas/crossref';

export const ROWS_PER_PAGE = 20; // items shown per UI page
export const ROWS_PER_FETCH = 20;

export type WorksFilters = {
  types: string[];
  years: string[];
};

export type FetchWorksParams = {
  query: string;
  cursor: string;
  filters: WorksFilters;
  rows?: number;
};

export async function fetchWorks(params: FetchWorksParams): Promise<CrossrefResponse> {
  const { query, cursor, filters, rows = ROWS_PER_FETCH } = params;
  const facet = 'type-name:*,published:10';

  const selectedTypes = filters.types.filter(Boolean);
  const selectedYears = filters.years.filter(Boolean);

  const searchParams = new URLSearchParams();
  searchParams.set('query', query);
  searchParams.set('cursor', cursor || '*');
  searchParams.set('facet', facet);
  searchParams.set('rows', String(rows));

  const filterParts: string[] = [];

  for (const t of selectedTypes) {
    filterParts.push(`type-name:${t}`);
  }

  for (const t of selectedYears) {
    filterParts.push(`from-pub-date:${t}`);
  }

  if (filterParts.length > 0) {
    searchParams.set('filter', filterParts.join(','));
  }

  const url = new URL('https://api.crossref.org/works');
  url.search = searchParams.toString();

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    const err = new Error(`Crossref request failed (${res.status}): ${bodyText}`);
    throw err;
  }
  const json = await res.json();
  const parsed = CrossrefResponseSchema.parse(json);

  return parsed;
}
