import type {
  AddSubQuestion,
  BasePeriodQuestion,
  FractionQuestion,
  MultiplyQuestion,
  Question,
  QuestionType,
  Term,
} from '../types'

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
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

/** 基期与增长量：A（四至五位）与 B（100% 以内），需同时计算基期量与增长量 */
export function genBasePeriod(): BasePeriodQuestion {
  const amount = randInt(1000, 99999)
  const percent = randInt(20, 999) / 10 // 2.0% ~ 99.9%
  const b = percent / 100
  const baseAnswer = amount / (1 + b)
  const growthAnswer = amount - baseAnswer
  return { type: 'baseperiod', amount, percent, baseAnswer, growthAnswer }
}

const GENERATORS: Record<QuestionType, () => Question> = {
  addsub: genAddSub,
  multiply: genMultiply,
  fraction: genFraction,
  baseperiod: genBasePeriod,
}

export function generateSet(type: QuestionType, count: number): Question[] {
  return Array.from({ length: count }, () => GENERATORS[type]())
}

/** 填空题判卷：相对误差在 tolerance（默认 1%）以内判对 */
export function isWithinTolerance(user: number, answer: number, tolerance = 0.01): boolean {
  if (answer === 0) return Math.abs(user) <= tolerance
  return Math.abs(user - answer) / Math.abs(answer) <= tolerance
}
