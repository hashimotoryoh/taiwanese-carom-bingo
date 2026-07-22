/** クラッカー演出のトリガー。fire() を呼ぶと ConfettiLayer が紙吹雪を発射する */
export function useConfetti() {
  const trigger = useState('confetti-trigger', () => 0)
  return {
    trigger,
    fire: () => trigger.value++,
  }
}
