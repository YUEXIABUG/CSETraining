import type { QuestionType } from './types'

export interface CategoryMeta {
  type: QuestionType
  title: string
  icon: string
  tint: string
}

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
]

export function isQuestionType(v: string | undefined): v is QuestionType {
  return v === 'addsub' || v === 'multiply' || v === 'fraction' || v === 'baseperiod'
}
