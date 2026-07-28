/**
 * 120面体サイコロ（disdyakis triacontahedron ＝ 斜方二十・十二面体の双対）の幾何。
 *
 * 正二十面体の各面を「頂点3・辺中点3・面心1」で6分割し、
 * (A頂点, 隣接する辺中点C, 面心B) の三角形を作る。20 × 6 = 120面。
 * 各面はA頂点をちょうど1つ持つので、120面は「A頂点まわりの10面」12組に分かれる。
 */

export type Vec3 = [number, number, number]
/** 行優先の 3x3 回転行列 */
export type Mat3 = number[]

const PHI = (1 + Math.sqrt(5)) / 2

// 頂点3種の半径。双対元（辺長1の斜方二十・十二面体）の面までの距離の逆数比で決まる
const R2 = (31 + 12 * Math.sqrt(5)) / 4
const R_A = 1 / Math.sqrt(R2 - PHI * PHI) // 10面が集まる頂点（12個）
const R_B = 1 / Math.sqrt(R2 - 1) //          6面が集まる頂点（20個）
const R_C = 1 / Math.sqrt(R2 - 0.5) //        4面が集まる頂点（30個）

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s]
export const normalize = (a: Vec3): Vec3 => scale(a, 1 / Math.hypot(a[0], a[1], a[2]))
const add3 = (a: Vec3, b: Vec3, c: Vec3): Vec3 => [
  a[0] + b[0] + c[0],
  a[1] + b[1] + c[1],
  a[2] + b[2] + c[2],
]

/** 頂点の種別。接触影の強さを変えるのに使う */
export const VERTEX_A = 0
export const VERTEX_B = 1
export const VERTEX_C = 2

export interface D120Face {
  /** 三角形の3頂点（外向きの巻き順） */
  v: [Vec3, Vec3, Vec3]
  /** 各頂点の種別（VERTEX_A / VERTEX_B / VERTEX_C） */
  kind: [number, number, number]
  /** 面の法線（外向き・単位長） */
  n: Vec3
  /** 隣接面の法線を平均した頂点法線。面内をなめらかに陰影付けするのに使う */
  vn: [Vec3, Vec3, Vec3]
  /** 内心。数字の中心に使う */
  c: Vec3
  /** 内接円半径。数字の大きさの基準に使う */
  inr: number
  /** 所属ロゼットの中心（A頂点）の方向。数字の向きの基準に使う */
  apex: Vec3
  /** 所属ロゼットの番号（0〜11） */
  rosette: number
}

function icosahedronVertices(): Vec3[] {
  const v: Vec3[] = []
  for (const [i, j, k] of [
    [0, 1, 2],
    [1, 2, 0],
    [2, 0, 1],
  ] as const) {
    for (const s1 of [1, -1]) {
      for (const s2 of [1, -1]) {
        const p: Vec3 = [0, 0, 0]
        p[i] = 0
        p[j] = s1
        p[k] = s2 * PHI
        v.push(normalize(p))
      }
    }
  }
  return v
}

function icosahedronFaces(verts: Vec3[]): number[][] {
  let min = Infinity
  for (let i = 0; i < 12; i++) {
    for (let j = i + 1; j < 12; j++) {
      min = Math.min(min, Math.hypot(...sub(verts[i]!, verts[j]!)))
    }
  }
  const isEdge = (i: number, j: number) =>
    Math.abs(Math.hypot(...sub(verts[i]!, verts[j]!)) - min) < 1e-9
  const out: number[][] = []
  for (let i = 0; i < 12; i++) {
    for (let j = i + 1; j < 12; j++) {
      if (!isEdge(i, j)) continue
      for (let k = j + 1; k < 12; k++) if (isEdge(i, k) && isEdge(j, k)) out.push([i, j, k])
    }
  }
  return out
}

const vertexKey = (p: Vec3) => p.map((x) => x.toFixed(5)).join(',')

function build(): { faces: D120Face[]; opposite: number[] } {
  const iv = icosahedronVertices()
  const faces: D120Face[] = []

  for (const [a, b, c] of icosahedronFaces(iv)) {
    const center = scale(normalize(add3(iv[a!]!, iv[b!]!, iv[c!]!)), R_B / R_C)
    const tri = [a!, b!, c!]
    for (let e = 0; e < 3; e++) {
      const p = tri[e]!
      const q = tri[(e + 1) % 3]!
      const mid = scale(
        normalize(
          scale([iv[p]![0] + iv[q]![0], iv[p]![1] + iv[q]![1], iv[p]![2] + iv[q]![2]], 0.5),
        ),
        1,
      )
      for (const corner of [p, q]) {
        const A = scale(iv[corner]!, R_A / R_C)
        let v: [Vec3, Vec3, Vec3] = [A, mid, center]
        let kind: [number, number, number] = [VERTEX_A, VERTEX_C, VERTEX_B]
        let n = cross(sub(v[1], v[0]), sub(v[2], v[0]))
        if (dot(n, add3(v[0], v[1], v[2])) < 0) {
          v = [A, center, mid]
          kind = [VERTEX_A, VERTEX_B, VERTEX_C]
          n = cross(sub(v[1], v[0]), sub(v[2], v[0]))
        }

        const la = Math.hypot(...sub(v[1], v[2]))
        const lb = Math.hypot(...sub(v[2], v[0]))
        const lc = Math.hypot(...sub(v[0], v[1]))
        const per = la + lb + lc
        const incenter = [0, 1, 2].map(
          (k) => (la * v[0]![k]! + lb * v[1]![k]! + lc * v[2]![k]!) / per,
        ) as Vec3
        const area = 0.5 * Math.hypot(...cross(sub(v[1], v[0]), sub(v[2], v[0])))

        faces.push({
          v,
          kind,
          n: normalize(n),
          vn: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          c: incenter,
          inr: (2 * area) / per,
          apex: normalize(iv[corner]!),
          rosette: corner,
        })
      }
    }
  }

  // 共有頂点で法線を平均する
  const acc = new Map<string, Vec3>()
  for (const f of faces) {
    for (const p of f.v) {
      const k = vertexKey(p)
      const a = acc.get(k) ?? ([0, 0, 0] as Vec3)
      acc.set(k, [a[0] + f.n[0], a[1] + f.n[1], a[2] + f.n[2]])
    }
  }
  for (const f of faces) {
    f.vn = f.v.map((p) => normalize(acc.get(vertexKey(p))!)) as [Vec3, Vec3, Vec3]
  }

  // 中心対称なので、重心を符号反転した面が対面になる
  const byCentroid = new Map<string, number>()
  faces.forEach((f, i) => byCentroid.set(vertexKey(scale(add3(f.v[0], f.v[1], f.v[2]), 1 / 3)), i))
  const opposite = faces.map((f) =>
    byCentroid.get(vertexKey(scale(add3(f.v[0], f.v[1], f.v[2]), -1 / 3)))!,
  )

  return { faces, opposite }
}

const built = build()

/** 120面。index は `D120_FACE_NUMBERS` の index と対応する */
export const D120_FACES: readonly D120Face[] = built.faces
/** 面index → 対面の面index */
export const D120_OPPOSITE: readonly number[] = built.opposite
/** サイコロの外接半径（A頂点までの距離） */
export const D120_RADIUS = R_A / R_C

/** 単位行列 */
export const identity = (): Mat3 => [1, 0, 0, 0, 1, 0, 0, 0, 1]

/** 行列の積（a のあとに b を適用するのではなく、数学どおり a·b） */
export function multiply(a: Mat3, b: Mat3): Mat3 {
  const o = new Array<number>(9)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      o[r * 3 + c] = a[r * 3]! * b[c]! + a[r * 3 + 1]! * b[3 + c]! + a[r * 3 + 2]! * b[6 + c]!
    }
  }
  return o
}

/** 軸まわりの回転行列 */
export function rotation(axis: Vec3, angle: number): Mat3 {
  const [x, y, z] = normalize(axis)
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const t = 1 - c
  return [
    t * x * x + c,
    t * x * y - s * z,
    t * x * z + s * y,
    t * x * y + s * z,
    t * y * y + c,
    t * y * z - s * x,
    t * x * z - s * y,
    t * y * z + s * x,
    t * z * z + c,
  ]
}

/** 行列をベクトルに適用する */
export const apply = (m: Mat3, v: Vec3): Vec3 => [
  m[0]! * v[0] + m[1]! * v[1] + m[2]! * v[2],
  m[3]! * v[0] + m[4]! * v[1] + m[5]! * v[2],
  m[6]! * v[0] + m[7]! * v[1] + m[8]! * v[2],
]

/** 点が三角形の内側にあるか（画面座標でのヒットテスト用） */
export function pointInTriangle(
  px: number,
  py: number,
  a: readonly [number, number],
  b: readonly [number, number],
  c: readonly [number, number],
): boolean {
  const s = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
  if (Math.abs(s) < 1e-9) return false
  const l1 = ((b[1] - c[1]) * (px - c[0]) + (c[0] - b[0]) * (py - c[1])) / s
  const l2 = ((c[1] - a[1]) * (px - c[0]) + (a[0] - c[0]) * (py - c[1])) / s
  return l1 >= 0 && l2 >= 0 && 1 - l1 - l2 >= 0
}

/** 凸包（単調鎖法）。シルエットに光沢をクリップするのに使う */
export function convexHull(pts: [number, number][]): [number, number][] {
  if (pts.length < 3) return pts
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cr = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (src: [number, number][]) => {
    const h: [number, number][] = []
    for (const q of src) {
      while (h.length >= 2 && cr(h[h.length - 2]!, h[h.length - 1]!, q) <= 0) h.pop()
      h.push(q)
    }
    h.pop()
    return h
  }
  return [...half(p), ...half(p.reverse())]
}
