import { computed, ref, watch } from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';
import { useInfiniteQuery, useQueryClient } from '@tanstack/vue-query';
import { fetchWorks, ROWS_PER_PAGE } from '@/services/crossrefApi';
import type { CrossrefResponse, Facets, Work, FacetBucket } from '@/schemas/crossref';
import { parseCommaList } from '@/helpers/transformers';

type CursorValue = string;

export function useSearch() {
  const route = useRoute();
  const router = useRouter();

  const query = computed(() => {
    const q = route.query.q;
    if (typeof q === 'string') return q;
    if (Array.isArray(q)) return q[0] ?? '';
    return '';
  });

  const activeTypes = computed(() => parseCommaList(route.query.types));
  const activeYears = computed(() => parseCommaList(route.query.years));

  const queryEnabled = computed(() => query.value.trim().length > 0);

  const queryClient = useQueryClient();

  const queryKey = computed(
    () => ['works', query.value, activeTypes.value, activeYears.value] as const,
  );

  const currentPage = ref(1);
  const isCursorExpired = ref(false);

  const queryResult = useInfiniteQuery({
    queryKey,
    initialPageParam: '*' as CursorValue,
    getNextPageParam: (lastPage: CrossrefResponse) => lastPage.message['next-cursor'] ?? undefined,
    queryFn: async ({ pageParam, signal }) => {
      return await fetchWorks({
        query: query.value,
        filters: { types: activeTypes.value, years: activeYears.value },
        cursor: pageParam as CursorValue,
        signal,
      });
    },

    enabled: queryEnabled,
    retry: (failureCount, err) => {
      const status = (err as { status?: number }).status;
      if (status === 429 || status === 404) return false;
      return failureCount < 3;
    },
    staleTime: 60 * 60 * 1000,
  });

  const flatItems = computed<Work[]>(() => {
    const pages = queryResult.data.value?.pages as CrossrefResponse[] | undefined;
    return pages?.flatMap((page) => page.message.items) ?? [];
  });

  const items = computed<Work[]>(() => {
    const start = (currentPage.value - 1) * ROWS_PER_PAGE;
    const end = currentPage.value * ROWS_PER_PAGE;
    return flatItems.value.slice(start, end);
  });

  const baselineFacets = ref<Facets>({
    'type-name': [],
    published: [],
  });

  watch(
    query,
    () => {
      baselineFacets.value = { 'type-name': [], published: [] };
    },
    { immediate: true },
  );

  const currentFacets = computed<Facets>(() => {
    const pages = queryResult.data.value?.pages as CrossrefResponse[] | undefined;
    const firstPage = pages?.[0];
    return firstPage?.message.facets ?? { 'type-name': [], published: [] };
  });

  watch(
    currentFacets,
    (next) => {
      if (!next) return;
      if (activeTypes.value.length === 0) {
        baselineFacets.value['type-name'] = next['type-name'];
      }
      if (activeYears.value.length === 0) {
        baselineFacets.value.published = next.published;
      }
    },
    { deep: true },
  );

  const facets = computed<Facets>(() => {
    const typeFromBaseline = baselineFacets.value['type-name'];
    const yearFromBaseline = baselineFacets.value.published;

    if (typeFromBaseline.length === 0 && yearFromBaseline.length === 0) {
      return currentFacets.value;
    }

    const currentTypeMap = new Map(
      currentFacets.value['type-name'].map((b) => [b.value, b.count] as const),
    );
    const currentYearMap = new Map(
      currentFacets.value.published.map((b) => [b.value, b.count] as const),
    );

    const mergedTypes: FacetBucket[] =
      typeFromBaseline.length > 0
        ? typeFromBaseline.map((b) => ({
            ...b,
            count: currentTypeMap.get(b.value) ?? b.count,
          }))
        : currentFacets.value['type-name'];

    const mergedYears: FacetBucket[] =
      yearFromBaseline.length > 0
        ? yearFromBaseline.map((b) => ({
            ...b,
            count: currentYearMap.get(b.value) ?? b.count,
          }))
        : currentFacets.value.published;

    return {
      'type-name': mergedTypes,
      published: mergedYears,
    };
  });

  const totalResults = computed<number>(() => {
    const pages = queryResult.data.value?.pages as CrossrefResponse[] | undefined;
    if (!pages?.length) return 0;
    return pages[0]?.message['total-results'] ?? 0;
  });

  const totalPages = computed<number>(() => {
    return Math.ceil(totalResults.value / ROWS_PER_PAGE);
  });

  const canGoBack = computed(() => currentPage.value > 1);
  const canGoForward = computed(() => currentPage.value < totalPages.value);

  const visiblePages = computed<number[]>(() => {
    if (totalPages.value <= 0) return [];
    const total = totalPages.value;
    if (currentPage.value <= 5) {
      const end = Math.min(10, total);
      return Array.from({ length: end }, (_, i) => i + 1);
    }
    const start = Math.max(1, currentPage.value - 4);
    const end = Math.min(total, currentPage.value + 5);
    const out: number[] = [];
    for (let p = start; p <= end; p++) out.push(p);
    return out;
  });

  const pushQuery = (changes: Record<string, string | undefined>) => {
    const nextQuery: LocationQueryRaw = {
      ...(route.query as LocationQueryRaw),
    };

    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined) {
        delete nextQuery[key];
      } else {
        nextQuery[key] = value;
      }
    }

    router.push({ query: nextQuery });
  };

  const setQuery = (q: string) => {
    currentPage.value = 1;
    pushQuery({
      q,
      types: undefined,
      years: undefined,
    });
  };

  const toggleType = (type: string) => {
    currentPage.value = 1;
    const next = new Set(activeTypes.value);
    if (next.has(type)) next.delete(type);
    else next.add(type);

    pushQuery({
      q: query.value,
      types: next.size > 0 ? Array.from(next).join(',') : undefined,
    });
  };

  const toggleYear = (year: string) => {
    currentPage.value = 1;

    const next = new Set(activeYears.value);
    if (next.has(year)) next.delete(year);
    else next.add(year);

    pushQuery({
      q: query.value,
      years: next.size > 0 ? Array.from(next).join(',') : undefined,
    });
  };

  const goToPage = async (n: number) => {
    const targetPage = Math.max(1, n);

    const prefetchEnd = targetPage <= 5 ? 10 : targetPage + 5;

    const lastPageToPrefetch =
      totalPages.value > 0 ? Math.min(prefetchEnd, totalPages.value) : prefetchEnd;
    const requiredItems = lastPageToPrefetch * ROWS_PER_PAGE;

    currentPage.value = targetPage;
    if (flatItems.value.length > requiredItems) return;

    while (
      flatItems.value.length <= requiredItems &&
      queryResult.hasNextPage.value !== false &&
      (totalResults.value === 0 || requiredItems <= totalResults.value)
    ) {
      try {
        await queryResult.fetchNextPage({ throwOnError: true });
        isCursorExpired.value = false;
      } catch (err) {
        const status = (err as { status?: number }).status;
        const isCursorExpiredStatus = status === 429 || status === 404;
        if (!isCursorExpiredStatus) break;

        isCursorExpired.value = true;
        queryClient.removeQueries({ queryKey: queryKey.value, exact: true });
      }
    }
  };

  watch(
    [query, activeTypes, activeYears],
    () => {
      currentPage.value = 1;
    },
    { immediate: true },
  );

  return {
    query,
    activeTypes,
    activeYears,
    facets,
    items,
    totalResults,
    isLoading: computed(() => {
      if (currentPage.value * ROWS_PER_PAGE <= flatItems.value.length) {
        return false;
      }
      return queryResult.isLoading.value || queryResult.isFetchingNextPage.value;
    }),
    isError: queryResult.isError,
    error: queryResult.error,
    currentPage,
    canGoForward,
    canGoBack,
    visiblePages,
    totalPages,
    setQuery,
    toggleType,
    toggleYear,
    goToPage,
  };
}
