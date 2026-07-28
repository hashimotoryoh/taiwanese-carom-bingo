/**
 * 標準化残差 z を7段階のヒートマップ色に落とす。
 *
 * 黒背景で7段階が判別できるよう、青↔赤の発散パレットを検証して選んだ値。
 * 隣接ペアの色覚多様性下での分離・通常視力での分離・背景コントラストのいずれも基準を満たす。
 */

export interface HeatBand {
  /** 凡例に出す説明 */
  readonly label: string
  /** 塗りの色 */
  readonly fill: string
}

/** z の小さい順（濃い青 → 白 → 濃い赤） */
export const D120_BANDS: readonly HeatBand[] = [
  { label: 'z ≦ −3', fill: '#1c5cab' },
  { label: '−3 < z ≦ −2', fill: '#4a93ea' },
  { label: '−2 < z ≦ −1', fill: '#a8caf6' },
  { label: '−1 < z < +1', fill: '#ffffff' },
  { label: '+1 ≦ z < +2', fill: '#f7a99b' },
  { label: '+2 ≦ z < +3', fill: '#f0645c' },
  { label: 'z ≧ +3', fill: '#b32626' },
]

/** 色帯の内部境界。凡例の目盛りに使う */
export const D120_BAND_BOUNDARIES: readonly string[] = ['−3', '−2', '−1', '+1', '+2', '+3']

/** z が属する段階の index（0〜6） */
export function bandIndex(z: number): number {
  if (z <= -3) return 0
  if (z <= -2) return 1
  if (z <= -1) return 2
  if (z < 1) return 3
  if (z < 2) return 4
  if (z < 3) return 5
  return 6
}

const toRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]

/** 段階ごとの塗り色（RGB成分） */
export const D120_BAND_RGB: readonly [number, number, number][] = D120_BANDS.map((b) =>
  toRgb(b.fill),
)

/**
 * 段階ごとの文字色。塗りの相対輝度から濃紺か白を選ぶ。
 * 濃い青・濃い赤の面で黒文字が潰れるのを防ぐ。
 */
export const D120_BAND_INK: readonly [number, number, number][] = D120_BAND_RGB.map(([r, g, b]) => {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return luminance > 0.45 ? [16, 18, 28] : [246, 247, 252]
})
