# AGENTS.md

このリポジトリで作業するAIコーディングエージェント（Claude Code、GitHub Copilot など）向けの共通ガイド。`CLAUDE.md` と `.github/copilot-instructions.md` はこのファイルへのシンボリックリンクであり、実体は本ファイル一つに保つこと。特定のツール固有の記述は避け、どのエージェントが読んでも成立する内容にする。

## AIエージェントへの指示

このリポジトリでAIエージェントが生成する**すべての記述**は、原則として日本語で行ってください。

対象には、次を含みます。

- チャットでの説明文
- コードコメント
- コミットメッセージ案
- Pull Request のタイトル・本文
- レビューコメント
- Issue のタイトル・本文
- ドキュメント本文

ただし、次は変更せずそのまま利用してください。

- 既存コードの識別子（変数名・関数名・クラス名など）
- ライブラリ名・プロトコル名・設定キー
- エラーメッセージや外部サービス仕様で英語原文が必要な箇所

ユーザーが明示的に別言語を指定した場合のみ、その指定を優先してください。

## プロジェクト概要

台湾式ビリヤード（カイルン）のスコアをビンゴ形式で記録する Web アプリ（「カイルンBINGO」）。Nuxt v4 + Vue 3 + TypeScript 製の SPA で、データは Netlify Functions 上の API を経由して Netlify DB（マネージド Postgres）に永続化する。ビンゴカードは全ユーザー共有の公開データであり、認証は存在しない。

## セットアップ・開発コマンド

依存パッケージのインストール:

```bash
npm install
```

初回のみ Netlify CLI でログインし、サイトと紐付ける:

```bash
npx netlify login
npx netlify link
```

開発サーバー起動（`http://localhost:8888`）。`netlify dev` がローカル Postgres の起動・接続・マイグレーション適用まで自動で行う:

```bash
npm run dev:netlify
```

**重要**: `npm run dev` / `npm run dev:host`（`nuxt dev` 単体）では DB 接続が解決されず、カード関連 API が動作しない。DB を伴う開発は必ず `npm run dev:netlify` を使うこと。

ローカル DB の補助コマンド:

```bash
npm run db:status          # = netlify database status
npm run db:migrate         # = netlify database migrations apply
npx netlify database connect
npx netlify database reset
```

開発環境へのテストデータ投入（`npm run dev:netlify` の起動中に実行する。詳細は `README.md`）:

```bash
npm run db:seed         # テストデータを投入する（投入前に既存のテストデータを削除する）
npm run db:seed:clean   # テストデータを削除する
```

シーダーは DB を直接触らず開発サーバーの API 経由でデータを作成する。カード名は `【テストデータ】` 始まりで、削除もこの接頭辞に一致するカードだけを対象にする。投入するカードの定義は `scripts/lib/testData.mjs`。

本番ビルド・プレビュー:

```bash
npm run build       # デプロイもこれを使う（`generate` は使わない。API を Netlify Functions として含めるため）
npm run preview
```

コード品質:

```bash
npm run lint         # ESLint
npm run lint:fix
npm run format:check # Prettier
npm run format
```

テスト（Vitest）:

```bash
npm run test                                   # 全テスト実行
npx vitest run tests/server/api/rolls.test.ts  # 単一ファイルのみ
npx vitest run -t "テスト名の一部"               # 名前で絞り込み
npx vitest                                     # watch モード
```

クリーンアップ（生成物・依存関係を削除）:

```bash
npm run cleanup
```

Node バージョンは `.node-version`（24.11.0）に従うこと。

## アーキテクチャ

### レイヤー構成と責務

- `app/` — Nuxt のクライアント側（SPA、`ssr: false`）。`pages/`、`components/`、`composables/`。
- `server/api/` — Nitro のサーバー API。ファイルベースルーティング（例: `server/api/cards/[id]/rolls.post.ts` → `POST /api/cards/:id/rolls`）。
- `server/utils/cardStore.ts` — DB アクセスを一元化する層。**カードの読み書きは必ずここを経由する。** DB 行（`snake_case` / BIGINT が文字列で返る）とアプリ内の型（`camelCase` / number）の変換もここに集約している。
- `shared/` — クライアント・サーバー共通のドメインロジック（`types/bingo.ts` の型定義、`utils/bingo.ts` のビンゴ判定ロジック、`utils/date.ts` の日付整形）。Nuxt の自動インポートで `#shared/...` として参照され、`vitest.config.ts` でも同じエイリアスを解決している。
- `netlify/database/migrations/` — DB スキーマを SQL ファイルで管理。ファイル名の日時プレフィックス順に、デプロイ時（初回はプロビジョニングも）自動適用される。

### データモデルとビンゴ判定の設計

- `BingoCard`（`shared/types/bingo.ts`）が正規の永続化単位。列は `B`(1-24) `I`(25-48) `N`(49-72) `G`(73-96) `O`(97-120) の `ColumnDef`（`shared/utils/bingo.ts` の `COLUMNS`）で定義され、5x5 グリッドの `N` 列中央（`FREE_ROW=2`）は固定値 `FREE_VALUE=101` を持つフリーマス。
- **パンチ状態（マスが開いているか）は保存されず、`rolls`（出目履歴）から都度導出される。** `buildPunched()` / `buildPunchedAt()`（`shared/utils/bingo.ts`）がその導出ロジック。DB マイグレーション履歴（`20260724100000_drop_punch_columns.sql`）にあるとおり、当初は `punched` / `punched_at` 列を保持していたが、`rolls` を単一の真実源とする設計に移行済み。新しい派生値が必要になっても、`rolls` に書き戻すのではなくこの導出関数群に追加すること。
- ビンゴ達成判定は `POST /api/cards/:id/rolls`（`server/api/cards/[id]/rolls.post.ts`）で行う。1 ラインでも完成した瞬間にカードを自動的に `archived: true` / `bingoAchieved: true` にし、以降そのカードへの変更（出目記録・削除）は 409 で拒否する。
- ゾロ目（`isZorome`、2 桁以上の全桁同一数字）は統計上「マイナス値」として平均出目に効かせる特別ルールがある（`computeRollStatsFromRolls`）。

### 同時実行制御

- Netlify DB へのアクセスはリクエストごとに独立しており、read-modify-write（出目記録・削除・アーカイブなど）の間に競合が起きうる。`server/utils/cardStore.ts` の `withCardLock(id, task)` がカード ID 単位の簡易ミューテックスとして直列化し、lost update を防いでいる。カードの状態を読み込んで書き戻す新しい API を追加する際は、必ず `withCardLock` で囲むこと。

### フロントエンド

- ページは `app/pages/` にファイルベースルーティングで配置：一覧（`index.vue`）、カード作成〜確認（`card/create.vue` → `card/confirm.vue`、ドラフトは `useDraftCard`（`useState` によるページ間共有、リロードで消える）で受け渡し）、カード詳細・出目記録（`card/[id].vue`）、アーカイブ一覧（`card/archived.vue`）、個人ごとの記録集計（`records/[name].vue`）と全体集計（`records/index.vue`）。
- `useBingoApi`（`app/composables/useBingoApi.ts`）が `server/api` への `$fetch` 呼び出しを薄くラップする唯一の窓口。新しい API エンドポイントを追加したら、対応するメソッドをここに足す。
- `useConfetti` / `useRulesModal` はページ横断で共有する UI 状態（それぞれ紙吹雪演出のトリガー、ルール説明モーダルの開閉）を `useState` で保持する。

### テスト

- Vitest（`environment: 'node'`）。`server/api` と `shared/utils` は Nuxt/Nitro の自動インポート（`defineEventHandler` や `#shared/...` など）を前提に、明示的な import 文なしで識別子を参照している。テストではその自動インポートが存在しないため、`tests/setup/nitroGlobals.ts` が `globalThis` に `defineEventHandler` / `getRouterParam` / `readBody` / `createError` / `useState` のスタブと、`shared/utils`・`server/utils/cardStore` の実装を登録している。
- `@netlify/database` は `tests/setup/nitroGlobals.ts` でグローバルにモックされる。各テストは `vi.spyOn(globalThis, 'loadCard')` のように `globalThis` 経由でモック・スパイする（通常の `import` した関数への `vi.spyOn` ではない点に注意）。
- `tests/setup/testEvent.ts` の `makeEvent(params, body)` で、H3 イベント相当の最小オブジェクトを組み立ててハンドラーに渡す。

### CI（`.github/workflows/ci.yml`）

- `push`（`develop`）と PR で `format-check` / `lint-check` / `test` を並列実行する。
- 同一リポジトリのブランチ（フォーク PR は対象外）で `format-check` か `lint-check` が失敗すると、`autofix` ジョブが `npm run format` / `npm run lint:fix` を実行し、差分があれば `github-actions[bot]` としてそのブランチへ直接コミット・push する。その後 `verify` ジョブが再度チェックする。`test` の失敗は自動修正されない。

### コードスタイル

- Prettier: セミコロンなし・シングルクォート・末尾カンマあり・`printWidth: 100`（`.prettierrc.json`）。
- ESLint は `@nuxt/eslint` が生成する `.nuxt/eslint.config.mjs` をベースに、`eslint.config.mjs` で void 要素の self-closing ルールのみ追加している。
