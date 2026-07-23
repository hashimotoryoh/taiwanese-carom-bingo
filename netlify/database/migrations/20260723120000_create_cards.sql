-- ビンゴカードを1カード=1行で保持するテーブル
CREATE TABLE IF NOT EXISTS cards (
  id                UUID PRIMARY KEY,
  name              TEXT NOT NULL,
  created_at        BIGINT NOT NULL,   -- epoch ミリ秒
  updated_at        BIGINT NOT NULL,   -- epoch ミリ秒
  numbers           JSONB NOT NULL,    -- Record<ColumnKey, number[]>
  punched           JSONB NOT NULL,    -- Record<ColumnKey, boolean[]>
  punched_at        JSONB NOT NULL,    -- Record<ColumnKey, (number|null)[]>
  archived          BOOLEAN NOT NULL DEFAULT FALSE,
  bingo_achieved    BOOLEAN NOT NULL DEFAULT FALSE,
  bingo_achieved_at BIGINT             -- epoch ミリ秒（未達成は NULL）
);

-- 一覧取得（作成日時の降順）用
CREATE INDEX IF NOT EXISTS cards_created_at_idx ON cards (created_at DESC);
