# カイルンBINGO

カイルンビンゴゲームのWebアプリケーション。

[![Netlify Status](https://api.netlify.com/api/v1/badges/af4639f5-9b20-4fe6-aeaf-2da7252054f8/deploy-status)](https://app.netlify.com/projects/taiwanese-carom-bingo/deploys)

## 技術スタック

- [Nuxt v4](https://nuxt.com/)
- [Vue 3](https://vuejs.org/)
- TypeScript

## アーキテクチャ

- フロントエンドは SPA（`ssr: false`）
- ビンゴカードは全ユーザー共有の公開データ。サーバーAPI（`server/api/cards/*`）経由で読み書きする
- 保存先は Netlify Database（マネージド Postgres）。データアクセスは `server/utils/cardStore.ts` に集約している
- DB スキーマは `netlify/database/migrations/` の SQL ファイルで管理し、デプロイ時に自動適用される（初回デプロイで DB も自動プロビジョニングされる）
- ビンゴ判定などクライアント・サーバー共通のロジックは `shared/` に置く
- Netlify へは `npm run build` でデプロイする（API を Netlify Functions として含めるため、`generate` による静的書き出しは使わない）

## セットアップ

依存パッケージをインストールする:

```bash
npm install
```

## 開発サーバー

初回のみ Netlify CLI でログインし、Netlify 上のサイトと紐付ける:

```bash
npm run netlify:login
npm run netlify:link
```

開発サーバーを起動する（`http://localhost:8888`）。`netlify dev` がローカル Postgres を自動起動・接続し、マイグレーションも適用する:

```bash
npm run dev:netlify
```

> **注意**: `npm run dev` / `npm run local`（`nuxt dev` 単体）では DB 接続が解決されないため、カード API は動作しない。DB を使う開発は必ず `npm run dev:netlify` を使うこと。

ローカル DB の補助コマンド:

```bash
npm run db:status
```

```bash
npm run db:connect
```

```bash
npm run db:reset
```

## テストデータ

開発環境の動作確認用に、ビンゴカードのテストデータを投入するシーダーを用意している。

前提として `npm run dev:netlify` で開発サーバーが起動していること（シーダーは DB を直接触らず、開発サーバーの API 経由でデータを作成する）。

テストデータを投入する:

```bash
npm run db:seed
```

テストデータを削除する:

```bash
npm run db:seed:clean
```

投入されるカードは名前がすべて `【テストデータ】` で始まり、本番のカードと一目で区別できる。削除もこの接頭辞が付いたカードだけを対象にするため、手動で作成したカードは残る。`npm run db:seed` は投入前に既存のテストデータを削除するので、何度実行しても常に同じクリーンな状態になる。

投入されるカードは次の 8 枚（同名 2 枚を含む 6 人分）で、一覧・カード詳細・アーカイブ一覧・記録集計の各画面を一通り確認できる。

| カード名                           | 状態                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `【テストデータ】未記録さん`       | 出目をまだ 1 件も記録していない新品のカード                                   |
| `【テストデータ】進行中さん`       | 穴あき・空振り・ゾロ目・重複記録・センターマス・出目 100 を含む進行中のカード |
| `【テストデータ】リーチさん`       | 横 1 列がリーチ状態のカード                                                   |
| `【テストデータ】ダブルリーチさん` | 横 1 列と縦 1 列の 2 ラインがリーチ状態のカード                               |
| `【テストデータ】ビンゴ達成さん`   | 横ラインのビンゴ成立で自動アーカイブされたカード                              |
| `【テストデータ】アーカイブさん`   | ビンゴ未達成のまま手動でアーカイブしたカード                                  |
| `【テストデータ】やりこみさん`     | 同名 2 枚（斜めラインでビンゴ達成済み 1 枚＋進行中 1 枚）                     |

補足:

- 出目の記録日時はシーダーを実行した時刻になる（API 経由で記録するため、過去日付の出目は作れない）。
- 接続先は既定で `http://localhost:8888`。変更する場合は環境変数 `BINGO_BASE_URL` を指定する（例: `BINGO_BASE_URL=http://localhost:3000 npm run db:seed`）。
- 投入するカードの定義は `scripts/lib/testData.mjs` にある。

## ビルド

本番向けにビルドする:

```bash
npm run build
```

ローカルで本番ビルドをプレビューする:

```bash
npm run preview
```

## コード品質

ESLintでコードをチェックする:

```bash
npm run lint
```

ESLintで自動修正する:

```bash
npm run lint:fix
```

Prettierでフォーマットチェックする:

```bash
npm run format:check
```

Prettierでフォーマットする:

```bash
npm run format
```

## テスト

Vitestでテストを実行する:

```bash
npm run test
```

## クリーンアップ

生成ファイルと依存パッケージを削除する:

```bash
npm run cleanup
```
