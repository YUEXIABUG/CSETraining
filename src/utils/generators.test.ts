import { describe, expect, it } from 'vitest'
import {
  genAddSub,
  genBasePeriod,
  genFraction,
  genMultiply,
  isWithinTolerance,
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
  it('分子分母为整数，两分数值相差 5% 以内且不相等，答案与真实大小一致', () => {
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
      expect(l).not.toBe(r)
      const rel = Math.abs(l - r) / l
      expect(rel).toBeGreaterThan(0)
      expect(rel).toBeLessThanOrEqual(0.05)
      expect(q.answer).toBe(l > r ? '>' : '<')
    }
  })
})

describe('genBasePeriod 基期与增长量', () => {
  it('A 为四至五位整数，B 小于 100%，基期量与增长量符合公式且和为 A', () => {
    for (let i = 0; i < 300; i++) {
      const q = genBasePeriod()
      expect(q.amount).toBeGreaterThanOrEqual(1000)
      expect(q.amount).toBeLessThanOrEqual(99999)
      expect(Number.isInteger(q.amount)).toBe(true)
      expect(q.percent).toBeGreaterThan(0)
      expect(q.percent).toBeLessThan(100)
      const b = q.percent / 100
      expect(q.baseAnswer).toBeCloseTo(q.amount / (1 + b), 10)
      expect(q.growthAnswer).toBeCloseTo(q.amount - q.amount / (1 + b), 10)
      expect(q.baseAnswer + q.growthAnswer).toBeCloseTo(q.amount, 8)
    }
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
})
