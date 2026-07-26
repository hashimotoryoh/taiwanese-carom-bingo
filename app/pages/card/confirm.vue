<script setup lang="ts">
import type { FetchError } from 'ofetch'

useHead({ title: 'ビンゴカード作成の確認 | カイルンBINGO' })
useBreadcrumbs(() => [{ label: 'ビンゴカード作成', to: '/card/create' }, { label: '作成の確認' }])

const draft = useDraftCard()
const api = useBingoApi()

const creating = ref(false)
const errors = ref<string[]>([])

async function finish() {
  if (!draft.value || creating.value) return
  creating.value = true
  errors.value = []
  try {
    const card = await api.createCard(draft.value)
    draft.value = null
    await navigateTo(`/card/${card.id}`)
  } catch (e) {
    const data = (e as FetchError).data as { data?: { errors?: string[] } } | undefined
    errors.value = data?.data?.errors ?? [
      'ビンゴカードの作成に失敗しました。もう一度お試しください。',
    ]
    creating.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="!draft" class="empty">
      <p>作成中のビンゴカード情報が見つかりません。作成ページからやり直してください。</p>
      <NuxtLink class="btn btn-primary" to="/card/create">作成ページへ</NuxtLink>
    </div>
    <template v-else>
      <h2 class="page-title">ビンゴカード作成の確認</h2>
      <p class="page-sub">内容を確認して、問題なければ作成を完了してください</p>

      <div v-if="errors.length > 0" class="errors">
        <strong>作成できませんでした</strong>
        <ul>
          <li v-for="e in errors" :key="e">{{ e }}</li>
        </ul>
      </div>

      <div class="confirm-name">{{ draft.name }}</div>
      <ReadonlyGrid :columns="draft.columns" />

      <div class="row" style="margin-top: 22px">
        <NuxtLink class="btn btn-secondary" to="/card/create">← 作成ページへ戻る</NuxtLink>
        <div class="spacer" />
        <button class="btn btn-primary" :disabled="creating" @click="finish">
          {{ creating ? '作成中...' : '作成を完了する' }}
        </button>
      </div>
    </template>
  </div>
</template>
