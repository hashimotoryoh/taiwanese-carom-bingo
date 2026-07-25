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

## 補足: 1ラインビンゴまでの平均カイルン回数

このアプリのルールで、ビンゴ（12ライン中いずれか1本の完成）が成立するまでに平均何回カイルンが必要かを計算する。

### 前提

- カード上には1〜120の範囲から選ばれた25個の異なる数字がある（B/I/N/G/O各列5マス）。中央（N列3行目）も固定値101として扱われ、他のマスと同様に自力でパンチする必要がある（最初から開いてはいない）
- 1回のカイルンの出目は1〜120から一様ランダムで、同じ出目が複数回出ても2回目以降はパンチに寄与しない（`shared/utils/bingo.ts` の `buildPunched` は出目履歴の集合から導出しており、重複は無視される）
- ビンゴ成立条件は横5・縦5・斜め2の計12ライン（`lineList()`）のいずれか1本が全マスパンチ済みになること

### 計算方法

出目に重複があるため、単純な調和数の公式（クーポン収集問題）をそのまま使うことはできない。次の2段階に分けて計算した。

**Step 1: 「新しい値が出る順序」と「そのタイミング」を分離する**

1〜120から一様ランダムに繰り返し出目を引くとき、カード上の25個の値が初めて出現する順序は、他の95個の無関係な値の存在とは無関係に、25個の一様ランダムな順列になることが知られている（標準的なクーポン収集問題の性質）。

また、カード上の値がすでに `k` 個パンチ済みの状態から次の新しい値（`k+1` 個目）が出るまでの期待カイルン回数は、幾何分布の期待値として `120 / (25 - k)` 回である。したがって、新しい値が `k` 個パンチされるまでの期待カイルン回数は

```
T(k) = 120 × (H(25) - H(25-k))
```

ここで `H(n) = 1 + 1/2 + ... + 1/n`（第n調和数）。この `T(k)` は「どの25個の値が」ではなく「何個目か」だけに依存する。

**Step 2: ビンゴに必要なマス数 `K` の分布を求める**

「パンチ順序が一様ランダムな順列であるとき、12ラインのいずれかが完成するまでに必要なパンチ数 `K`」の分布を、25マスの全部分集合（2^25 = 33,554,432通り）を総当たりして求めた（`scratchpad/bingo_calc.c`）。各サイズ `k` について「12ラインのどれも完成していない部分集合の個数」を数え、

```
P(K > k) = (サイズkでビンゴ未成立の部分集合数) / C(25, k)
```

からP(K=k)を算出した。結果、`K` は最小5・最大21で、期待値は

```
E[K] ≈ 14.90
```

**Step 3: 期待カイルン回数を合成する**

`K` の決まり方（順序）と `T(k)`（タイミング）は独立なので、

```
E[総カイルン回数] = Σ_k P(K=k) × T(k) = Σ_k P(K=k) × 120 × (H(25) - H(25-k))
```

を計算すると

```
E[総カイルン回数] ≈ 108.7 回
```

### 検証

200万試行のモンテカルロシミュレーション（`scratchpad/sim.py`）でも平均 **108.73回** となり、理論値の108.71回とほぼ一致した。

### 結論

このアプリのルール（中央マスも自力パンチ、出目は1〜120の一様ランダムで重複あり）のもとでは、1ラインビンゴが成立するまでに平均で**約109回**のカイルンが必要である。
