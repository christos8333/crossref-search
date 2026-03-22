<script setup lang="ts">
defineProps<{
  page: number;
  isLoading: boolean;
  canGoForward: boolean;
}>();

const emit = defineEmits<{
  (e: 'next'): void;
  (e: 'page', page: number): void;
}>();
</script>

<template>
  <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex flex-wrap items-center justify-start gap-2">
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
