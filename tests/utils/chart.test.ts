import { describe, expect, it } from 'vitest'
import { niceTicks, paddedDomain, sampledIndexes } from '../../app/utils/chart'

describe('paddedDomain', () => {
  it('値が空なら 0〜1 を返す', () => {
    expect(paddedDomain([])).toEqual({ min: 0, max: 1 })
  })

  it('最小・最大の外側に余白を取る', () => {
    // 幅100の12% = 12 が余白になる
    expect(paddedDomain([0, 100])).toEqual({ min: -12, max: 112 })
  })

  it('値がすべて同じでも最小の余白を確保する', () => {
    expect(paddedDomain([50, 50], 4)).toEqual({ min: 46, max: 54 })
  })

  it('マイナス値も扱える', () => {
    const { min, max } = paddedDomain([-30, 10])
    expect(min).toBeLessThan(-30)
    expect(max).toBeGreaterThan(10)
  })
})

describe('niceTicks', () => {
  it('レンジ幅が0以下なら最小値のみを返す', () => {
    expect(niceTicks(5, 5)).toEqual([5])
    expect(niceTicks(5, 1)).toEqual([5])
  })

  it('きりのよい刻みの目盛りを昇順で返す', () => {
    expect(niceTicks(0, 3)).toEqual([0, 1, 2, 3])
    expect(niceTicks(-10, 10)).toEqual([-10, -5, 0, 5, 10])
  })

  it('目盛りは目安の本数に収まる刻みを選ぶ', () => {
    const ticks = niceTicks(0, 400)
    expect(ticks.length).toBeLessThanOrEqual(5)
    expect(ticks).toContain(0)
  })

  it('刻みが粗すぎて1本になる場合は1つ細かい刻みを使う', () => {
    // 刻み5だと 0 しか入らないレンジ。刻み2に落として複数本を確保する
    expect(niceTicks(-4.15, 4.15)).toEqual([-4, -2, 0, 2, 4])
  })

  it('どのレンジでも目盛りは2本以上返す', () => {
    for (const limit of [0.4, 1.2, 4.15, 7.5, 26, 118, 940]) {
      expect(niceTicks(-limit, limit).length).toBeGreaterThanOrEqual(2)
    }
  })

  it('-0 ではなく 0 を返す', () => {
    expect(Object.is(niceTicks(-0.5, 2, 4)[0], -0)).toBe(false)
  })
})

describe('sampledIndexes', () => {
  it('件数が上限以下ならすべてのインデックスを返す', () => {
    expect(sampledIndexes(3, 5)).toEqual([0, 1, 2])
  })

  it('件数が0以下なら空配列を返す', () => {
    expect(sampledIndexes(0, 5)).toEqual([])
  })

  it('上限を超えたら両端を含めて等間隔に間引く', () => {
    expect(sampledIndexes(9, 5)).toEqual([0, 2, 4, 6, 8])
  })

  it('上限が1以下なら先頭のみを返す', () => {
    expect(sampledIndexes(9, 1)).toEqual([0])
  })
})
