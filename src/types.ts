export type QuestionType = 'addsub' | 'multiply' | 'fraction' | 'baseperiod'

export interface Term {
  sign: 1 | -1
  value: number
}

/** 多位加减法 */
export interface AddSubQuestion {
  type: 'addsub'
  terms: Term[]
  answer: number
}

/** 乘法：三位数 × 百分比 */
export interface MultiplyQuestion {
  type: 'multiply'
  base: number
  percent: number
  answer: number
}

export interface Fraction {
  n: number
  d: number
}

/** 分数比大小 */
export interface FractionQuestion {
  type: 'fraction'
  left: Fraction
  right: Fraction
  answer: '>' | '<'
}

/** 基期与增长量（填空，需同时输入两个答案） */
export interface BasePeriodQuestion {
  type: 'baseperiod'
  /** 现期量 A（至多五位整数） */
  amount: number
  /** 增长率 B（百分比数值，如 12.5 表示 12.5%） */
  percent: number
  /** 基期量 = A / (1 + B) */
  baseAnswer: number
  /** 增长量 = A - A / (1 + B) */
  growthAnswer: number
}

export type Question =
  | AddSubQuestion
  | MultiplyQuestion
  | FractionQuestion
  | BasePeriodQuestion

export interface AnswerPart {
  label: string
  userText: string
  correct: boolean
}

export interface AnswerRecord {
  userText: string
  correct: boolean
  timeMs: number
  /** 一题多答案（基期与增长量各占一项），分别判对错 */
  parts?: AnswerPart[]
}
