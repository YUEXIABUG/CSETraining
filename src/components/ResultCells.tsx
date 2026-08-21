import type { AnswerRecord, Question } from '../types'
import { addSubExpression, formatNumber } from '../utils/display'
import { fmtTrim } from '../utils/generators'

const LETTERS = ['A', 'B', 'C', 'D']

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
          A = {q.amount}，增长率 = {q.percent}%
        </span>
      )
    case 'baseperiodshare':
    case 'sharegap':
      return (
        <span className="summary-cell">
          A = {q.part}，B = {q.total}，r<sub>A</sub> = {q.ra}%，r<sub>B</sub> = {q.rb}%
        </span>
      )
  }
}

/** 我的答案列 */
export function UserAnswerCell({ q, r }: { q: Question; r?: AnswerRecord }) {
  if (!r) return <>—</>
  if (r.skipped || r.userText === '') return <span className="text-muted">未作答</span>
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
            基期量 = {q.amount} ÷ (1 {q.percent >= 0 ? '+' : '−'} {Math.abs(q.percent)}%) ≈{' '}
            {formatNumber(Math.round(q.baseAnswer * 100) / 100)}
          </div>
          <div>
            增长量 = {q.amount} − 基期量 ≈ {formatNumber(Math.round(q.growthAnswer * 100) / 100)}
          </div>
        </div>
      )
    case 'baseperiodshare':
      return (
        <div className="cell-stack">
          <div>
            基期比重 = ({q.part} ÷ {q.total}) × (1 {q.rb >= 0 ? '+' : '−'} {Math.abs(q.rb)}%) ÷ (1{' '}
            {q.ra >= 0 ? '+' : '−'} {Math.abs(q.ra)}%) ≈ <strong>{q.answer.toFixed(2)}%</strong>
          </div>
          <div className="text-muted small">正确选项：{LETTERS[q.correctIndex]}</div>
        </div>
      )
    case 'sharegap': {
      const rising = q.ra > q.rb
      return (
        <div className="cell-stack">
          <div>
            比重差 = ({q.part} ÷ {q.total}) × ({fmtTrim(q.ra)}% {q.rb >= 0 ? '−' : '+'}{' '}
            {fmtTrim(Math.abs(q.rb))}%) ÷ (1 {q.ra >= 0 ? '+' : '−'} {Math.abs(q.ra)}%) ≈{' '}
            <strong>
              {rising ? '上升' : '下降'} {fmtTrim(Math.abs(q.answer))} 个百分点
            </strong>
          </div>
          <div className="text-muted small">
            部分增速 r<sub>A</sub> {rising ? '＞' : '＜'} 整体增速 r<sub>B</sub>，故比重{rising ? '上升' : '下降'} · 正确选项：
            {LETTERS[q.correctIndex]}
          </div>
        </div>
      )
    }
  }
}

/** 结果列 */
export function ResultCell({ q, r }: { q: Question; r?: AnswerRecord }) {
  if (!r) return <>—</>
  if (r.skipped || r.userText === '') return <span className="mark-skipped">○ 未答</span>
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

/** 成绩单记录卡片左侧的状态徽标 */
export function ResultBadge({ r }: { r?: AnswerRecord }) {
  if (!r || r.skipped || r.userText === '') return <span className="record-badge badge-skipped">未答</span>
  return r.correct ? (
    <span className="record-badge badge-correct">答对</span>
  ) : (
    <span className="record-badge badge-wrong">答错</span>
  )
}
