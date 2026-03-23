<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { useSearch } from '@/composables/useSearch';
import SearchBar from '@/components/SearchBar.vue';
import ResultList from '@/components/ResultList.vue';
import FacetPanel from '@/components/FacetPanel.vue';
import PaginationBar from '@/components/PaginationBar.vue';

const {
  activeTypes,
  activeYears,
  query,
  currentPage,
  canGoForward,
  setQuery,
  isLoading,
  isError,
  error,
  items,
  facets,
  toggleType,
  toggleYear,
  goToPage,
  totalResults,
  totalPages,
  canGoBack,
  visiblePages,
} = useSearch();

const debouncedQuery = ref(query.value);
let timer: ReturnType<typeof setTimeout> | null = null;

watch(
  query,
  (next) => {
    debouncedQuery.value = next;
  },
  { immediate: true },
);

const onUpdateQuery = (next: string) => {
  debouncedQuery.value = next;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    setQuery(next);
  }, 500);
};

const onToggleType = (type: string) => {
  toggleType(type);
};

const onToggleYear = (year: string) => {
  toggleYear(year);
};

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-8">
    <SearchBar
      :query="debouncedQuery"
      @update:query="onUpdateQuery"
    />
    <div class="layout mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
      <aside class="md:col-span-1">
        <FacetPanel
          :facets="facets"
          :active-types="activeTypes"
          :active-years="activeYears"
          :is-loading="isLoading"
          @toggle-type="onToggleType"
          @toggle-year="onToggleYear"
        />
      </aside>
      <section class="md:col-span-3">
        <div
          v-if="query"
          aria-live="polite"
          class="mb-3 text-sm text-slate-700"
        >
          {{ totalResults.toLocaleString() }} results
        </div>

        <div
          v-if="isError"
          class="rounded border border-red-200 bg-red-50 p-4 text-red-700"
          role="alert"
        >
          Error loading results.
          <span v-if="error instanceof Error"> {{ error.message }}</span>
        </div>

        <div v-else>
          <ResultList
            v-if="query"
            :items="items"
            :is-loading="isLoading"
          />

          <PaginationBar
            v-if="query"
            :page="currentPage"
            :total-pages="totalPages"
            :is-loading="isLoading"
            :can-go-back="canGoBack"
            :can-go-forward="canGoForward"
            :visible-pages="visiblePages"
            @prev="goToPage(currentPage - 1)"
            @next="goToPage(currentPage + 1)"
            @page="goToPage"
          />

          <p
            v-if="!query"
            class="rounded border border-slate-200 bg-slate-50 p-4 text-slate-700"
          >
            Enter a search term to begin
          </p>
        </div>
      </section>
    </div>
  </main>
</template>
