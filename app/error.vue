<script setup lang="ts">
/**
 * Nuxt のエラーページ。存在しない URL（ルート未一致の404）のほか、
 * ページ側で発生した未処理のエラーもすべてここで表示する。
 */
interface ErrorLike {
  statusCode?: number
  statusMessage?: string
  message?: string
}

const props = defineProps<{ error: ErrorLike }>()

const statusCode = computed(() => props.error?.statusCode ?? 500)
const isNotFound = computed(() => statusCode.value === 404)
// ステータスコードは1桁ずつパンチ穴のマスに見立てて並べる
const codeDigits = computed(() => String(statusCode.value).split(''))

const title = computed(() => (isNotFound.value ? 'ページが見つかりません' : 'エラーが発生しました'))
const description = computed(() =>
  isNotFound.value
    ? 'お探しのページは削除されたか、URLが間違っている可能性があります。'
    : '時間をおいてもう一度お試しください。',
)
// 原因調査の手掛かりとして、404以外ではエラーメッセージも添える
const detail = computed(() =>
  isNotFound.value ? '' : (props.error?.message ?? props.error?.statusMessage ?? ''),
)

useHead(() => ({ title: `${title.value} | カイルンBINGO` }))

// NuxtLink だけではエラー表示が残る場合があるため、エラー状態を解除しつつ遷移する
function backToTop() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <NuxtLayout>
    <div class="error-page">
      <p class="error-code" role="img" :aria-label="`エラーコード ${statusCode}`">
        <span v-for="(digit, i) in codeDigits" :key="i" class="error-digit" aria-hidden="true">{{
          digit
        }}</span>
      </p>

      <h2 class="page-title">{{ title }}</h2>
      <p class="page-sub">{{ description }}</p>

      <p v-if="detail" class="error-detail">{{ detail }}</p>

      <div class="row error-actions">
        <button class="btn btn-primary" @click="backToTop">ビンゴカード一覧へ戻る</button>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.error-page {
  text-align: center;
  padding: 40px 16px 24px;
}
/* パンチ済みのマスと同じ見た目でステータスコードを見せる */
.error-code {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 0 0 26px;
}
.error-digit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 2rem;
  background: radial-gradient(circle at 40% 35%, #3a4a5f, var(--hole) 68%);
  color: rgba(243, 233, 211, 0.7);
  box-shadow:
    inset 0 4px 8px rgba(0, 0, 0, 0.7),
    0 1px 2px rgba(255, 255, 255, 0.15);
}
.error-detail {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--ink-soft);
  word-break: break-word;
  margin: -14px 0 22px;
}
.error-actions {
  justify-content: center;
}
@media (max-width: 480px) {
  .error-digit {
    width: 58px;
    height: 58px;
    font-size: 1.6rem;
  }
}
</style>
