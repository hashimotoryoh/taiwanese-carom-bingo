import { describe, expect, it } from 'vitest'
import { extractTitle, renderMarkdown } from '../../app/utils/markdown'

describe('renderMarkdown', () => {
  it('見出し（# / ## / ###）をレベルに応じた h タグにする', () => {
    const html = renderMarkdown('# 見出し1\n## 見出し2\n### 見出し3')
    expect(html).toContain('<h1>見出し1</h1>')
    expect(html).toContain('<h2>見出し2</h2>')
    expect(html).toContain('<h3>見出し3</h3>')
  })

  it('#### 以上は見出しにせず段落として扱う', () => {
    const html = renderMarkdown('#### 見出し4')
    expect(html).not.toContain('<h4>')
    expect(html).toContain('<p>#### 見出し4</p>')
  })

  it('通常の行を段落にする', () => {
    expect(renderMarkdown('これは段落です。')).toBe('<p>これは段落です。</p>')
  })

  it('**強調** を strong にする', () => {
    expect(renderMarkdown('これは**重要**です')).toBe('<p>これは<strong>重要</strong>です</p>')
  })

  it('`コード` を code にする', () => {
    expect(renderMarkdown('変数 `x` を使う')).toBe('<p>変数 <code>x</code> を使う</p>')
  })

  it('- で始まる行を ul の li にまとめる', () => {
    const html = renderMarkdown('- りんご\n- みかん')
    expect(html).toBe('<ul><li>りんご</li><li>みかん</li></ul>')
  })

  it('* で始まる行も ul として扱う', () => {
    expect(renderMarkdown('* 項目')).toBe('<ul><li>項目</li></ul>')
  })

  it('1. で始まる行を ol の li にまとめる', () => {
    const html = renderMarkdown('1. 最初\n2. 次')
    expect(html).toBe('<ol><li>最初</li><li>次</li></ol>')
  })

  it('ul から ol へ切り替わったらリストを閉じ直す', () => {
    const html = renderMarkdown('- あ\n1. い')
    expect(html).toBe('<ul><li>あ</li></ul>\n<ol><li>い</li></ol>')
  })

  it('リストのあとに段落が来たらリストを閉じる', () => {
    const html = renderMarkdown('- 項目\n\n段落')
    expect(html).toBe('<ul><li>項目</li></ul>\n<p>段落</p>')
  })

  it('``` で囲んだ範囲をコードブロックにし、内側は変換しない', () => {
    const html = renderMarkdown('```\nE = 1 + 2\n**強調しない**\n```')
    expect(html).toBe('<pre><code>E = 1 + 2\n**強調しない**</code></pre>')
  })

  it('コードブロック内では見出し記法も変換しない', () => {
    const html = renderMarkdown('```\n# not a heading\n```')
    expect(html).toBe('<pre><code># not a heading</code></pre>')
  })

  it('閉じられていないコードブロックも最後に回収する', () => {
    const html = renderMarkdown('```\nunterminated')
    expect(html).toBe('<pre><code>unterminated</code></pre>')
  })

  it('末尾に閉じられていないリストがあっても出力する', () => {
    expect(renderMarkdown('- 最後の項目')).toBe('<ul><li>最後の項目</li></ul>')
  })

  it('HTML 特殊文字をエスケープする', () => {
    expect(renderMarkdown('a < b && c > d')).toBe('<p>a &lt; b &amp;&amp; c &gt; d</p>')
  })

  it('コードブロック内の特殊文字もエスケープする', () => {
    expect(renderMarkdown('```\n<tag>\n```')).toBe('<pre><code>&lt;tag&gt;</code></pre>')
  })

  it('見出し内のインライン記法も変換する', () => {
    expect(renderMarkdown('## `E` の値')).toBe('<h2><code>E</code> の値</h2>')
  })

  it('CRLF 改行を LF として扱う', () => {
    expect(renderMarkdown('a\r\nb')).toBe('<p>a</p>\n<p>b</p>')
  })

  it('空文字列は空文字列を返す', () => {
    expect(renderMarkdown('')).toBe('')
  })

  it('空行のみは何も出力しない', () => {
    expect(renderMarkdown('\n\n')).toBe('')
  })
})

describe('extractTitle', () => {
  it('先頭の h1（# 見出し）をタイトルとして取り出す', () => {
    expect(extractTitle('# タイトル\n\n本文')).toBe('タイトル')
  })

  it('前後の空白を除去する', () => {
    expect(extractTitle('#   余白あり   ')).toBe('余白あり')
  })

  it('先頭以外の行にある h1 も拾う', () => {
    expect(extractTitle('本文\n# あとから見出し')).toBe('あとから見出し')
  })

  it('h1 が無ければ null を返す', () => {
    expect(extractTitle('## h2 しかない\n本文')).toBeNull()
  })
})
