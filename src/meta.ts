import type { QuestionType } from './types'

export interface CategoryMeta {
  type: QuestionType
  title: string
  icon: string
  tint: string
}

/** 单项训练模块（题数可自选） */
export const CATEGORIES: CategoryMeta[] = [
  {
    type: 'addsub',
    title: '多位加减法',
    icon: 'bi-plus-slash-minus',
    tint: 'tint-blue',
  },
  {
    type: 'multiply',
    title: '乘法运算',
    icon: 'bi-calculator',
    tint: 'tint-orange',
  },
  {
    type: 'fraction',
    title: '分数比大小',
    icon: 'bi-arrow-left-right',
    tint: 'tint-green',
  },
  {
    type: 'baseperiod',
    title: '基期与增长量',
    icon: 'bi-graph-up-arrow',
    tint: 'tint-purple',
  },
  {
    type: 'baseperiodshare',
    title: '基期比重 · 选择',
    icon: 'bi-pie-chart',
    tint: 'tint-teal',
  },
  {
    type: 'sharegap',
    title: '比重差 · 选择',
    icon: 'bi-bar-chart-steps',
    tint: 'tint-pink',
  },
]

/** 套卷模式（固定 34 题，分模块出题） */
export const EXAM_CATEGORY: CategoryMeta = {
  type: 'exam',
  title: '套卷模式',
  icon: 'bi-journal-text',
  tint: 'tint-indigo',
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
