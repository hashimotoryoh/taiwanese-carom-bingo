-- 出目の記録履歴を保持する rolls 列を追加する
-- Roll[] = [{ id: string, value: number, rolledAt: number(epoch ミリ秒) }]
ALTER TABLE cards ADD COLUMN IF NOT EXISTS rolls JSONB NOT NULL DEFAULT '[]'::jsonb;
