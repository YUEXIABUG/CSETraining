export type QuestionType =
  | 'addsub'
  | 'multiply'
  | 'fraction'
  | 'baseperiod'
  | 'baseperiodshare'
  | 'sharegap'
  | 'exam'

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
  /** 增长率 B（百分比数值，如 12.5 表示 12.5%，可为负） */
  percent: number
  /** 基期量 = A / (1 + B) */
  baseAnswer: number
  /** 增长量 = A - A / (1 + B) */
  growthAnswer: number
}

/** 基期比重（单选）：由现期部分/整体及各自增长率求基期比重 */
export interface BasePeriodShareQuestion {
  type: 'baseperiodshare'
  /** 现期部分值 A（四位整数） */
  part: number
  /** 现期整体值 B（四位整数） */
  total: number
  /** 部分增长率（百分比数值，一位小数） */
  ra: number
  /** 整体增长率（百分比数值，一位小数） */
  rb: number
  /** 四个选项（统一格式的百分比字符串） */
  options: string[]
  correctIndex: number
  /** 正确的基期比重（百分比数值） */
  answer: number
}

/** 比重差（单选）：判断两期比重之差的方向与数值 */
export interface ShareGapQuestion {
  type: 'sharegap'
  /** 现期部分值 A（四位整数） */
  part: number
  /** 现期整体值 B（四位整数） */
  total: number
  /** 部分增长率 rA（百分比数值，一位小数） */
  ra: number
  /** 整体增长率 rB（百分比数值，一位小数） */
  rb: number
  /** 四个选项：A/C 上升、B/D 下降，A 与 B 数值一致、C 与 D 数值一致 */
  options: string[]
  correctIndex: number
  /** 正确的比重差（百分点，带符号：正为上升） */
  answer: number
}

export type Question =
  | AddSubQuestion
  | MultiplyQuestion
  | FractionQuestion
  | BasePeriodQuestion
  | BasePeriodShareQuestion
  | ShareGapQuestion

export interface AnswerPart {
  label: string
  userText: string
  correct: boolean
}

export interface AnswerRecord {
  userText: string
  correct: boolean
  timeMs: number
  /** 未作答（跳过/留空） */
  skipped?: boolean
  /** 一题多答案（基期与增长量各占一项），分别判对错 */
  parts?: AnswerPart[]
}
