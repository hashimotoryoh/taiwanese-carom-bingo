// 開発環境へ投入するテストデータの定義。
// カード名には必ず TEST_CARD_NAME_PREFIX を付け、本番のカードと一目で区別できるようにする。
// 生成は擬似乱数のシードから決定的に行うため、何度投入しても同じ盤面になる。

/** テストデータのカード名に付ける接頭辞。この接頭辞の有無だけで削除対象を判別する */
export const TEST_CARD_NAME_PREFIX = '【テストデータ】'

/** テストデータとして投入されたカードか（＝シーダーが削除してよいカードか） */
export function isTestCardName(name) {
  return typeof name === 'string' && name.startsWith(TEST_CARD_NAME_PREFIX)
}

// shared/utils/bingo.ts の COLUMNS / GRID_SIZE / FREE_ROW / FREE_VALUE / MIN_ROLL / MAX_ROLL と
// 揃えること（スクリプトは .mjs のため TypeScript の定義を直接 import できない）。
// ずれが起きていないかは tests/scripts/testData.test.ts で検証している。
const COLUMN_RANGES = [
  { key: 'B', min: 1, max: 24 },
  { key: 'I', min: 25, max: 48 },
  { key: 'N', min: 49, max: 72 },
  { key: 'G', min: 73, max: 96 },
  { key: 'O', min: 97, max: 120 },
]
const GRID_SIZE = 5
const FREE_ROW = 2
const FREE_VALUE = 101
const MIN_ROLL = 1
const MAX_ROLL = 120

/** ゾロ目（2桁以上の全桁同一数字）のうち出目レンジに収まる値 */
const ZOROME_VALUES = [11, 22, 33, 44, 55, 66, 77, 88, 99, 111]

/**
 * カードに配置しない番号。
 * - センターマス固定値: O列のレンジに含まれるが、センターマス専用のため配置できない
 * - 100: 統計上200として扱われる特別な出目。常に空振りの出目として使うため配置しない
 */
const RESERVED_VALUES = [FREE_VALUE, 100]

/** シードから決定的な擬似乱数を作る（mulberry32） */
function createRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(arr, random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** min〜max から重複なくcount個選ぶ */
function pickUnique(random, min, max, count, exclude = []) {
  const pool = []
  for (let v = min; v <= max; v++) {
    if (exclude.includes(v)) continue
    pool.push(v)
  }
  return shuffle(pool, random).slice(0, count)
}

/** カードの5列分の番号を組み立てる（N列中央はセンターマス固定値） */
function buildColumns(random) {
  const columns = {}
  for (const col of COLUMN_RANGES) {
    columns[col.key] = pickUnique(random, col.min, col.max, GRID_SIZE, RESERVED_VALUES)
  }
  columns.N[FREE_ROW] = FREE_VALUE
  return columns
}

/**
 * 出目プランを実際の出目の配列へ解決する。
 * - `'B0'` 形式: その位置のマスの番号（＝穴が開く出目）。同じ指定を2回置くと重複記録になる
 * - `'miss'`: カード上に存在しない番号（＝穴が開かない出目）
 * - `'zorome'`: カード上に存在しないゾロ目（統計のマイナス計算用）
 * - 数値: その値をそのまま記録する（100が200として計算される特別ルールの確認用）
 */
function resolveRolls(columns, plan, random) {
  const cardValues = new Set(Object.values(columns).flat())
  const missPool = []
  for (let v = MIN_ROLL; v <= MAX_ROLL; v++) {
    if (!cardValues.has(v)) missPool.push(v)
  }
  shuffle(missPool, random)
  const zoromePool = ZOROME_VALUES.filter((v) => !cardValues.has(v))

  let missIndex = 0
  let zoromeIndex = 0
  return plan.map((spec) => {
    if (typeof spec === 'number') return spec
    if (spec === 'miss') return missPool[missIndex++ % missPool.length]
    if (spec === 'zorome') return zoromePool[zoromeIndex++ % zoromePool.length]
    const col = spec.slice(0, 1)
    const row = Number(spec.slice(1))
    return columns[col][row]
  })
}

/**
 * 投入するカードの定義。上から順に作成される。
 * カード一覧・カード詳細・アーカイブ一覧・記録集計の各画面を一通り確認できるよう、
 * 未記録／進行中／リーチ／ビンゴ達成／手動アーカイブ／同名複数枚を網羅している。
 * 進行中カードの名前はアプリ側で重複が禁止されているため、
 * 同名カードを複数持たせる場合は先にアーカイブされる方を前に置くこと。
 */
const FIXTURES = [
  {
    key: 'fresh',
    name: `${TEST_CARD_NAME_PREFIX}未記録さん`,
    description: '出目をまだ1件も記録していない新品のカード',
    seed: 20260725,
    plan: [],
    archive: false,
  },
  {
    key: 'inProgress',
    name: `${TEST_CARD_NAME_PREFIX}進行中さん`,
    description: '穴あき・空振り・ゾロ目・重複記録・センターマス・出目100を含む進行中のカード',
    seed: 20260726,
    // 2回目の 'B0' は重複記録（履歴のマス目欄が「—」になる）、100は統計上200として扱われる出目
    plan: ['miss', 'B0', 'zorome', 'I3', 100, 'N2', 'B0', 'miss', 'G4', 'zorome', 'O2', 'miss'],
    archive: false,
  },
  {
    key: 'reach',
    name: `${TEST_CARD_NAME_PREFIX}リーチさん`,
    description: '横1列があと1マスでビンゴになるリーチ状態のカード',
    seed: 20260727,
    plan: ['B0', 'miss', 'I0', 'zorome', 'N0', 'G0', 'miss', 'I0'],
    archive: false,
  },
  {
    key: 'doubleReach',
    name: `${TEST_CARD_NAME_PREFIX}ダブルリーチさん`,
    description: '横1列と縦1列の2ラインが同時にリーチしているカード',
    seed: 20260728,
    plan: ['B0', 'I0', 'N0', 'G0', 'B1', 'B2', 'zorome', 'B3', 'miss'],
    archive: false,
  },
  {
    key: 'bingo',
    name: `${TEST_CARD_NAME_PREFIX}ビンゴ達成さん`,
    description: '横ラインのビンゴ成立で自動アーカイブされたカード',
    seed: 20260729,
    // 最後の 'O1' でビンゴが成立し、以降は変更できなくなるため必ず末尾に置く
    plan: ['miss', 'G4', 'zorome', 'B1', 'I1', 100, 'N1', 'miss', 'G1', 'O1'],
    archive: false,
  },
  {
    key: 'archived',
    name: `${TEST_CARD_NAME_PREFIX}アーカイブさん`,
    description: 'ビンゴ未達成のまま手動でアーカイブしたカード',
    seed: 20260730,
    plan: ['B3', 'miss', 'O0', 'zorome', 'B3', 100, 'miss'],
    archive: true,
  },
  {
    key: 'veteranArchived',
    name: `${TEST_CARD_NAME_PREFIX}やりこみさん`,
    description: '同名2枚のうち1枚目（斜めラインでビンゴ達成済み）。記録集計ページの確認用',
    seed: 20260731,
    // 'N2' はセンターマス（固定値）。最後の 'O4' で斜めラインが成立する
    plan: ['zorome', 'B0', 'miss', 'I1', 'N2', 'miss', 100, 'zorome', 'G3', 'miss', 'O4'],
    archive: false,
  },
  {
    key: 'veteranActive',
    name: `${TEST_CARD_NAME_PREFIX}やりこみさん`,
    description: '同名2枚のうち2枚目（進行中）。記録集計ページの確認用',
    seed: 20260732,
    plan: ['miss', 'B2', 'zorome', 'I4', 'miss', 'N1', 'miss', 'zorome'],
    archive: false,
  },
]

/**
 * 投入用のテストデータを組み立てる。
 * @returns 作成順のカード定義（draft はそのまま `POST /api/cards` のボディに使える）
 */
export function buildTestCards() {
  return FIXTURES.map((fixture) => {
    const random = createRandom(fixture.seed)
    const columns = buildColumns(random)
    return {
      key: fixture.key,
      name: fixture.name,
      description: fixture.description,
      draft: { name: fixture.name, columns },
      rolls: resolveRolls(columns, fixture.plan, random),
      archive: fixture.archive,
    }
  })
}
