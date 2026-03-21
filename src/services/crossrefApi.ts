import { CrossrefResponseSchema } from '@/schemas/crossref';
import type { CrossrefResponse } from '@/schemas/crossref';

export const ROWS_PER_FETCH = 20;

export type FetchWorksParams = {
  query: string;
  cursor: string;
  rows?: number;
};

export async function fetchWorks(params: FetchWorksParams): Promise<CrossrefResponse> {
  const { query, cursor, rows = ROWS_PER_FETCH } = params;
  const facet = 'type-name:*,published:10';

  const searchParams = new URLSearchParams();
  searchParams.set('query', query);
  searchParams.set('cursor', cursor || '*');
  searchParams.set('facet', facet);
  searchParams.set('rows', String(rows));

  const url = new URL('https://api.crossref.org/works');
  url.search = searchParams.toString();

  const res = await fetch(url.toString());
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    const err = new Error(`Crossref request failed (${res.status}): ${bodyText}`);
    throw err;
  }
  const json = await res.json();
  const parsed = CrossrefResponseSchema.parse(json);

  return parsed;
}
