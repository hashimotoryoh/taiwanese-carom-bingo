/**
 * server/utils/cardStore.ts 以外の一部composable（useState依存）はNuxtの自動インポートを
 * 前提に識別子をそのまま参照している。テスト実行時は tests/setup/nitroGlobals.ts が
 * useState を globalThis に用意しているので、ここではそれに依存する実装をそのまま公開する。
 * app/**\/*.vue 側の自動インポート（ref・useFetch・useBingoApiなど）は
 * vitest.config.ts の unplugin-auto-import 設定で解決している。
 */
import { useConfetti } from '../../app/composables/useConfetti'
import { useDraftCard } from '../../app/composables/useDraftCard'
import { useRulesModal } from '../../app/composables/useRulesModal'

type NuxtGlobals = typeof globalThis & {
  useConfetti: typeof useConfetti
  useDraftCard: typeof useDraftCard
  useRulesModal: typeof useRulesModal
}

const g = globalThis as NuxtGlobals

g.useConfetti = useConfetti
g.useDraftCard = useDraftCard
g.useRulesModal = useRulesModal
