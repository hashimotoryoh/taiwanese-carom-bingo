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
npx netlify login
npx netlify link
```

開発サーバーを起動する（`http://localhost:8888`）。`netlify dev` がローカル Postgres を自動起動・接続し、マイグレーションも適用する:

```bash
npm run dev:netlify
```

> **注意**: `npm run dev` / `npm run local`（`nuxt dev` 単体）では DB 接続が解決されないため、カード API は動作しない。DB を使う開発は必ず `npm run dev:netlify` を使うこと。

ローカル DB の補助コマンド:

```bash
npx netlify database status
```

```bash
npx netlify database connect
```

```bash
npx netlify database reset
```

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

## クリーンアップ

生成ファイルと依存パッケージを削除する:

```bash
npm run cleanup
```
