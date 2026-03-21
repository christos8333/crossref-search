<script setup lang="ts">
import type { Work } from '@/schemas/crossref';

defineProps<{
  items: Work[];
  isLoading: boolean;
}>();
</script>

<template>
  <ul role="list" class="space-y-3">
    <template v-if="isLoading">
      <li v-for="n in 3" :key="n" aria-busy="true" class="rounded border border-slate-200 p-4">
        <div class="animate-pulse space-y-3">
          <div class="h-4 w-3/4 rounded bg-slate-200" />
          <div class="h-3 w-1/2 rounded bg-slate-200" />
          <div class="h-3 w-2/3 rounded bg-slate-200" />
        </div>
      </li>
    </template>

    <li
      v-else-if="!items.length"
      role="status"
      class="rounded border border-slate-200 p-4 text-slate-600"
    >
      No results found.
    </li>

    <template v-else>
      <li v-for="work in items" :key="work.DOI || work.title">{{ work.title }} {{ work.DOI }}</li>
    </template>
  </ul>
</template>
