import type { QuestionType } from './types'

export interface CategoryMeta {
  type: QuestionType
  title: string
  desc: string
  icon: string
  tint: string
}

export const CATEGORIES: CategoryMeta[] = [
  {
    type: 'addsub',
    title: '多位加减法',
    desc: '四个三至四位整数加减混合，至多一个减号、一个三位数',
    icon: 'bi-plus-slash-minus',
    tint: 'tint-blue',
  },
  {
    type: 'multiply',
    title: '乘法运算',
    desc: '三位整数 × 小于 100% 的百分比，练百分数速算',
    icon: 'bi-calculator',
    tint: 'tint-orange',
  },
  {
    type: 'fraction',
    title: '分数比大小',
    desc: '两个相差 5% 以内的分数，点击 ＞ / ＜ 快速比较',
    icon: 'bi-arrow-left-right',
    tint: 'tint-green',
  },
  {
    type: 'baseperiod',
    title: '基期与增长量',
    desc: '由现期量 A 与增长率 B，同时计算基期量与增长量',
    icon: 'bi-graph-up-arrow',
    tint: 'tint-purple',
  },
]

export function isQuestionType(v: string | undefined): v is QuestionType {
  return v === 'addsub' || v === 'multiply' || v === 'fraction' || v === 'baseperiod'
}
