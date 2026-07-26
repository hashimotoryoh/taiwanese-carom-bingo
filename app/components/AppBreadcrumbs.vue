<script setup lang="ts">
import type { BreadcrumbItem } from '../composables/useBreadcrumbs'

const props = withDefaults(
  defineProps<{
    items: BreadcrumbItem[]
    /** ページ内に複数置くため、ランドマークを区別できるようラベルを差し替えられるようにする */
    label?: string
  }>(),
  { label: 'パンくずリスト' },
)

// 現在地は末尾の項目ただ1つ。途中の項目に to が無くても現在地扱いにはしない
const lastIndex = computed(() => props.items.length - 1)
</script>

<template>
  <nav v-if="items.length > 0" class="breadcrumbs" :aria-label="label">
    <ol>
      <li v-for="(item, i) in items" :key="`${i}:${item.label}`">
        <!-- 末尾は現在地なのでリンクにしない -->
        <NuxtLink v-if="item.to && i !== lastIndex" :to="item.to" class="crumb">
          {{ item.label }}
        </NuxtLink>
        <span
          v-else
          class="crumb"
          :class="{ 'is-current': i === lastIndex }"
          :aria-current="i === lastIndex ? 'page' : undefined"
          >{{ item.label }}</span
        >
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumbs ol {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--ink-soft);
}
.breadcrumbs li {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
/* 2つ目以降の項目の前に区切り記号を置く */
.breadcrumbs li + li::before {
  content: '›';
  color: var(--ink-soft);
  opacity: 0.6;
  font-weight: 900;
}
.crumb {
  display: block;
  max-width: 16em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
a.crumb {
  color: var(--ink-soft);
  text-decoration: none;
}
a.crumb:hover {
  color: var(--stamp);
  text-decoration: underline;
}
.is-current {
  color: var(--ink);
}
</style>
