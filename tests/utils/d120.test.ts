import { describe, expect, it } from 'vitest'
import {
  D120_FACES,
  D120_OPPOSITE,
  VERTEX_A,
  VERTEX_B,
  VERTEX_C,
} from '../../app/utils/d120Geometry'
import { D120_FACE_NUMBERS, D120_DOTTED_NUMBERS } from '../../app/utils/d120Faces'
import { bandIndex } from '../../app/utils/d120Heatmap'

describe('d120Geometry', () => {
  it('面が120枚ある', () => {
    expect(D120_FACES).toHaveLength(120)
  })

  it('各面はA・B・C頂点をちょうど1つずつ持つ', () => {
    for (const f of D120_FACES) {
      expect([...f.kind].sort()).toEqual([VERTEX_A, VERTEX_B, VERTEX_C])
    }
  })

  it('ロゼットは12組で、それぞれ10面からなる', () => {
    const sizes = new Map<number, number>()
    for (const f of D120_FACES) sizes.set(f.rosette, (sizes.get(f.rosette) ?? 0) + 1)
    expect(sizes.size).toBe(12)
    expect([...new Set(sizes.values())]).toEqual([10])
  })

  it('対面が全ての面に存在し、互いを指し合う', () => {
    expect(D120_OPPOSITE.every((o) => o !== undefined)).toBe(true)
    expect(D120_OPPOSITE.every((o, i) => D120_OPPOSITE[o] === i)).toBe(true)
  })
})

describe('D120_FACE_NUMBERS', () => {
  it('1〜120が過不足なく1回ずつ現れる', () => {
    expect(D120_FACE_NUMBERS).toHaveLength(120)
    expect(new Set(D120_FACE_NUMBERS).size).toBe(120)
    expect(Math.min(...D120_FACE_NUMBERS)).toBe(1)
    expect(Math.max(...D120_FACE_NUMBERS)).toBe(120)
  })

  it('対面の和が常に121になる', () => {
    for (let i = 0; i < 120; i++) {
      expect(D120_FACE_NUMBERS[i]! + D120_FACE_NUMBERS[D120_OPPOSITE[i]!]!).toBe(121)
    }
  })

  it('各ロゼット（頂点まわり10面）の和が常に605になる', () => {
    const sums = new Map<number, number>()
    D120_FACES.forEach((f, i) => {
      sums.set(f.rosette, (sums.get(f.rosette) ?? 0) + D120_FACE_NUMBERS[i]!)
    })
    expect([...sums.values()]).toEqual(new Array(12).fill(605))
  })
})

describe('D120_DOTTED_NUMBERS', () => {
  it('上下逆で別の数に読める目だけを対象にする', () => {
    expect([...D120_DOTTED_NUMBERS].sort((a, b) => a - b)).toEqual([6, 9, 66, 68, 86, 89, 98, 99])
  })

  it('回しても同じ数に読める目は対象外', () => {
    for (const n of [8, 88, 69, 96]) expect(D120_DOTTED_NUMBERS.has(n)).toBe(false)
  })
})

describe('bandIndex', () => {
  it('境界値が正しい段階に入る', () => {
    expect(bandIndex(-3)).toBe(0)
    expect(bandIndex(-2.5)).toBe(1)
    expect(bandIndex(-2)).toBe(1)
    expect(bandIndex(-1)).toBe(2)
    expect(bandIndex(0)).toBe(3)
    expect(bandIndex(1)).toBe(4)
    expect(bandIndex(2)).toBe(5)
    expect(bandIndex(3)).toBe(6)
  })
})
