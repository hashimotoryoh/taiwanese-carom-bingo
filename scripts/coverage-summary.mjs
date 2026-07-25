// vitestのjson-summaryレポーター（coverage/coverage-summary.json）を読み取り、
// GitHub ActionsのジョブサマリーへMarkdownの表として書き出す。
// CIの test ジョブから `node scripts/coverage-summary.mjs >> "$GITHUB_STEP_SUMMARY"` として呼ぶ。
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// vitest.config.ts の coverage.thresholds と揃えること（表示上のpass/fail判定に使う）
const THRESHOLDS = {
  statements: 90,
  branches: 80,
  functions: 85,
  lines: 90,
}

const summaryPath = fileURLToPath(new URL('../coverage/coverage-summary.json', import.meta.url))

async function main() {
  let json
  try {
    json = JSON.parse(await readFile(summaryPath, 'utf8'))
  } catch {
    // テストが早期に落ちてカバレッジが生成されなかった場合など
    process.stdout.write('## テストカバレッジ\n\nカバレッジレポートが見つかりませんでした。\n')
    return
  }

  const total = json.total
  const metrics = ['statements', 'branches', 'functions', 'lines']

  const lines = []
  lines.push('## テストカバレッジ')
  lines.push('')
  lines.push('| 指標 | カバレッジ | 網羅 / 全体 | しきい値 |')
  lines.push('| --- | --- | --- | --- |')

  for (const metric of metrics) {
    const m = total[metric]
    const threshold = THRESHOLDS[metric]
    const ok = m.pct >= threshold
    const label = {
      statements: 'Statements',
      branches: 'Branches',
      functions: 'Functions',
      lines: 'Lines',
    }[metric]
    lines.push(
      `| ${label} | ${ok ? '✅' : '❌'} ${m.pct}% | ${m.covered} / ${m.total} | ${threshold}% |`,
    )
  }

  lines.push('')
  process.stdout.write(lines.join('\n') + '\n')
}

main()
