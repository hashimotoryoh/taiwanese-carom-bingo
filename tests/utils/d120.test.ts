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

describe('目の配置の均等性', () => {
  // 頂点は座標が一致するかで同定する（D120_FACES は面ごとに頂点を持つため）
  const key = (p: readonly number[]) => p.map((x) => x.toFixed(5)).join(',')

  it('どの頂点まわりでも目の和が 面数 × 60.5 になる', () => {
    const groups = new Map<string, { kind: number; sum: number; count: number }>()
    D120_FACES.forEach((f, i) => {
      f.v.forEach((p, k) => {
        const g = groups.get(key(p)) ?? { kind: f.kind[k]!, sum: 0, count: 0 }
        g.sum += D120_FACE_NUMBERS[i]!
        g.count += 1
        groups.set(key(p), g)
      })
    })
    // A頂点12個(10面/605)・B頂点20個(6面/363)・C頂点30個(4面/242)
    expect(groups.size).toBe(62)
    for (const g of groups.values()) {
      expect(g.sum).toBe(g.count * 60.5)
    }
    const byKind = [VERTEX_A, VERTEX_B, VERTEX_C].map(
      (k) => [...groups.values()].filter((g) => g.kind === k).length,
    )
    expect(byKind).toEqual([12, 20, 30])
  })

  it('高い目が片側に寄る成分（双極子）がゼロになる', () => {
    // 各面の目のずれ (n − 60.5) を法線方向の重みとして足し合わせる。
    // ゼロなら、半球をどう切っても「こちら側が高い」という向きが存在しない。
    const d = [0, 0, 0]
    D120_FACES.forEach((f, i) => {
      const w = D120_FACE_NUMBERS[i]! - 60.5
      for (let k = 0; k < 3; k++) d[k]! += w * f.n[k]!
    })
    expect(Math.hypot(d[0]!, d[1]!, d[2]!)).toBeLessThan(1e-9)
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
