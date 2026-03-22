import { computed, ref, watch } from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';
import { useInfiniteQuery } from '@tanstack/vue-query';
import { fetchWorks, ROWS_PER_PAGE } from '@/services/crossrefApi';
import type { CrossrefResponse, Facets, Work } from '@/schemas/crossref';
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

  const queryKey = computed(
    () => ['works', query.value, activeTypes.value, activeYears.value] as const,
  );

  const currentPage = ref(1);
  const cursorMap = ref<Map<number, string>>(new Map());

  const queryResult = useInfiniteQuery({
    queryKey,
    initialPageParam: '*' as CursorValue,
    getNextPageParam: (lastPage: CrossrefResponse) => lastPage.message['next-cursor'] ?? undefined,
    queryFn: async ({ pageParam }) => {
      return await fetchWorks({
        query: query.value,
        filters: { types: activeTypes.value, years: activeYears.value },
        cursor: pageParam as CursorValue,
      });
    },
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const flatItems = computed<Work[]>(() => {
    const pages = queryResult.data.value?.pages as CrossrefResponse[] | undefined;
    return pages?.flatMap((p) => p.message.items) ?? [];
  });

  const items = computed<Work[]>(() => {
    const start = (currentPage.value - 1) * ROWS_PER_PAGE;
    const end = currentPage.value * ROWS_PER_PAGE;
    return flatItems.value.slice(start, end);
  });

  const currentFacets = computed<Facets>(() => {
    const pages = queryResult.data.value?.pages as CrossrefResponse[] | undefined;
    const firstPage = pages?.[0];
    return firstPage?.message.facets ?? { 'type-name': [], published: [] };
  });

  const facets = computed<Facets>(() => {
    return {
      'type-name': currentFacets.value['type-name'],
      published: currentFacets.value.published,
    };
  });

  const totalResults = computed<number>(() => {
    const pages = queryResult.data.value?.pages as CrossrefResponse[] | undefined;
    return pages?.[0]?.message['total-results'] ?? 0;
  });

  const totalPages = computed<number>(() => {
    return Math.ceil(totalResults.value / ROWS_PER_PAGE);
  });

  const canGoForward = computed(() => currentPage.value < totalPages.value);

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
    cursorMap.value = new Map();
    pushQuery({
      q,
      types: undefined,
      years: undefined,
    });
  };

  const toggleType = (type: string) => {
    currentPage.value = 1;
    cursorMap.value = new Map();
    const next = new Set(activeTypes.value);
    if (next.has(type)) next.delete(type);
    else next.add(type);

    pushQuery({
      q: query.value,
      types: next.size > 0 ? Array.from(next).join(',') : undefined,
    });
  };

  const toggleYear = (year: string) => {
    cursorMap.value = new Map();
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
    currentPage.value = targetPage;
    await queryResult.fetchNextPage();
  };

  watch(
    [query, activeTypes, activeYears],
    () => {
      cursorMap.value = new Map();
    },
    { immediate: true },
  );

  return {
    query,
    activeTypes,
    activeYears,
    facets,
    items,
    isLoading: computed(() => queryResult.isLoading.value || queryResult.isFetchingNextPage.value),
    currentPage,
    canGoForward,
    setQuery,
    toggleType,
    toggleYear,
    goToPage,
  };
}
