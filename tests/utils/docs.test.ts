import { describe, expect, it } from 'vitest'
import type { DocEntry } from '../../app/utils/docs'
import { compareByOrder, docList, getDoc } from '../../app/utils/docs'

const entry = (slug: string): DocEntry => ({ slug, title: slug, markdown: '' })

describe('docList', () => {
  it('app/content/docs 配下のマークダウンを4件読み込む', () => {
    expect(docList).toHaveLength(4)
  })

  it('ORDER で指定した並び（期待値 → ゾロ目確率 → 平均カイルン回数 → 目の配置）になる', () => {
    expect(docList.map((d) => d.slug)).toEqual([
      'd120-expected-value',
      'zorome-probability',
      'bingo-avg',
      'd120-face-layout',
    ])
  })

  it('各ドキュメントのタイトルは先頭の h1 から導出される', () => {
    const titles = Object.fromEntries(docList.map((d) => [d.slug, d.title]))
    expect(titles['d120-expected-value']).toBe('120面体サイコロの期待値')
    expect(titles['zorome-probability']).toBe('ゾロ目が出る確率')
    expect(titles['bingo-avg']).toBe('ビンゴまでの平均必要カイルン回数')
  })

  it('markdown 本文を保持している', () => {
    const doc = docList.find((d) => d.slug === 'd120-expected-value')
    expect(doc?.markdown).toContain('# 120面体サイコロの期待値')
  })
})

describe('compareByOrder', () => {
  it('両方が ORDER にある場合は ORDER の並び順にする', () => {
    expect(compareByOrder(entry('d120-expected-value'), entry('bingo-avg'))).toBeLessThan(0)
    expect(compareByOrder(entry('bingo-avg'), entry('d120-expected-value'))).toBeGreaterThan(0)
  })

  it('片方だけ ORDER にある場合は ORDER にある方を前にする', () => {
    expect(compareByOrder(entry('d120-expected-value'), entry('zzz'))).toBe(-1)
    expect(compareByOrder(entry('zzz'), entry('d120-expected-value'))).toBe(1)
  })

  it('どちらも ORDER に無い場合はスラッグのアルファベット順にする', () => {
    expect(compareByOrder(entry('apple'), entry('banana'))).toBeLessThan(0)
    expect(compareByOrder(entry('banana'), entry('apple'))).toBeGreaterThan(0)
  })
})

describe('getDoc', () => {
  it('スラッグに対応するドキュメントを返す', () => {
    const doc = getDoc('bingo-avg')
    expect(doc?.slug).toBe('bingo-avg')
    expect(doc?.title).toBe('ビンゴまでの平均必要カイルン回数')
  })

  it('存在しないスラッグには undefined を返す', () => {
    expect(getDoc('does-not-exist')).toBeUndefined()
  })
})
