<script setup lang="ts">
import {
  D120_FACES,
  D120_RADIUS,
  apply,
  convexHull,
  cross,
  dot,
  identity,
  multiply,
  normalize,
  pointInTriangle,
  rotation,
  sub,
  type Mat3,
  type Vec3,
} from '~/utils/d120Geometry'
import { D120_FACE_NUMBERS, D120_DOTTED_NUMBERS } from '~/utils/d120Faces'
import { D120_BAND_INK, D120_BAND_RGB, bandIndex } from '~/utils/d120Heatmap'

const props = withDefaults(
  defineProps<{
    /** index 0〜119 が出目 1〜120 の標準化残差 */
    zScores: number[]
    /** 出目ごとの出現回数。ツールチップに出す */
    counts?: number[]
    /** 期待値。ツールチップに出す */
    expected?: number
    /** false にするとドラッグ・ズーム・タップを受け付けない（バナーの見本用） */
    interactive?: boolean
  }>(),
  { counts: () => [], expected: 0, interactive: true },
)

const stage = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const tip = ref<{ x: number; y: number; value: number; count: number; z: number } | null>(null)

// カメラ距離（サイコロ半径 ≒ 1.09）
const CAM = 4.2
const LIGHT = normalize([-0.42, 0.62, 0.66])

let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let width = 0
let height = 0
let dpr = 1
let projScale = 1
let rotationMatrix: Mat3 = identity()
let zoom = 1
let velocity = { x: 0.0006, y: 0.00025 }
let idle = 0
let dragging = false
let hover = -1
let visible: { i: number; P: [number, number][] }[] = []

const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 遠景の天球。サイコロと同じ回転に追従させて視差を出す
const stars = Array.from({ length: 1600 }, () => {
  const u = Math.random() * 2 - 1
  const t = Math.random() * Math.PI * 2
  const r = Math.sqrt(1 - u * u)
  return {
    p: [r * Math.cos(t), r * Math.sin(t), u] as Vec3,
    s: 0.3 + Math.random() * Math.random() * 1.5,
    a: 0.2 + Math.random() * 0.65,
  }
})

// 頂点種別ごとの接触影。C頂点（4面が集まる）が最も浅い谷になる
const AO = [1, 0.985, 0.955]

function project(p: Vec3): [number, number, number] {
  const f = projScale / (CAM - p[2])
  return [width / 2 + p[0] * f, height / 2 - p[1] * f, p[2]]
}

function resize() {
  const el = stage.value
  const cv = canvas.value
  if (!el || !cv) return
  const rect = el.getBoundingClientRect()
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = Math.max(1, Math.floor(rect.width))
  height = Math.max(1, Math.floor(rect.height))
  cv.width = width * dpr
  cv.height = height * dpr
}

function draw() {
  if (!ctx) return
  const c = ctx
  projScale = Math.min(width, height) * 0.36 * zoom * CAM

  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.clearRect(0, 0, width, height)

  const bg = c.createRadialGradient(
    width / 2,
    height * 0.44,
    0,
    width / 2,
    height * 0.44,
    Math.max(width, height) * 0.75,
  )
  bg.addColorStop(0, '#0b0c1c')
  bg.addColorStop(1, '#050510')
  c.fillStyle = bg
  c.fillRect(0, 0, width, height)

  // 星
  const ss = Math.max(width, height) * 0.78
  c.fillStyle = '#cdd3ea'
  for (const st of stars) {
    const p = apply(rotationMatrix, st.p)
    if (p[2] > 0) continue
    const f = ss / (1 - 0.3 * p[2])
    const x = width / 2 + p[0] * f
    const y = height / 2 - p[1] * f
    if (x < -2 || y < -2 || x > width + 2 || y > height + 2) continue
    c.globalAlpha = st.a * (0.35 - 0.65 * p[2])
    c.beginPath()
    c.arc(x, y, st.s, 0, 6.2832)
    c.fill()
  }
  c.globalAlpha = 1

  // 背後の淡い光暈
  const rad = (projScale / CAM) * D120_RADIUS
  const halo = c.createRadialGradient(
    width / 2,
    height / 2,
    rad * 0.9,
    width / 2,
    height / 2,
    rad * 2.1,
  )
  halo.addColorStop(0, 'rgba(126,150,220,0.13)')
  halo.addColorStop(1, 'rgba(126,150,220,0)')
  c.fillStyle = halo
  c.fillRect(0, 0, width, height)

  // 可視面を奥から並べる
  const list: {
    i: number
    f: (typeof D120_FACES)[number]
    n: Vec3
    cc: Vec3
    facing: number
    P: [number, number][]
    VN: Vec3[]
  }[] = []
  for (let i = 0; i < D120_FACES.length; i++) {
    const f = D120_FACES[i]!
    const n = apply(rotationMatrix, f.n)
    const cc = apply(rotationMatrix, f.c)
    const view = normalize([-cc[0], -cc[1], CAM - cc[2]])
    const facing = dot(n, view)
    if (facing <= 0.015) continue
    list.push({ i, f, n, cc, facing, P: [], VN: [] })
  }
  list.sort((a, b) => a.cc[2] - b.cc[2])

  c.lineJoin = 'round'
  c.lineCap = 'round'
  const hullPts: [number, number][] = []

  for (const it of list) {
    const { i, f, facing } = it
    const P = f.v.map((v) => {
      const q = project(apply(rotationMatrix, v))
      return [q[0], q[1]] as [number, number]
    })
    const VN = f.vn.map((v) => apply(rotationMatrix, v))
    const band = bandIndex(props.zScores[D120_FACE_NUMBERS[i]! - 1] ?? 0)
    const [r, g, b] = D120_BAND_RGB[band]!

    const rim = 0.09 * Math.pow(1 - facing, 3)
    const hi = i === hover ? 1.07 : 1
    const sh = VN.map((nv, k) => {
      const lam = (dot(nv, LIGHT) + 1) / 2
      return (0.8 + 0.2 * lam * lam + rim) * AO[f.kind[k]!]! * hi
    })
    const col = (t: number) => {
      const k = Math.min(1.12, t)
      return `rgb(${Math.min(255, Math.round(r * k))},${Math.min(255, Math.round(g * k))},${Math.min(255, Math.round(b * k))})`
    }

    c.beginPath()
    c.moveTo(P[0]![0], P[0]![1])
    c.lineTo(P[1]![0], P[1]![1])
    c.lineTo(P[2]![0], P[2]![1])
    c.closePath()

    // 最暗頂点 → 最明頂点 を軸にした線形グラデーションで Gouraud 塗りを近似する
    let lo = 0
    let up = 0
    for (let k = 1; k < 3; k++) {
      if (sh[k]! < sh[lo]!) lo = k
      if (sh[k]! > sh[up]!) up = k
    }
    if (up === lo || sh[up]! - sh[lo]! < 0.004) {
      c.fillStyle = col(sh[0]!)
    } else {
      const ax = P[up]![0] - P[lo]![0]
      const ay = P[up]![1] - P[lo]![1]
      const gr = c.createLinearGradient(P[lo]![0], P[lo]![1], P[up]![0], P[up]![1])
      gr.addColorStop(0, col(sh[lo]!))
      const mid = 3 - lo - up
      const l2 = ax * ax + ay * ay
      const t = Math.max(
        0.001,
        Math.min(0.999, ((P[mid]![0] - P[lo]![0]) * ax + (P[mid]![1] - P[lo]![1]) * ay) / l2),
      )
      gr.addColorStop(t, col(sh[mid]!))
      gr.addColorStop(1, col(sh[up]!))
      c.fillStyle = gr
    }
    c.fill()

    it.P = P
    it.VN = VN
    for (const p of P) hullPts.push(p)
  }

  // 稜線を丸みのある折り目として描く
  for (const it of list) {
    const { P, VN, facing } = it
    const faceLit = dot(it.n, LIGHT)
    for (let k = 0; k < 3; k++) {
      const j = (k + 1) % 3
      const cn = normalize([VN[k]![0] + VN[j]![0], VN[k]![1] + VN[j]![1], VN[k]![2] + VN[j]![2]])
      const d = dot(cn, LIGHT) - faceLit
      const a = Math.min(0.5, Math.abs(d) * 1.5 + 0.05) * (0.55 + 0.45 * (1 - facing))
      c.beginPath()
      c.moveTo(P[k]![0], P[k]![1])
      c.lineTo(P[j]![0], P[j]![1])
      c.lineWidth = 1.1
      c.strokeStyle = d >= 0 ? `rgba(255,255,255,${a * 0.75})` : `rgba(58,64,102,${a})`
      c.stroke()
    }
  }

  // シルエットにクリップした光沢と接触影
  if (hullPts.length > 2) {
    const hull = convexHull(hullPts)
    c.save()
    c.beginPath()
    c.moveTo(hull[0]![0], hull[0]![1])
    for (let k = 1; k < hull.length; k++) c.lineTo(hull[k]![0], hull[k]![1])
    c.closePath()
    c.clip()
    const gx = width / 2 - rad * 0.4
    const gy = height / 2 - rad * 0.48
    const paint = (x: number, y: number, r: number, stops: [number, string][]) => {
      const s = c.createRadialGradient(x, y, 0, x, y, r)
      for (const [o, col] of stops) s.addColorStop(o, col)
      c.fillStyle = s
      c.fillRect(0, 0, width, height)
    }
    paint(gx, gy, rad * 1.55, [
      [0, 'rgba(255,255,255,0.26)'],
      [0.5, 'rgba(255,255,255,0.08)'],
      [1, 'rgba(255,255,255,0)'],
    ])
    paint(gx, gy, rad * 0.3, [
      [0, 'rgba(255,255,255,0.4)'],
      [1, 'rgba(255,255,255,0)'],
    ])
    paint(width / 2 + rad * 0.38, height / 2 + rad * 0.55, rad * 1.15, [
      [0, 'rgba(18,24,52,0.3)'],
      [1, 'rgba(18,24,52,0)'],
    ])
    c.restore()
  }

  // 数字を面の平面に載せる
  for (const it of list) {
    const { i, f, n, facing } = it
    const alpha = Math.min(1, Math.max(0, (facing - 0.16) / 0.3))
    if (alpha <= 0.02) continue

    const c3 = apply(rotationMatrix, f.c)
    const cp = project(c3)

    // 「右」をロゼット中心から遠ざかる向きに取ると、数字から見て中心が常に左になる
    const apex = apply(rotationMatrix, f.apex)
    const perp = sub(apex, [n[0] * dot(apex, n), n[1] * dot(apex, n), n[2] * dot(apex, n)])
    const pl = Math.hypot(perp[0], perp[1], perp[2])
    if (pl < 1e-6) continue
    const right: Vec3 = [-perp[0] / pl, -perp[1] / pl, -perp[2] / pl]
    const up = cross(n, right)

    const d = 1e-3
    const pu = project([c3[0] + up[0] * d, c3[1] + up[1] * d, c3[2] + up[2] * d])
    const pr = project([c3[0] + right[0] * d, c3[1] + right[1] * d, c3[2] + right[2] * d])
    const ux = (pu[0] - cp[0]) / d
    const uy = (pu[1] - cp[1]) / d
    const rx = (pr[0] - cp[0]) / d
    const ry = (pr[1] - cp[1]) / d

    const value = D120_FACE_NUMBERS[i]!
    const label = String(value)
    const band = bandIndex(props.zScores[value - 1] ?? 0)
    const ink = D120_BAND_INK[band]!
    const dotted = D120_DOTTED_NUMBERS.has(value)
    const fit = label.length === 1 ? 1.2 : label.length === 2 ? 0.95 : 0.72
    const size = f.inr * fit * (dotted ? 0.87 : 1)

    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.transform(rx, ry, -ux, -uy, cp[0], cp[1])
    // 100px 基準で描いて縮小する（極小 font-size はブラウザが丸めるため）
    c.scale(size / 100, size / 100)
    c.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${alpha})`
    c.font = '600 100px ui-monospace, "SF Mono", Menlo, Consolas, monospace'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText(label, 0, 6)
    if (dotted) {
      const w = c.measureText(label).width
      c.beginPath()
      c.arc(-w / 2 - 17, 41, 8, 0, 6.2832)
      c.fill()
    }
  }
  c.setTransform(dpr, 0, 0, dpr, 0, 0)

  visible = list.map((it) => ({ i: it.i, P: it.P })).reverse()
}

let last = 0
function frame(now: number) {
  const dt = Math.min(64, now - last)
  last = now
  if (!dragging) {
    idle += dt
    if (!reduceMotion) {
      const decay = Math.pow(0.94, dt / 16.67)
      velocity.x *= decay
      velocity.y *= decay
      if (idle > 8000) {
        const t = Math.min(1, (idle - 8000) / 3000)
        velocity.x += (0.0007 - velocity.x) * 0.02 * t
        velocity.y += (0.00022 - velocity.y) * 0.02 * t
      }
    } else {
      velocity = { x: 0, y: 0 }
    }
    if (Math.abs(velocity.x) > 1e-6 || Math.abs(velocity.y) > 1e-6) {
      rotationMatrix = multiply(rotation([0, 1, 0], velocity.x * dt), rotationMatrix)
      rotationMatrix = multiply(rotation([1, 0, 0], velocity.y * dt), rotationMatrix)
    }
  }
  draw()
  raf = requestAnimationFrame(frame)
}

/* ---------- 操作 ---------- */
const pointers = new Map<number, { x: number; y: number }>()
let startPos: { x: number; y: number } | null = null
let lastPos: { x: number; y: number } | null = null
let moved = 0
let pinch = 0

const pinchDistance = () => {
  const [a, b] = [...pointers.values()]
  return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
}
const setZoom = (z: number) => {
  zoom = Math.min(2.25, Math.max(0.65, z))
}

function onPointerDown(e: PointerEvent) {
  if (!props.interactive) return
  canvas.value?.setPointerCapture(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 1) {
    dragging = true
    moved = 0
    startPos = { x: e.clientX, y: e.clientY }
    lastPos = { x: e.clientX, y: e.clientY }
    velocity = { x: 0, y: 0 }
  } else if (pointers.size === 2) {
    pinch = pinchDistance()
  }
}

function onPointerMove(e: PointerEvent) {
  if (!props.interactive) return
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

  if (pointers.size >= 2) {
    const d = pinchDistance()
    if (pinch > 0) setZoom(zoom * (d / pinch))
    pinch = d
    return
  }

  if (dragging && lastPos) {
    const dx = e.clientX - lastPos.x
    const dy = e.clientY - lastPos.y
    if (startPos)
      moved = Math.max(moved, Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y))
    const k = 0.0075 / Math.max(0.6, zoom)
    rotationMatrix = multiply(rotation([0, 1, 0], dx * k), rotationMatrix)
    rotationMatrix = multiply(rotation([1, 0, 0], dy * k), rotationMatrix)
    velocity = { x: dx * k * 0.34, y: dy * k * 0.34 }
    lastPos = { x: e.clientX, y: e.clientY }
    idle = 0
    tip.value = null
    hover = -1
    return
  }

  updateHover(e)
}

function onPointerUp(e: PointerEvent) {
  if (!props.interactive) return
  pointers.delete(e.pointerId)
  if (pointers.size < 2) pinch = 0
  if (pointers.size === 1) {
    // ピンチから片手ドラッグに戻るところ。ピンチ中は lastPos を更新していないので、
    // 残った指の現在位置で取り直さないと差分が巨大になり、向きが飛んで慣性も暴れる。
    // 一連の操作はもうタップではないので、しきい値の判定からも外す。
    const [remaining] = [...pointers.values()]
    if (remaining) {
      lastPos = { x: remaining.x, y: remaining.y }
      moved = Number.POSITIVE_INFINITY
      velocity = { x: 0, y: 0 }
    }
  }
  if (pointers.size === 0) {
    // 指のブレを見込んで、タップ判定はマウスより広めにする
    const slop = e.pointerType === 'mouse' ? 5 : 14
    if (dragging && moved < slop) {
      velocity = { x: 0, y: 0 }
      updateHover(e)
    }
    dragging = false
    startPos = null
    lastPos = null
    idle = 0
  }
}

// タッチでは pointerup 直後に pointerleave が発火するため、消すのはマウスのときだけにする
function onPointerLeave(e: PointerEvent) {
  if (!dragging && e.pointerType === 'mouse') {
    tip.value = null
    hover = -1
  }
}

function onWheel(e: WheelEvent) {
  if (!props.interactive) return
  e.preventDefault()
  setZoom(zoom * Math.pow(0.9985, e.deltaY))
  idle = 0
}

function updateHover(e: PointerEvent) {
  const cv = canvas.value
  if (!cv) return
  const rect = cv.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const found = visible.find(
    (it) => it.P.length === 3 && pointInTriangle(x, y, it.P[0]!, it.P[1]!, it.P[2]!),
  )
  if (!found) {
    tip.value = null
    hover = -1
    return
  }
  hover = found.i
  const value = D120_FACE_NUMBERS[found.i]!
  tip.value = {
    x,
    y,
    value,
    count: props.counts[value - 1] ?? 0,
    z: props.zScores[value - 1] ?? 0,
  }
}

const tipStyle = computed(() => {
  const t = tip.value
  if (!t) return {}
  return {
    left: `${Math.min(Math.max(8, t.x + 16), Math.max(8, width - 200))}px`,
    top: `${Math.max(8, t.y - 84)}px`,
  }
})
const tipBand = computed(() => (tip.value ? bandIndex(tip.value.z) : 3))

let observer: ResizeObserver | null = null
onMounted(() => {
  ctx = canvas.value?.getContext('2d') ?? null
  resize()
  rotationMatrix = multiply(rotation([1, 0, 0], -0.32), rotationMatrix)
  observer = new ResizeObserver(resize)
  if (stage.value) observer.observe(stage.value)
  last = performance.now()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
})
</script>

<template>
  <div ref="stage" class="d120-stage">
    <canvas
      ref="canvas"
      class="d120-canvas"
      :class="{ interactive }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerLeave"
      @wheel="onWheel"
    />
    <div v-if="tip" class="d120-tip" :style="tipStyle">
      <b>出目 {{ tip.value }}</b>
      <div>
        <span class="k">出現</span> {{ tip.count.toLocaleString('ja-JP') }} 回 /
        <span class="k">期待</span> {{ expected.toFixed(2) }} 回
      </div>
      <div>
        <i
          class="swatch"
          :style="{
            background: D120_BAND_RGB[tipBand]
              ? `rgb(${D120_BAND_RGB[tipBand]!.join(',')})`
              : '#fff',
          }"
        />
        <span class="k">z =</span> {{ tip.z >= 0 ? '+' : '' }}{{ tip.z.toFixed(2) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.d120-stage {
  position: relative;
  width: 100%;
  height: 100%;
}
.d120-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
.d120-canvas.interactive {
  cursor: grab;
}
.d120-canvas.interactive:active {
  cursor: grabbing;
}
.d120-tip {
  position: absolute;
  z-index: 3;
  pointer-events: none;
  background: #0b0c1a;
  border: 1px solid rgba(232, 233, 242, 0.12);
  border-radius: 8px;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.55);
  padding: 8px 11px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.55;
  color: #e8e9f2;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.d120-tip b {
  font-size: 14px;
}
.d120-tip .k {
  color: #6f7489;
}
.d120-tip .swatch {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 2px;
  margin-right: 6px;
}
</style>
