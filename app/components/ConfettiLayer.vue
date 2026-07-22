<script setup lang="ts">
interface Piece {
  id: number
  style: Record<string, string>
}

const COLORS = ['#B8392B', '#D4A73D', '#2F6F5E', '#F3E9D3', '#232E3D']
const PIECE_COUNT = 90

const { trigger } = useConfetti()
const pieces = ref<Piece[]>([])
let nextId = 0

watch(trigger, () => {
  for (let i = 0; i < PIECE_COUNT; i++) {
    const id = nextId++
    const dur = 1.8 + Math.random() * 1.6
    const delay = Math.random() * 0.4
    pieces.value.push({
      id,
      style: {
        left: `${Math.random() * 100}vw`,
        background: COLORS[Math.floor(Math.random() * COLORS.length)]!,
        animationDuration: `${dur}s`,
        animationDelay: `${delay}s`,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      },
    })
    setTimeout(
      () => {
        pieces.value = pieces.value.filter((p) => p.id !== id)
      },
      (dur + delay + 0.2) * 1000,
    )
  }
})
</script>

<template>
  <div class="confetti-layer" aria-hidden="true">
    <div v-for="p in pieces" :key="p.id" class="confetti-piece" :style="p.style" />
  </div>
</template>
