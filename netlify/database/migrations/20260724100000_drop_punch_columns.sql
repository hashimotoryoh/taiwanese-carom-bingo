-- 手動パンチ由来の列を廃止する。パンチ状態は rolls（出目履歴）から導出するため不要。
ALTER TABLE cards DROP COLUMN IF EXISTS punched;
ALTER TABLE cards DROP COLUMN IF EXISTS punched_at;
