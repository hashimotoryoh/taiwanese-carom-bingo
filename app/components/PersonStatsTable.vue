<script setup lang="ts">
import type { RollStats } from '#shared/utils/bingo'

defineProps<{ rows: { name: string; stats: RollStats }[] }>()
</script>

<template>
  <div class="stats-table-wrap">
    <table class="stats-table">
      <thead>
        <tr>
          <th scope="col">名前</th>
          <th scope="col">総カイルン回数</th>
          <th scope="col">同日平均カイルン回数</th>
          <th scope="col">出目の平均値</th>
          <th scope="col">ゾロ目回数</th>
          <th scope="col">ゾロ目割合</th>
          <th scope="col">ビンゴカードパンチ率</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.name"
          class="stats-row"
          @click="navigateTo(`/stats/${encodeURIComponent(row.name)}`)"
        >
          <th scope="row" class="stats-name">{{ row.name }}</th>
          <!-- data-label は狭い画面で見出しを各値の前に表示するために使う（CSSのみで切り替え） -->
          <td data-label="総カイルン回数">{{ row.stats.totalRolls }}</td>
          <td data-label="同日平均カイルン回数">{{ fmtNum(row.stats.avgRollsPerDay) }}</td>
          <td data-label="出目の平均値">{{ fmtNum(row.stats.averageValue) }}</td>
          <td data-label="ゾロ目回数">{{ row.stats.totalZorome }}</td>
          <td data-label="ゾロ目割合">{{ fmtNum(row.stats.zoromeRatioPercent) }}%</td>
          <td data-label="ビンゴカードパンチ率">{{ fmtNum(row.stats.punchRatePercent) }}%</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
