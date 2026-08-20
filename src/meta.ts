import type { QuestionType } from './types'

export interface CategoryMeta {
  type: QuestionType
  title: string
  icon: string
  tint: string
  desc: string
}

/** 单项训练模块（题数可自选） */
export const CATEGORIES: CategoryMeta[] = [
  {
    type: 'addsub',
    title: '多位加减法',
    icon: 'bi-plus-slash-minus',
    tint: 'tint-blue',
    desc: '四个三至四位整数加减混合，答案须完全准确',
  },
  {
    type: 'multiply',
    title: '乘法运算',
    icon: 'bi-calculator',
    tint: 'tint-orange',
    desc: '三位整数 × 一位小数百分比，允许 1% 误差',
  },
  {
    type: 'fraction',
    title: '分数比大小',
    icon: 'bi-arrow-left-right',
    tint: 'tint-green',
    desc: '比较两个接近的分数大小，点击按钮作答',
  },
  {
    type: 'baseperiod',
    title: '基期与增长量',
    icon: 'bi-graph-up-arrow',
    tint: 'tint-purple',
    desc: '现期量与增长率（-15% ~ 100%），求基期量与增长量',
  },
  {
    type: 'baseperiodshare',
    title: '基期比重 · 选择',
    icon: 'bi-pie-chart',
    tint: 'tint-teal',
    desc: '由现期部分/整体与各自增长率，选出正确的基期比重',
  },
  {
    type: 'sharegap',
    title: '比重差 · 选择',
    icon: 'bi-bar-chart-steps',
    tint: 'tint-pink',
    desc: '判断两期比重之差的方向与数值',
  },
]

/** 套卷模式（固定 34 题，分模块出题） */
export const EXAM_CATEGORY: CategoryMeta = {
  type: 'exam',
  title: '套卷模式',
  icon: 'bi-journal-text',
  tint: 'tint-indigo',
  desc: '4 加减法 + 4 比大小 + 10 乘法 + 2 基期比重 + 2 比重差 + 12 基期增量，共 34 题',
}

export function isQuestionType(v: string | undefined): v is QuestionType {
  return (
    v === 'addsub' ||
    v === 'multiply' ||
    v === 'fraction' ||
    v === 'baseperiod' ||
    v === 'baseperiodshare' ||
    v === 'sharegap' ||
    v === 'exam'
  )
}

export function categoryOf(type: QuestionType): CategoryMeta {
  if (type === 'exam') return EXAM_CATEGORY
  return CATEGORIES.find((c) => c.type === type) ?? CATEGORIES[0]
}
