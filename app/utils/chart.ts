/**
 * 値の並びから、上下に少し余白を足した表示レンジを返す。
 * 値がすべて同じ（レンジ幅0）の場合も `minPadding` の分だけ上下に広げ、線が端に張り付かないようにする。
 */
export function paddedDomain(values: number[], minPadding = 4): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 1 }
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const padding = Math.max(minPadding, (hi - lo) * 0.12)
  return { min: lo - padding, max: hi + padding }
}

/**
 * 0〜`count - 1` から最大 `max` 個のインデックスを等間隔で選ぶ（両端は必ず含む）。
 * 点が多いグラフで軸ラベルを間引くのに使う。
 */
export function sampledIndexes(count: number, max: number): number[] {
  if (count <= 0) return []
  if (count <= max) return Array.from({ length: count }, (_, i) => i)
  if (max <= 1) return [0]
  return Array.from({ length: max }, (_, i) => Math.round((i * (count - 1)) / (max - 1)))
}
