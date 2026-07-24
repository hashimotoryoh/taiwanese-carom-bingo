# カイルンBINGO

カイルンビンゴゲームのWebアプリケーション。

[![Netlify Status](https://api.netlify.com/api/v1/badges/af4639f5-9b20-4fe6-aeaf-2da7252054f8/deploy-status)](https://app.netlify.com/projects/taiwanese-carom-bingo/deploys)

## 技術スタック

- [Nuxt v4](https://nuxt.com/)
- [Vue 3](https://vuejs.org/)
- TypeScript

## ゲームルール

サイコロは120面体（出目 `v` は `1〜120` の一様分布）。出目に応じた得点 `f(v)` は以下のとおり:

- **ゾロ目**（2桁以上で全桁同一数字）: `f(v) = -v`
- **`v = 100`**: `f(100) = 200`
- **`v = 101`**: `f(101) = 101 + (もう一回振った出目の得点)`
- **その他**: `f(v) = v`

### 得点の期待値

101 の得点には「もう一回振った出目の得点」が含まれ、これは求めたい期待値 `E` 自身と同じ分布・同じルールに従う。そのため `E` を未知数として自己無撞着に解く。

```
E = (1/120) × Σ[v=1..120] f(v)
```

まず「全ての目が `f(v) = v`」だった場合の基準値を計算する:

```
Σ[v=1..120] v = 120 × 121 / 2 = 7260
```

**ゾロ目の補正**: 120以下のゾロ目は `11, 22, 33, 44, 55, 66, 77, 88, 99, 111` の10個。本来 `+v` のところが `-v` になるため、1つにつき `-2v` の補正が入る。

```
11 + 22 + ... + 99 = 11 × (1 + 2 + ... + 9) = 11 × 45 = 495
495 + 111 = 606
補正(ゾロ目) = -2 × 606 = -1212
```

**`v=100` の補正**: 本来 `+100` のところが `+200` なので `+100`。

**`v=101` の補正**: 本来 `+101` のところが `+101 + E` なので `+E`。

以上をまとめると:

```
Σ[v=1..120] f(v) = 7260 - 1212 + 100 + E = 6148 + E
```

これを `E` の式に代入して解く:

```
E = (6148 + E) / 120
120E = 6148 + E
119E = 6148
E = 6148 / 119 ≈ 51.66
```

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
