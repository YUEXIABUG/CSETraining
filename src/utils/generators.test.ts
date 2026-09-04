import { describe, expect, it } from 'vitest'
import { CATEGORIES } from '../meta'
import type { BasePeriodQuestion } from '../types'
import {
  EXAM_SEGMENTS,
  examModuleRanges,
  genAddSub,
  genBasePeriod,
  genBasePeriodShare,
  genFraction,
  genMultiply,
  genShareGap,
  generateExam,
  isWithinTolerance,
  type ExamSegment,
} from './generators'

describe('genAddSub 多位加减法', () => {
  it('四个数均为 3~4 位，至多一个三位数、至多一个减号，结果为正且首项为正', () => {
    for (let i = 0; i < 500; i++) {
      const q = genAddSub()
      expect(q.terms).toHaveLength(4)
      let threeDigit = 0
      let subtraction = 0
      let sum = 0
      for (const t of q.terms) {
        expect(t.value).toBeGreaterThanOrEqual(100)
        expect(t.value).toBeLessThanOrEqual(9999)
        if (t.value <= 999) threeDigit += 1
        if (t.sign === -1) subtraction += 1
        sum += t.sign * t.value
      }
      expect(threeDigit).toBeLessThanOrEqual(1)
      expect(subtraction).toBeLessThanOrEqual(1)
      expect(sum).toBeGreaterThan(0)
      expect(q.answer).toBe(sum)
      expect(q.terms[0].sign).toBe(1)
    }
  })
})

describe('genMultiply 乘法运算', () => {
  it('三位整数 × 小于 100% 的一位小数百分比', () => {
    for (let i = 0; i < 300; i++) {
      const q = genMultiply()
      expect(q.base).toBeGreaterThanOrEqual(100)
      expect(q.base).toBeLessThanOrEqual(999)
      expect(Number.isInteger(q.base)).toBe(true)
      expect(q.percent).toBeGreaterThan(0)
      expect(q.percent).toBeLessThan(100)
      // 保证是一位小数
      expect(Math.abs(q.percent * 10 - Math.round(q.percent * 10))).toBeLessThan(1e-9)
      expect(q.answer).toBeCloseTo((q.base * q.percent) / 100, 10)
    }
  })
})

describe('genFraction 分数比大小', () => {
  it('分子分母为整数，两分数值均在 1% ~ 10% 之间、相差 5% 以内且不相等，答案与真实大小一致', () => {
    for (let i = 0; i < 300; i++) {
      const q = genFraction()
      for (const f of [q.left, q.right]) {
        expect(Number.isInteger(f.n)).toBe(true)
        expect(Number.isInteger(f.d)).toBe(true)
        expect(f.n).toBeGreaterThan(0)
        expect(f.d).toBeGreaterThan(0)
      }
      const l = q.left.n / q.left.d
      const r = q.right.n / q.right.d
      expect(l).toBeGreaterThanOrEqual(0.01)
      expect(l).toBeLessThanOrEqual(0.1)
      expect(r).toBeGreaterThanOrEqual(0.01)
      expect(r).toBeLessThanOrEqual(0.1)
      expect(l).not.toBe(r)
      const rel = Math.abs(l - r) / l
      expect(rel).toBeGreaterThan(0)
      expect(rel).toBeLessThanOrEqual(0.05)
      expect(q.answer).toBe(l > r ? '>' : '<')
    }
  })
})

describe('genBasePeriod 基期与增长量', () => {
  it('默认增长率 -15% ~ 70%，基期量与增长量符合公式且和为 A', () => {
    for (let i = 0; i < 300; i++) {
      const q = genBasePeriod()
      expect(q.amount).toBeGreaterThanOrEqual(100)
      expect(q.amount).toBeLessThanOrEqual(99999)
      expect(Number.isInteger(q.amount)).toBe(true)
      expect(q.percent).toBeGreaterThanOrEqual(-15)
      expect(q.percent).toBeLessThanOrEqual(70)
      const b = q.percent / 100
      expect(q.baseAnswer).toBeCloseTo(q.amount / (1 + b), 10)
      expect(q.growthAnswer).toBeCloseTo(q.amount - q.amount / (1 + b), 10)
      expect(q.baseAnswer + q.growthAnswer).toBeCloseTo(q.amount, 8)
    }
  })

  it('支持自定义增长率区间', () => {
    for (let i = 0; i < 100; i++) {
      const a = genBasePeriod(0, 19.9)
      expect(a.percent).toBeGreaterThanOrEqual(0)
      expect(a.percent).toBeLessThan(20)
      const b = genBasePeriod(20, 70)
      expect(b.percent).toBeGreaterThanOrEqual(20)
      expect(b.percent).toBeLessThanOrEqual(70)
      const c = genBasePeriod(-15, -0.1)
      expect(c.percent).toBeGreaterThanOrEqual(-15)
      expect(c.percent).toBeLessThan(0)
    }
  })
})

describe('genBasePeriodShare 基期比重选择题', () => {
  it('B 比 A 大 10%~30%，增长率 ±20% 一位小数且至少相差 5 个百分点，答案符合公式且选项格式统一', () => {
    for (let i = 0; i < 200; i++) {
      const q = genBasePeriodShare()
      expect(q.part).toBeGreaterThanOrEqual(1000)
      expect(q.part).toBeLessThanOrEqual(7691)
      expect(q.total).toBeGreaterThan(q.part)
      expect(q.total).toBeLessThanOrEqual(9999)
      // B 比 A 大 10%~30%
      const gap = (q.total - q.part) / q.part
      expect(gap).toBeGreaterThanOrEqual(0.1 - 1e-9)
      expect(gap).toBeLessThanOrEqual(0.3 + 1e-9)
      expect(Math.abs(q.ra)).toBeLessThanOrEqual(20)
      expect(Math.abs(q.rb)).toBeLessThanOrEqual(20)
      // 两个增长率至少相差 5 个百分点
      expect(Math.abs(q.ra - q.rb)).toBeGreaterThanOrEqual(5 - 1e-9)
      // 一位小数
      expect(Math.abs(q.ra * 10 - Math.round(q.ra * 10))).toBeLessThan(1e-9)
      expect(Math.abs(q.rb * 10 - Math.round(q.rb * 10))).toBeLessThan(1e-9)
      expect(q.options).toHaveLength(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
      // 答案符合基期比重公式
      const expected = (q.part / q.total) * ((1 + q.rb / 100) / (1 + q.ra / 100)) * 100
      expect(q.answer).toBeCloseTo(expected, 1)
      // 选项统一为「整数部分位数一致的两位小数百分比」
      for (const opt of q.options) {
        expect(opt).toMatch(/^\d+\.\d{2}%$/)
      }
      const digits = new Set(q.options.map((o) => o.split('.')[0].length))
      expect(digits.size).toBe(1)
      // 正确选项与答案一致
      expect(q.options[q.correctIndex]).toBe(`${q.answer.toFixed(2)}%`)
      // 四个选项互不相同
      expect(new Set(q.options).size).toBe(4)
    }
  })
})

describe('genShareGap 比重差选择题', () => {
  const parse = (s: string) => {
    const m = s.match(/^(上升|下降) ([\d.]+) 个百分点$/)
    expect(m).not.toBeNull()
    return { dir: m![1], val: Number.parseFloat(m![2]) }
  }

  it('B 比 A 大 10%~30%，增长率至少相差 5 个百分点，方向与数值符合公式，两组数值相差 20% 以内', () => {
    for (let i = 0; i < 200; i++) {
      const q = genShareGap()
      expect(q.part).toBeGreaterThanOrEqual(1000)
      expect(q.part).toBeLessThanOrEqual(7691)
      expect(q.total).toBeGreaterThan(q.part)
      expect(q.total).toBeLessThanOrEqual(9999)
      // B 比 A 大 10%~30%
      const gap = (q.total - q.part) / q.part
      expect(gap).toBeGreaterThanOrEqual(0.1 - 1e-9)
      expect(gap).toBeLessThanOrEqual(0.3 + 1e-9)
      // 两个增长率至少相差 5 个百分点
      expect(Math.abs(q.ra - q.rb)).toBeGreaterThanOrEqual(5 - 1e-9)
      expect(q.options).toHaveLength(4)
      const opts = q.options.map(parse)
      // A/C 上升，B/D 下降
      expect(opts[0].dir).toBe('上升')
      expect(opts[1].dir).toBe('下降')
      expect(opts[2].dir).toBe('上升')
      expect(opts[3].dir).toBe('下降')
      // A 与 B 数值一致、C 与 D 数值一致
      expect(opts[0].val).toBe(opts[1].val)
      expect(opts[2].val).toBe(opts[3].val)
      // 两组数值相差 20% 以内
      const v1 = opts[0].val
      const v2 = opts[2].val
      expect(v1).not.toBe(v2)
      expect(Math.abs(v1 - v2) / Math.max(v1, v2)).toBeLessThanOrEqual(0.2)
      // 正确选项的方向与数值符合公式
      const gapPp = (q.part / q.total) * ((q.ra - q.rb) / (1 + q.ra / 100))
      const rising = q.ra > q.rb
      expect(q.answer).toBeCloseTo(gapPp, 2)
      const correct = opts[q.correctIndex]
      expect(correct.dir).toBe(rising ? '上升' : '下降')
      expect(correct.val).toBeCloseTo(Math.abs(gapPp), 1)
    }
  })
})

describe('generateExam 套卷模式', () => {
  it('共 34 题，各模块题数正确', () => {
    const qs = generateExam()
    expect(qs).toHaveLength(34)
    const count = (t: string) => qs.filter((q) => q.type === t).length
    expect(count('addsub')).toBe(4)
    expect(count('fraction')).toBe(4)
    expect(count('multiply')).toBe(10)
    expect(count('baseperiodshare')).toBe(2)
    expect(count('sharegap')).toBe(2)
    expect(count('baseperiod')).toBe(12)
  })

  it('基期增量 12 题分布为 6 道 [0,20%)、2 道 [20%,70%]、4 道 [-15%,0)', () => {
    const qs = generateExam()
    const bps = qs.filter((q) => q.type === 'baseperiod') as BasePeriodQuestion[]
    expect(bps).toHaveLength(12)
    expect(bps.filter((q) => q.percent >= 0 && q.percent < 20)).toHaveLength(6)
    expect(bps.filter((q) => q.percent >= 20)).toHaveLength(2)
    expect(bps.filter((q) => q.percent < 0)).toHaveLength(4)
  })

  it('examModuleRanges 分段下标连续且总数 34', () => {
    const ranges = examModuleRanges()
    let prev = 0
    for (const r of ranges) {
      expect(r.start).toBe(prev)
      expect(r.end).toBeGreaterThan(r.start)
      prev = r.end
    }
    expect(prev).toBe(34)
  })

  it('EXAM_SEGMENTS 各分段与单项训练模块一一对应（不含套卷自身）', () => {
    const types = EXAM_SEGMENTS.map((s) => s.type)
    expect(new Set(types).size).toBe(EXAM_SEGMENTS.length)
    expect(types).not.toContain('exam')
    for (const c of CATEGORIES) {
      expect(types).toContain(c.type)
    }
  })

  it('支持自定义分段：按分段顺序与题数出题', () => {
    const segments: ExamSegment[] = [
      { label: '加减法', count: 2, type: 'addsub' },
      { label: '乘法运算', count: 3, type: 'multiply' },
      { label: '基期增量', count: 1, type: 'baseperiod' },
    ]
    const qs = generateExam(segments)
    expect(qs).toHaveLength(6)
    expect(qs.filter((q) => q.type === 'addsub')).toHaveLength(2)
    expect(qs.filter((q) => q.type === 'multiply')).toHaveLength(3)
    expect(qs.filter((q) => q.type === 'baseperiod')).toHaveLength(1)
    // 出题顺序与分段顺序一致
    expect(qs[0].type).toBe('addsub')
    expect(qs[1].type).toBe('addsub')
    expect(qs[2].type).toBe('multiply')
    expect(qs[5].type).toBe('baseperiod')
  })

  it('自定义分段的 examModuleRanges：跳过 0 题分段且下标连续', () => {
    const ranges = examModuleRanges([
      { label: '加减法', count: 2, type: 'addsub' },
      { label: '比较大小', count: 0, type: 'fraction' },
      { label: '乘法运算', count: 3, type: 'multiply' },
    ])
    expect(ranges).toEqual([
      { label: '加减法', start: 0, end: 2 },
      { label: '乘法运算', start: 2, end: 5 },
    ])
  })
})

describe('isWithinTolerance 判卷', () => {
  it('相对误差 1% 以内判对，否则判错', () => {
    expect(isWithinTolerance(100, 100)).toBe(true)
    expect(isWithinTolerance(100.9, 100)).toBe(true)
    expect(isWithinTolerance(101.2, 100)).toBe(false)
    expect(isWithinTolerance(99, 100)).toBe(true)
    expect(isWithinTolerance(98.9, 100)).toBe(false)
    // 342 × 32.6% = 111.492，答 112 误差约 0.46% 应判对
    expect(isWithinTolerance(112, (342 * 32.6) / 100)).toBe(true)
  })

  it('支持自定义容差：基期与增长量允许 2% 以内误差', () => {
    expect(isWithinTolerance(101.9, 100, 0.02)).toBe(true)
    expect(isWithinTolerance(102.1, 100, 0.02)).toBe(false)
    expect(isWithinTolerance(98.1, 100, 0.02)).toBe(true)
    expect(isWithinTolerance(97.9, 100, 0.02)).toBe(false)
    // 增长量为负（下降）时同样按相对误差判断
    expect(isWithinTolerance(-1970, -2000, 0.02)).toBe(true)
    expect(isWithinTolerance(-1950, -2000, 0.02)).toBe(false)
  })
})
