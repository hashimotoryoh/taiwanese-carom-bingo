import { describe, expect, it } from 'vitest'
import { paddedDomain, sampledIndexes } from '../../app/utils/chart'

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
