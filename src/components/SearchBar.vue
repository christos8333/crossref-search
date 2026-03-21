<script setup lang="ts">
const props = defineProps<{
  query: string;
}>();

const emit = defineEmits<{
  (e: 'update:query', value: string): void;
}>();

const onInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  emit('update:query', value);
};
</script>

<template>
  <div class="mb-4">
    <label for="crossref-search" class="block text-sm font-medium text-slate-700">
      Search Crossref metadata
    </label>
    <input
      id="crossref-search"
      type="search"
      aria-label="Search Crossref metadata"
      :value="props.query"
      class="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="e.g. climate change"
      @input="onInput"
    />
  </div>
</template>
