// リポジトリ内の信頼できるドキュメント（`app/content/docs/*.md`）を HTML に変換する
// ための軽量マークダウンレンダラー。外部依存を増やさず、ドキュメントで使う範囲
// （見出し・段落・箇条書き・番号付きリスト・コードブロック・強調・インラインコード）
// のみをサポートする。任意のユーザー入力を渡す用途は想定していない。

// HTML の特殊文字をエスケープする
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// 段落内のインライン記法（強調・インラインコード）を変換する。
// エスケープ済みテキストに対して適用する。
function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

// マークダウン文字列を HTML 文字列に変換する
export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []

  // 直前まで蓄積していたリスト項目を種類に応じて出力する
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null
  function flushList() {
    if (listType && listItems.length > 0) {
      html.push(`<${listType}>${listItems.join('')}</${listType}>`)
    }
    listItems = []
    listType = null
  }

  let inCodeBlock = false
  let codeLines: string[] = []

  for (const line of lines) {
    // コードブロックの開始・終了（```）
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
        codeLines = []
        inCodeBlock = false
      } else {
        flushList()
        inCodeBlock = true
      }
      continue
    }
    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    // 見出し（# / ## / ###）
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      flushList()
      const level = heading[1]!.length
      html.push(`<h${level}>${renderInline(heading[2]!)}</h${level}>`)
      continue
    }

    // 箇条書き（- ）
    const ulItem = /^[-*]\s+(.*)$/.exec(line)
    if (ulItem) {
      if (listType !== 'ul') flushList()
      listType = 'ul'
      listItems.push(`<li>${renderInline(ulItem[1]!)}</li>`)
      continue
    }

    // 番号付きリスト（1. ）
    const olItem = /^\d+\.\s+(.*)$/.exec(line)
    if (olItem) {
      if (listType !== 'ol') flushList()
      listType = 'ol'
      listItems.push(`<li>${renderInline(olItem[1]!)}</li>`)
      continue
    }

    // 空行はブロックの区切り
    if (line.trim() === '') {
      flushList()
      continue
    }

    // それ以外は段落
    flushList()
    html.push(`<p>${renderInline(line)}</p>`)
  }

  // 閉じ忘れのブロックを回収する
  if (inCodeBlock) {
    html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
  }
  flushList()

  return html.join('\n')
}

// マークダウン先頭の h1（`# 見出し`）をドキュメントのタイトルとして取り出す
export function extractTitle(markdown: string): string | null {
  const match = /^#\s+(.*)$/m.exec(markdown)
  return match ? match[1]!.trim() : null
}
