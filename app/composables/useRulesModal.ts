/** ルール説明モーダルの開閉状態（全ページ共通） */
export function useRulesModal() {
  const isOpen = useState('rules-modal-open', () => false)
  return {
    isOpen,
    open: () => (isOpen.value = true),
    close: () => (isOpen.value = false),
  }
}
