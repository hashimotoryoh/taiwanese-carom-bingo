<script setup lang="ts">
// 見本なのでヒートマップの7色が必ず全て出るよう、面ごとに色を巡回させる
const BAND_SAMPLE_Z = [-4, -2.5, -1.5, 0, 1.5, 2.5, 4]
const zScores = Array.from({ length: 120 }, (_, i) => BAND_SAMPLE_Z[i % BAND_SAMPLE_Z.length]!)
</script>

<template>
  <NuxtLink to="/stats/d120" class="d120-banner">
    <div class="d120-banner-preview" aria-hidden="true">
      <D120Viewer :z-scores="zScores" :interactive="false" />
    </div>
    <div class="d120-banner-text">
      <span class="d120-banner-eyebrow">120面体サイコロ</span>
      <strong>出目ヒートマップ</strong>
      <p>
        1 ~ 120
        の出方の偏りを、120面体サイコロの上に色で表します。ドラッグで回して全面を見られます。
      </p>
    </div>
  </NuxtLink>
</template>

<style scoped>
/* 出目ヒートマップページと同じ宇宙のトーンにする */
.d120-banner {
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin: 18px 0 26px;
  padding: 18px 20px;
  border-radius: 14px;
  border: 1px solid rgba(232, 233, 242, 0.12);
  background:
    radial-gradient(circle at 22% 50%, rgba(126, 150, 220, 0.18), transparent 55%),
    linear-gradient(135deg, #0b0c1c, #050510);
  color: #e8e9f2;
  text-decoration: none;
  overflow: hidden;
}
.d120-banner:hover {
  border-color: rgba(232, 233, 242, 0.28);
}
.d120-banner-text {
  flex: 1 1 auto;
  min-width: 0;
  align-self: center;
}
.d120-banner-eyebrow {
  display: block;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: #6f7489;
}
.d120-banner strong {
  display: block;
  margin-top: 4px;
  font-size: 17px;
  font-weight: 700;
}
.d120-banner p {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: #a7abc0;
}
.d120-banner-preview {
  flex: 0 0 auto;
  width: 132px;
  height: 132px;
  border-radius: 10px;
  overflow: hidden;
}
@media (max-width: 480px) {
  .d120-banner {
    gap: 12px;
    padding: 14px 16px;
  }
  .d120-banner-preview {
    width: 92px;
    height: 92px;
  }
  .d120-banner p {
    font-size: 12px;
  }
}
</style>
