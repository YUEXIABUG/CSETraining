import type { AnswerRecord, Question } from '../types'
import { addSubExpression, formatNumber } from '../utils/display'

/** 成绩单中的小号分数展示（分子 / 分数线 / 分母） */
export function FractionInline({ n, d }: { n: number; d: number }) {
  return (
    <span className="frac-inline">
      <span className="num">{n}</span>
      <span className="den">{d}</span>
    </span>
  )
}

/** 题目列 */
export function SummaryCell({ q }: { q: Question }) {
  switch (q.type) {
    case 'addsub':
      return <span className="summary-cell">{addSubExpression(q)}</span>
    case 'multiply':
      return (
        <span className="summary-cell">
          {q.base} × {q.percent}%
        </span>
      )
    case 'fraction':
      return (
        <span className="d-inline-flex align-items-center gap-2">
          <FractionInline n={q.left.n} d={q.left.d} />
          <span className="text-muted">？</span>
          <FractionInline n={q.right.n} d={q.right.d} />
        </span>
      )
    case 'baseperiod':
      return (
        <span className="summary-cell">
          A = {q.amount}，B = {q.percent}%
        </span>
      )
  }
}

/** 我的答案列 */
export function UserAnswerCell({ q, r }: { q: Question; r?: AnswerRecord }) {
  if (!r) return <>—</>
  if (q.type === 'baseperiod' && r.parts) {
    return (
      <div className="cell-stack">
        {r.parts.map((p) => (
          <div key={p.label}>
            <span className="text-muted">{p.label}：</span>
            {p.userText}
          </div>
        ))}
      </div>
    )
  }
  return <>{r.userText}</>
}

/** 正确答案列（含计算过程） */
export function CorrectAnswerCell({ q }: { q: Question }) {
  switch (q.type) {
    case 'addsub':
      return (
        <>
          {addSubExpression(q)} = {q.answer}
        </>
      )
    case 'multiply':
      return (
        <>
          {q.base} × {q.percent}% ≈ {formatNumber(q.answer)}
        </>
      )
    case 'fraction': {
      const l = q.left.n / q.left.d
      const r = q.right.n / q.right.d
      return (
        <span className="d-inline-flex align-items-center gap-2 flex-wrap">
          <FractionInline n={q.left.n} d={q.left.d} />
          <strong>{q.answer === '>' ? '＞' : '＜'}</strong>
          <FractionInline n={q.right.n} d={q.right.d} />
          <span className="text-muted small">
            （≈ {l.toFixed(4)} {q.answer} {r.toFixed(4)}）
          </span>
        </span>
      )
    }
    case 'baseperiod':
      return (
        <div className="cell-stack">
          <div>
            基期量 = {q.amount} ÷ (1 + {q.percent}%) ≈ {Math.round(q.baseAnswer)}
          </div>
          <div>
            增长量 = {q.amount} − {q.amount} ÷ (1 + {q.percent}%) ≈ {Math.round(q.growthAnswer)}
          </div>
        </div>
      )
  }
}

/** 结果列：基期与增长量分别标注对错 */
export function ResultCell({ q, r }: { q: Question; r?: AnswerRecord }) {
  if (!r) return <>—</>
  if (q.type === 'baseperiod' && r.parts) {
    return (
      <div className="cell-stack">
        {r.parts.map((p) => (
          <div key={p.label} className="text-nowrap">
            <span className="text-muted">{p.label}</span>{' '}
            {p.correct ? <span className="mark-correct">✓</span> : <span className="mark-wrong">✗</span>}
          </div>
        ))}
      </div>
    )
  }
  return r.correct ? <span className="mark-correct">✓ 正确</span> : <span className="mark-wrong">✗ 错误</span>
}
