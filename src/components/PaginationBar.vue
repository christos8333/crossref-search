<script setup lang="ts">
const props = defineProps<{
  page: number;
  totalPages: number;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  visiblePages: number[];
}>();

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'next'): void;
  (e: 'page', page: number): void;
}>();
</script>

<template>
  <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-2">
      <button
        type="button"
        aria-label="Go to previous page"
        class="rounded bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="isLoading || !canGoBack"
        @click="emit('prev')"
      >
        Previous
      </button>

      <div
        aria-live="polite"
        class="text-sm text-slate-600"
      >
        Page {{ props.page }} of {{ props.totalPages }}
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-start gap-2">
      <button
        v-for="p in props.visiblePages"
        :key="p"
        type="button"
        class="rounded px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        :class="
          p === props.page
            ? 'bg-slate-900 text-white'
            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
        "
        :disabled="isLoading || p === props.page"
        @click="emit('page', p)"
      >
        {{ p }}
      </button>

      <button
        type="button"
        aria-label="Go to next page"
        class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="isLoading || !canGoForward"
        @click="emit('next')"
      >
        Next page →
      </button>
    </div>
  </div>
</template>
