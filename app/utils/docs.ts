// `app/content/docs/*.md` に置いたマークダウンのドキュメントを読み込み、
// スラッグ（ファイル名）でアクセスできるようにまとめる。
// SPA なのでビルド時に `import.meta.glob` で raw 文字列としてバンドルする。

// Nuxt では自動インポートされるが、ユニットテスト（vitest）では .ts の自動インポートが
// 効かないため、同じ app/utils 内の依存は明示的に import してモジュール単体で成立させる。
import { extractTitle } from './markdown'

const modules = import.meta.glob('../content/docs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export interface DocEntry {
  slug: string
  title: string
  markdown: string
}

// パス（例: `../content/docs/d120-expected-value.md`）からスラッグを取り出す
function slugFromPath(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.md$/, '')
}

// スラッグ → ドキュメントのマップ
const docsBySlug: Record<string, DocEntry> = {}
for (const [path, markdown] of Object.entries(modules)) {
  const slug = slugFromPath(path)
  docsBySlug[slug] = {
    slug,
    title: extractTitle(markdown) ?? slug,
    markdown,
  }
}

// 表示順を固定するためのスラッグ順。ここに無いスラッグは末尾にアルファベット順で続く
const ORDER = ['d120-expected-value', 'avg-carom-count']

/** 出目の期待値の計算を説明するドキュメントへのパス（統計データからのリンク先） */
export const EXPECTED_VALUE_DOC_PATH = '/doc/d120-expected-value'

// docList の並び替え用コンパレータ。ORDER にあるものを優先し、
// 両方にない場合はスラッグのアルファベット順にする
export function compareByOrder(a: DocEntry, b: DocEntry): number {
  const ia = ORDER.indexOf(a.slug)
  const ib = ORDER.indexOf(b.slug)
  if (ia !== -1 && ib !== -1) return ia - ib
  if (ia !== -1) return -1
  if (ib !== -1) return 1
  return a.slug.localeCompare(b.slug)
}

// 全ドキュメントの一覧（ナビゲーション用）。ORDER の並びを優先する
export const docList: DocEntry[] = Object.values(docsBySlug).sort(compareByOrder)

// スラッグに対応するドキュメントを返す（無ければ undefined）
export function getDoc(slug: string): DocEntry | undefined {
  return docsBySlug[slug]
}
