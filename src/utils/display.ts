import type { AddSubQuestion } from '../types'

/** 毫秒格式化：只显示整数秒，≥60s 显示「M 分 SS 秒」 */
export function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${m} 分 ${String(s).padStart(2, '0')} 秒` : `${s} 秒`
}

export function formatNumber(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(2)
}

/** 紧凑时长（进度轴用）：12秒 / 2分05秒 */
export function formatMsShort(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${m}分${String(s).padStart(2, '0')}秒` : `${s}秒`
}

export function addSubExpression(q: AddSubQuestion): string {
  return q.terms
    .map((t, i) => (i === 0 ? `${t.value}` : ` ${t.sign === 1 ? '+' : '−'} ${t.value}`))
    .join('')
}
