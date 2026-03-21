import { computed, ref, watch } from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';
import { fetchWorks } from '@/services/crossrefApi';
import type { CrossrefResponse, Facets } from '@/schemas/crossref';
import { parseCommaList } from '@/helpers/transformers';

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

  const items = ref<CrossrefResponse | null>(null);
  const isLoading = ref(false);
  watch(
    query,
    async (q) => {
      isLoading.value = true;
      try {
        items.value = await fetchWorks({ query: q, cursor: '*' });
        isLoading.value = false;
      } catch {
        items.value = null;
      }
    },
    { immediate: true },
  );

  const currentFacets = computed<Facets>(() => {
    console.log(items.value?.message.facets);
    return items.value?.message.facets ?? { 'type-name': [], published: [] };
  });

  const facets = computed<Facets>(() => {
    return {
      'type-name': currentFacets.value['type-name'],
      published: currentFacets.value.published,
    };
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
    pushQuery({
      q,
      types: undefined,
      years: undefined,
    });
  };

  const toggleType = (type: string) => {
    const next = new Set(activeTypes.value);
    if (next.has(type)) next.delete(type);
    else next.add(type);

    pushQuery({
      q: query.value,
      types: next.size > 0 ? Array.from(next).join(',') : undefined,
    });
  };

  const toggleYear = (year: string) => {
    const next = new Set(activeYears.value);
    if (next.has(year)) next.delete(year);
    else next.add(year);

    pushQuery({
      q: query.value,
      years: next.size > 0 ? Array.from(next).join(',') : undefined,
    });
  };

  return {
    query,
    activeTypes,
    activeYears,
    facets,
    items,
    isLoading,
    setQuery,
    toggleType,
    toggleYear,
  };
}
