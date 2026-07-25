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
          <td>{{ row.stats.totalRolls }}</td>
          <td>{{ fmtNum(row.stats.avgRollsPerDay) }}</td>
          <td>{{ fmtNum(row.stats.averageValue) }}</td>
          <td>{{ row.stats.totalZorome }}</td>
          <td>{{ fmtNum(row.stats.zoromeRatioPercent) }}%</td>
          <td>{{ fmtNum(row.stats.punchRatePercent) }}%</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
