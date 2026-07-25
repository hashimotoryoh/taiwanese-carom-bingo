import { describe, expect, it } from 'vitest'
import type { DocEntry } from '../../app/utils/docs'
import { compareByOrder, docList, getDoc } from '../../app/utils/docs'

const entry = (slug: string): DocEntry => ({ slug, title: slug, markdown: '' })

describe('docList', () => {
  it('app/content/docs 配下のマークダウンを2件読み込む', () => {
    expect(docList).toHaveLength(2)
  })

  it('ORDER で指定した並び（期待値 → 平均カイルン回数）になる', () => {
    expect(docList.map((d) => d.slug)).toEqual(['d120-expected-value', 'avg-carom-count'])
  })

  it('各ドキュメントのタイトルは先頭の h1 から導出される', () => {
    const titles = Object.fromEntries(docList.map((d) => [d.slug, d.title]))
    expect(titles['d120-expected-value']).toBe('120面体サイコロの期待値')
    expect(titles['avg-carom-count']).toBe('ビンゴまでの平均カイルン回数')
  })

  it('markdown 本文を保持している', () => {
    const doc = docList.find((d) => d.slug === 'd120-expected-value')
    expect(doc?.markdown).toContain('# 120面体サイコロの期待値')
  })
})

describe('compareByOrder', () => {
  it('両方が ORDER にある場合は ORDER の並び順にする', () => {
    expect(compareByOrder(entry('d120-expected-value'), entry('avg-carom-count'))).toBeLessThan(0)
    expect(compareByOrder(entry('avg-carom-count'), entry('d120-expected-value'))).toBeGreaterThan(
      0,
    )
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
    const doc = getDoc('avg-carom-count')
    expect(doc?.slug).toBe('avg-carom-count')
    expect(doc?.title).toBe('ビンゴまでの平均カイルン回数')
  })

  it('存在しないスラッグには undefined を返す', () => {
    expect(getDoc('does-not-exist')).toBeUndefined()
  })
})
