<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Work } from '@/schemas/crossref';

const props = defineProps<{
  work: Work;
}>();

const formatAuthor = (author: Work['author'][number]) => {
  const given = author.given ?? '';
  const family = author.family ?? '';
  const name = [given, family].filter(Boolean).join(' ');
  return name.length > 0 ? name : 'Unknown';
};

const authorsLine = computed(() => {
  const names = props.work.author.map(formatAuthor);
  const first3 = names.slice(0, 3);
  const suffix = names.length > 3 ? ' et al.' : '';
  return first3.join(', ') + suffix;
});

const showFullAbstract = ref(false);

watch(
  () => props.work.DOI,
  () => {
    showFullAbstract.value = false;
  },
);

const abstractText = computed(() => (props.work.abstract ? props.work.abstract.trim() : ''));
const shouldTruncateAbstract = computed(() => abstractText.value.length > 300);
const truncatedAbstract = computed(() => {
  if (!shouldTruncateAbstract.value) return abstractText.value;
  return abstractText.value.slice(0, 300) + '...';
});
const displayedAbstract = computed(() => {
  return showFullAbstract.value ? abstractText.value : truncatedAbstract.value;
});
</script>

<template>
  <article class="rounded border border-slate-200 p-4">
    <h2 class="text-base font-semibold text-slate-900">
      <a
        v-if="work.DOI"
        :href="`https://doi.org/${work.DOI}`"
        target="_blank"
        rel="noopener noreferrer"
        class="text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        {{ work.title }}
      </a>
      <span v-else>{{ work.title }}</span>
    </h2>

    <p
      v-if="work.author.length"
      class="mt-2 text-sm text-slate-700"
    >
      {{ authorsLine }}
    </p>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <span
        v-if="work.type"
        class="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800"
      >
        {{ work.type }}
      </span>
      <span
        v-if="work.published"
        class="text-sm text-slate-600"
      >
        {{ work.published }}
      </span>
      <span
        v-if="work['container-title']"
        class="text-sm text-slate-600"
      >
        {{ work['container-title'] }}
      </span>
    </div>

    <div
      v-if="abstractText"
      class="mt-4"
    >
      <p class="text-sm text-slate-700">
        {{ displayedAbstract }}
      </p>

      <button
        v-if="shouldTruncateAbstract"
        type="button"
        class="mt-2 text-sm font-medium text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        :aria-expanded="showFullAbstract"
        @click="showFullAbstract = !showFullAbstract"
      >
        {{ showFullAbstract ? 'Show less' : 'Show more' }}
      </button>
    </div>
  </article>
</template>
