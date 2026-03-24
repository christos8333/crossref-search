<script setup lang="ts">
import type { Facets } from '@/schemas/crossref';

defineProps<{
  facets: Facets;
  activeTypes: string[];
  activeYears: string[];
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle-type', value: string): void;
  (e: 'toggle-year', value: string): void;
}>();

const safeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-');
</script>

<template>
  <div class="space-y-6">
    <fieldset class="rounded border border-slate-200 p-4">
      <legend class="px-1 text-sm font-semibold text-slate-800">
        Record Type
      </legend>
      <div
        v-if="facets['type-name'].length"
        class="mt-3 space-y-2"
      >
        <label
          v-for="facet in facets['type-name']"
          :key="facet.value"
          class="flex items-center gap-2 text-sm text-slate-700"
          :for="`type-${safeId(facet.value)}`"
        >
          <input
            :id="`type-${safeId(facet.value)}`"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            :checked="activeTypes.includes(facet.value)"
            :disabled="isLoading"
            @change="emit('toggle-type', facet.value)"
          >
          <span>{{ facet.value }} ({{ facet.count }})</span>
        </label>
      </div>

      <p
        v-else
        class="mt-3 text-sm text-slate-500"
      >
        No record types found.
      </p>
    </fieldset>

    <fieldset class="rounded border border-slate-200 p-4">
      <legend class="px-1 text-sm font-semibold text-slate-800">
        Publication Year
      </legend>

      <div
        v-if="facets.published.length"
        class="mt-3 space-y-2"
      >
        <label
          v-for="facet in facets.published"
          :key="facet.value"
          class="flex items-center gap-2 text-sm text-slate-700"
          :for="`year-${safeId(facet.value)}`"
        >
          <input
            :id="`year-${safeId(facet.value)}`"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            :checked="activeYears.includes(facet.value)"
            :disabled="isLoading"
            @change="emit('toggle-year', facet.value)"
          >
          <span>{{ facet.value }} ({{ facet.count }})</span>
        </label>
      </div>

      <p
        v-else
        class="mt-3 text-sm text-slate-500"
      >
        No publication years found.
      </p>
    </fieldset>
  </div>
</template>
