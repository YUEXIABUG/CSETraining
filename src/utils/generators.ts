import type {
  AddSubQuestion,
  BasePeriodQuestion,
  BasePeriodShareQuestion,
  FractionQuestion,
  MultiplyQuestion,
  Question,
  QuestionType,
  ShareGapQuestion,
  Term,
} from '../types'

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

/** 去掉末尾多余的 0：16.45 → "16.45"，15.10 → "15.1"，20.00 → "20" */
export function fmtTrim(v: number): string {
  return v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

/** 整数部分位数（用于保证选择题选项位数一致） */
function intDigits(v: number): number {
  return String(Math.floor(Math.abs(v))).length
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 多位加减法：四个「至少三位、至多四位」的整数，
 * 至多一个减号、至多一个三位数，保证结果为正、首项为正。
 */
export function genAddSub(): AddSubQuestion {
  const threeDigitIndex = Math.random() < 0.35 ? randInt(0, 3) : -1
  const terms: Term[] = []
  for (let i = 0; i < 4; i++) {
    terms.push({ sign: 1, value: i === threeDigitIndex ? randInt(100, 999) : randInt(1000, 9999) })
  }
  if (Math.random() < 0.4) {
    terms[randInt(1, 3)].sign = -1
  }
  let result = terms.reduce((s, t) => s + t.sign * t.value, 0)
  if (result <= 0) {
    // 把减数与最大的加数互换，可证明互换后结果必为正
    const subIdx = terms.findIndex((t) => t.sign === -1)
    let maxIdx = 0
    terms.forEach((t, i) => {
      if (t.sign === 1 && t.value > terms[maxIdx].value) maxIdx = i
    })
    const tmp = terms[subIdx].value
    terms[subIdx].value = terms[maxIdx].value
    terms[maxIdx].value = tmp
    result = terms.reduce((s, t) => s + t.sign * t.value, 0)
  }
  return { type: 'addsub', terms, answer: result }
}

/** 乘法：三位整数 × 小于 100% 的一位小数百分比 */
export function genMultiply(): MultiplyQuestion {
  const base = randInt(100, 999)
  const percent = randInt(50, 999) / 10 // 5.0% ~ 99.9%
  return { type: 'multiply', base, percent, answer: (base * percent) / 100 }
}

/** 分数比大小：两个值相差 5% 以内（且差异可辨）的分数，分子分母均为整数 */
export function genFraction(): FractionQuestion {
  for (let attempt = 0; attempt < 300; attempt++) {
    const left = { n: randInt(110, 9999), d: randInt(110, 9999) }
    const v1 = left.n / left.d
    const deltaPct = (randInt(8, 50) / 10) * (Math.random() < 0.5 ? -1 : 1) // ±0.8% ~ ±5%
    const dMin = Math.max(110, Math.round(left.d * 0.6))
    const dMax = Math.max(dMin + 10, Math.round(left.d * 1.6))
    const d2 = randInt(dMin, dMax)
    let n2 = Math.round(v1 * (1 + deltaPct / 100) * d2)
    if (n2 < 10) continue
    if (left.n * d2 === n2 * left.d) n2 += 1 // 避免两个分数恰好相等
    const v2 = n2 / d2
    const rel = Math.abs(v2 - v1) / v1
    if (rel > 0.002 && rel <= 0.05) {
      return {
        type: 'fraction',
        left,
        right: { n: n2, d: d2 },
        answer: v1 > v2 ? '>' : '<',
      }
    }
  }
  // 理论上几乎不可达的兜底
  return {
    type: 'fraction',
    left: { n: 3, d: 7 },
    right: { n: 4, d: 9 },
    answer: '<',
  }
}

/** 基期与增长量：A（四至五位）与增长率（默认 -15% ~ 100%），需同时计算基期量与增长量 */
export function genBasePeriod(minPct = -15, maxPct = 100): BasePeriodQuestion {
  const amount = randInt(1000, 99999)
  const percent = randInt(Math.round(minPct * 10), Math.round(maxPct * 10)) / 10
  const b = percent / 100
  const baseAnswer = amount / (1 + b)
  const growthAnswer = amount - baseAnswer
  return { type: 'baseperiod', amount, percent, baseAnswer, growthAnswer }
}

/** 现期部分 A 与现期整体 B：B 比 A 大 10%~30%，且均为四位整数 */
function genPartTotal(): { part: number; total: number } {
  // part ≤ 7691 时 part × 1.3 < 10000，保证 B 仍是四位整数
  const part = randInt(1000, 7691)
  const diff = randInt(Math.ceil(part * 0.1), Math.floor(part * 0.3))
  return { part, total: part + diff }
}

/** 部分 / 整体增长率：±20% 内一位小数，且两者至少相差 5 个百分点 */
function genGrowthRates(): { ra: number; rb: number } {
  let a: number
  let b: number
  do {
    a = randInt(-200, 200)
    b = randInt(-200, 200)
  } while (Math.abs(a - b) < 50)
  return { ra: a / 10, rb: b / 10 }
}

/**
 * 基期比重选择题：
 * 基期比重 = (A / B) × (1 + Rb) / (1 + Ra)，
 * A 为现期部分、B 为现期整体（B 比 A 大 10%~30%），
 * Ra / Rb 为部分 / 整体增长率（±20% 内一位小数，至少相差 5 个百分点）。
 * 四个选项为位数一致、至多两位小数的百分比。
 */
export function genBasePeriodShare(): BasePeriodShareQuestion {
  for (let attempt = 0; attempt < 400; attempt++) {
    const { part, total } = genPartTotal()
    const { ra, rb } = genGrowthRates()
    const baseShare = (part / total) * ((1 + rb / 100) / (1 + ra / 100)) * 100
    const correct = round2(baseShare)
    if (correct <= 0.5 || correct >= 99.5) continue
    const digits = intDigits(correct)
    const opts: number[] = [correct]
    const tryAdd = (v: number) => {
      const r = round2(v)
      if (r <= 0 || r >= 100) return
      if (opts.includes(r)) return
      if (intDigits(r) !== digits) return
      opts.push(r)
    }
    // 典型错项 1：误用现期比重 A / B
    tryAdd((part / total) * 100)
    // 典型错项 2：Ra / Rb 位置颠倒
    tryAdd((part / total) * ((1 + ra / 100) / (1 + rb / 100)) * 100)
    let guard = 0
    while (opts.length < 4 && guard++ < 300) {
      const off = (randInt(3, 80) / 10) * (Math.random() < 0.5 ? -1 : 1)
      tryAdd(baseShare + off)
    }
    if (opts.length < 4) continue
    const options = shuffle(opts.slice(0, 4))
    return {
      type: 'baseperiodshare',
      part,
      total,
      ra,
      rb,
      options: options.map((v) => `${v.toFixed(2)}%`),
      correctIndex: options.indexOf(correct),
      answer: correct,
    }
  }
  // 理论上几乎不可达的兜底
  return {
    type: 'baseperiodshare',
    part: 4000,
    total: 4800,
    ra: 10,
    rb: 5,
    options: ['79.55%', '83.33%', '87.30%', '75.12%'],
    correctIndex: 0,
    answer: 79.55,
  }
}

/**
 * 比重差选择题：
 * 比重差 = (A / B) × (Ra − Rb) / (1 + Ra)（百分点），
 * B 比 A 大 10%~30%，增长率至少相差 5 个百分点，Ra > Rb 时比重上升，反之下降。
 * 选项结构：A 上升 V1 / B 下降 V1 / C 上升 V2 / D 下降 V2，V1 与 V2 相差 20% 以内。
 */
export function genShareGap(): ShareGapQuestion {
  for (let attempt = 0; attempt < 400; attempt++) {
    const { part, total } = genPartTotal()
    const { ra, rb } = genGrowthRates()
    const gapPp = (part / total) * ((ra - rb) / (1 + ra / 100))
    const value = round2(Math.abs(gapPp))
    // 生成另一个与 value 相差 20% 以内的干扰数值（对舍入后的值做校验）
    const withinGap = (a: number, b: number) => Math.abs(a - b) / Math.max(a, b) <= 0.2
    let other = value
    let guard = 0
    do {
      const delta = (randInt(5, 18) / 100) * (Math.random() < 0.5 ? -1 : 1)
      other = round2(value * (1 + delta))
      guard++
    } while ((other === value || other <= 0 || !withinGap(value, other)) && guard < 200)
    if (other === value || other <= 0 || !withinGap(value, other)) continue
    const correctIsFirst = Math.random() < 0.5
    const v1 = correctIsFirst ? value : other
    const v2 = correctIsFirst ? other : value
    const rising = ra > rb
    const correctIndex = rising ? (correctIsFirst ? 0 : 2) : correctIsFirst ? 1 : 3
    return {
      type: 'sharegap',
      part,
      total,
      ra,
      rb,
      options: [
        `上升 ${fmtTrim(v1)} 个百分点`,
        `下降 ${fmtTrim(v1)} 个百分点`,
        `上升 ${fmtTrim(v2)} 个百分点`,
        `下降 ${fmtTrim(v2)} 个百分点`,
      ],
      correctIndex,
      answer: round2(gapPp),
    }
  }
  return {
    type: 'sharegap',
    part: 3000,
    total: 3750,
    ra: 18.7,
    rb: 8.2,
    options: ['上升 7.08 个百分点', '下降 7.08 个百分点', '上升 7.93 个百分点', '下降 7.93 个百分点'],
    correctIndex: 0,
    answer: 7.08,
  }
}

const GENERATORS: Record<Exclude<QuestionType, 'exam'>, () => Question> = {
  addsub: genAddSub,
  multiply: genMultiply,
  fraction: genFraction,
  baseperiod: () => genBasePeriod(-15, 100),
  baseperiodshare: genBasePeriodShare,
  sharegap: genShareGap,
}

export function generateSet(type: QuestionType, count: number): Question[] {
  if (type === 'exam') return generateExam()
  return Array.from({ length: count }, () => GENERATORS[type]())
}

/** 套卷模式分段定义（顺序即出题顺序） */
export const EXAM_SEGMENTS: { label: string; count: number }[] = [
  { label: '加减法', count: 4 },
  { label: '比较大小', count: 4 },
  { label: '乘法运算', count: 10 },
  { label: '基期比重', count: 2 },
  { label: '比重差', count: 2 },
  { label: '基期增量', count: 12 },
]

/** 套卷：4 加减法 + 4 比大小 + 10 乘法 + 2 基期比重 + 2 比重差 + 12 基期增量（6 道 0~20%、2 道 20~100%、4 道 -15~0） */
export function generateExam(): Question[] {
  const qs: Question[] = []
  const push = (g: () => Question, n: number) => {
    for (let i = 0; i < n; i++) qs.push(g())
  }
  push(genAddSub, 4)
  push(genFraction, 4)
  push(genMultiply, 10)
  push(genBasePeriodShare, 2)
  push(genShareGap, 2)
  // 12 道基期增量：6 道 [0,20%)、2 道 [20%,100%]、4 道 [-15%,0)，区间互不重叠
  push(() => genBasePeriod(0, 19.9), 6)
  push(() => genBasePeriod(20, 100), 2)
  push(() => genBasePeriod(-15, -0.1), 4)
  return qs
}

/** 套卷各模块在题列中的起止下标 */
export function examModuleRanges(): { label: string; start: number; end: number }[] {
  let start = 0
  return EXAM_SEGMENTS.map((s) => {
    const range = { label: s.label, start, end: start + s.count }
    start += s.count
    return range
  })
}

/** 填空题判卷：相对误差在 tolerance（默认 1%）以内判对 */
export function isWithinTolerance(user: number, answer: number, tolerance = 0.01): boolean {
  if (answer === 0) return Math.abs(user) <= tolerance
  return Math.abs(user - answer) / Math.abs(answer) <= tolerance
}
