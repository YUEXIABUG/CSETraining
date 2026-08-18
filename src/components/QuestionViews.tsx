import { useState, type KeyboardEvent, type ReactNode } from 'react'
import type { BasePeriodQuestion, FractionQuestion } from '../types'

interface NumericViewProps {
  children: ReactNode
  hint?: string
  onAnswer: (text: string) => void
}

/** 填空类题目（加减法 / 乘法）：大字号算式 + 输入框 */
export function NumericQuestionView({ children, hint, onAnswer }: NumericViewProps) {
  const [value, setValue] = useState('')
  const empty = value.trim() === ''
  const submit = () => {
    if (empty) return
    onAnswer(value.trim())
  }
  return (
    <div className="text-center fade-in">
      <div className="question-expr">{children}</div>
      <div className="d-flex justify-content-center align-items-center gap-3 mt-4 flex-wrap">
        <input
          autoFocus
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="form-control form-control-lg answer-input"
          placeholder="输入答案"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <button type="button" className="btn btn-primary btn-lg px-4" disabled={empty} onClick={submit}>
          提交
        </button>
      </div>
      <div className="hint-text mt-3">{hint ?? '允许 1% 以内的误差 · 回车键快速提交'}</div>
    </div>
  )
}

function FractionDisplay({ n, d }: { n: number; d: number }) {
  return (
    <span className="frac">
      <span className="num">{n}</span>
      <span className="den">{d}</span>
    </span>
  )
}

/** 分数比大小：两个分数 + ＞ / ＜ 按钮 */
export function FractionView({
  q,
  onAnswer,
}: {
  q: FractionQuestion
  onAnswer: (rel: '>' | '<') => void
}) {
  return (
    <div className="text-center fade-in">
      <div className="d-flex justify-content-center align-items-center fraction-row">
        <FractionDisplay n={q.left.n} d={q.left.d} />
        <span className="qmark">?</span>
        <FractionDisplay n={q.right.n} d={q.right.d} />
      </div>
      <div className="d-flex justify-content-center gap-4 mt-4 flex-wrap">
        <button type="button" className="cmp-btn" onClick={() => onAnswer('>')} title="左边分数更大">
          ＞<small>左边更大</small>
        </button>
        <button type="button" className="cmp-btn" onClick={() => onAnswer('<')} title="右边分数更大">
          ＜<small>右边更大</small>
        </button>
      </div>
      <div className="hint-text mt-3">比较两个分数的大小（分子 ÷ 分母）</div>
    </div>
  )
}

/** 基期与增长量：同时填写基期量和增长量 */
export function BasePeriodView({
  q,
  onAnswer,
}: {
  q: BasePeriodQuestion
  onAnswer: (baseText: string, growthText: string) => void
}) {
  const [base, setBase] = useState('')
  const [growth, setGrowth] = useState('')
  const ready = base.trim() !== '' && growth.trim() !== ''
  const submit = () => {
    if (!ready) return
    onAnswer(base.trim(), growth.trim())
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit()
  }
  return (
    <div className="fade-in">
      <div className="choice-prompt text-center">
        <div>
          现期量 <strong>A = {q.amount}</strong>
          <span className="mx-2">，</span>
          增长率 <strong>B = {q.percent}%</strong>
        </div>
        <div className="choice-question mt-2">请同时计算基期量与增长量</div>
      </div>
      <div className="bp-inputs mt-4">
        <label className="bp-field">
          <span className="bp-label">基期量</span>
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className="form-control form-control-lg answer-input"
            placeholder="输入基期量"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </label>
        <label className="bp-field">
          <span className="bp-label">增长量</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className="form-control form-control-lg answer-input"
            placeholder="输入增长量"
            value={growth}
            onChange={(e) => setGrowth(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </label>
      </div>
      <div className="text-center mt-4">
        <button type="button" className="btn btn-primary btn-lg px-4" disabled={!ready} onClick={submit}>
          提交
        </button>
      </div>
      <div className="hint-text mt-3 text-center">两项均允许 1% 以内的误差 · 回车键快速提交</div>
    </div>
  )
}
