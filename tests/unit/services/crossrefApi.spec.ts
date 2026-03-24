import { fetchWorks } from '@/services/crossrefApi';

function makeMockFetch(responseBody: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => responseBody,
  });
}

function makeValidResponse(overrides: Record<string, unknown> = {}) {
  return {
    status: 'ok',
    message: {
      items: [],
      facets: {},
      'next-cursor': null,
      'total-results': 0,
      ...overrides,
    },
  };
}

describe('fetchWorks', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = makeMockFetch(makeValidResponse());
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('URL construction', () => {
    it('should include query, facet in the URL', async () => {
      await fetchWorks({
        query: 'vue',
        cursor: '*',
        filters: { types: [], years: [] },
      });

      const urlStr = fetchMock.mock.calls[0]?.[0] as string;
      const url = new URL(urlStr);

      expect(url.searchParams.get('query')).toBe('vue');
      expect(url.searchParams.get('facet')).toBe('type-name:*,published:10');
    });

    it('should add type mame filter when types are selected', async () => {
      await fetchWorks({
        query: 'vue',
        cursor: '*',
        filters: { types: ['journal-article'], years: [] },
      });

      const urlStr = fetchMock.mock.calls[0]?.[0] as string;
      const url = new URL(urlStr);

      expect(url.searchParams.get('filter')).toBe('type-name:journal-article');
    });

    it('should add date range filter when years are selected', async () => {
      await fetchWorks({
        query: 'vue',
        cursor: '*',
        filters: { types: [], years: ['2020', '2021'] },
      });

      const urlStr = fetchMock.mock.calls[0]?.[0] as string;
      const url = new URL(urlStr);

      expect(url.searchParams.get('filter')).toBe(
        'from-pub-date:2020-01-01,until-pub-date:2021-12-31',
      );
    });

    it.each([404, 429])('should throw an error when response status is %i', async (status) => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status,
        text: async () => 'Cursor expired',
      });

      await expect(
        fetchWorks({
          query: 'vue',
          cursor: '*',
          filters: { types: [], years: [] },
        }),
      ).rejects.toThrow(String(status));
    });
  });

  describe('year post-filtering', () => {
    it('should filter items to only those matching selected years', async () => {
      const responseBody = makeValidResponse({
        items: [
          { published: { 'date-parts': [[2020]] } },
          { published: { 'date-parts': [[2021]] } },
        ],
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseBody,
      });

      const result = await fetchWorks({
        query: 'vue',
        cursor: '*',
        filters: { types: [], years: ['2020'] },
      });

      expect(result.message.items).toHaveLength(1);
      expect(result.message.items[0].published).toBe('2020');
    });

    it('should recompute total results from facet counts when years are filtered', async () => {
      const responseBody = makeValidResponse({
        facets: { published: { values: { '2020': 7, '2021': 3 } } },
        'total-results': 100,
        items: [],
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseBody,
      });

      const result = await fetchWorks({
        query: 'vue',
        cursor: '*',
        filters: { types: [], years: ['2020'] },
      });

      expect(result.message['total-results']).toBe(7);
    });
  });
});
