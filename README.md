# カイルンBINGO

カイルンビンゴゲームのWebアプリケーション。

## 技術スタック

- [Nuxt v4](https://nuxt.com/)
- [Vue 3](https://vuejs.org/)
- TypeScript

## アーキテクチャ

- フロントエンドは SPA（`ssr: false`）
- ビンゴカードは全ユーザー共有の公開データ。サーバーAPI（`server/api/cards/*`）経由で読み書きする
- 保存先は `useStorage('data')` で抽象化しており、本番（Netlify）は Netlify Blobs、ローカル開発時は `.data/kv` のファイルシステムを使う（`nuxt.config.ts` の `nitro.storage` / `nitro.devStorage`）
- ビンゴ判定などクライアント・サーバー共通のロジックは `shared/` に置く
- Netlify へは `npm run build` でデプロイする（API を Netlify Functions として含めるため、`generate` による静的書き出しは使わない）

## セットアップ

依存パッケージをインストールする:

```bash
npm install
```

## 開発サーバー

開発サーバーを `http://localhost:3000` で起動する:

```bash
npm run dev
```

ローカルネットワーク上のデバイスからアクセスする場合:

```bash
npm run local
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
