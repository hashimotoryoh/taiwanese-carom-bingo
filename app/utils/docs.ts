// `app/content/docs/*.md` に置いたマークダウンのドキュメントを読み込み、
// スラッグ（ファイル名）でアクセスできるようにまとめる。
// SPA なのでビルド時に `import.meta.glob` で raw 文字列としてバンドルする。

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

// 全ドキュメントの一覧（ナビゲーション用）。ORDER の並びを優先する
export const docList: DocEntry[] = Object.values(docsBySlug).sort((a, b) => {
  const ia = ORDER.indexOf(a.slug)
  const ib = ORDER.indexOf(b.slug)
  if (ia !== -1 && ib !== -1) return ia - ib
  if (ia !== -1) return -1
  if (ib !== -1) return 1
  return a.slug.localeCompare(b.slug)
})

// スラッグに対応するドキュメントを返す（無ければ undefined）
export function getDoc(slug: string): DocEntry | undefined {
  return docsBySlug[slug]
}
