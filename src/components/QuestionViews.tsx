import type { KeyboardEvent, ReactNode } from 'react'
import type { BasePeriodQuestion, BasePeriodShareQuestion, FractionQuestion, ShareGapQuestion } from '../types'

interface NumericViewProps {
  children: ReactNode
  hint?: string
  value: string
  onChange: (v: string) => void
  /** 回车键触发的主操作（下一题 / 提交） */
  onEnter: () => void
}

/** 填空类题目（加减法 / 乘法）：大字号算式 + 输入框 */
export function NumericQuestionView({ children, hint, value, onChange, onEnter }: NumericViewProps) {
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
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEnter()
          }}
        />
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

/** 分数比大小：两个分数 + ＞ / ＜ 按钮（选中后可修改，由外部统一提交） */
export function FractionView({
  q,
  selected,
  onSelect,
}: {
  q: FractionQuestion
  selected?: '>' | '<'
  onSelect: (rel: '>' | '<') => void
}) {
  return (
    <div className="text-center fade-in">
      <div className="d-flex justify-content-center align-items-center fraction-row">
        <FractionDisplay n={q.left.n} d={q.left.d} />
        <span className="qmark">?</span>
        <FractionDisplay n={q.right.n} d={q.right.d} />
      </div>
      <div className="d-flex justify-content-center gap-4 mt-4 flex-wrap">
        <button
          type="button"
          className={`cmp-btn ${selected === '>' ? 'selected' : ''}`}
          onClick={() => onSelect('>')}
          title="左边分数更大"
        >
          ＞<small>左边更大</small>
        </button>
        <button
          type="button"
          className={`cmp-btn ${selected === '<' ? 'selected' : ''}`}
          onClick={() => onSelect('<')}
          title="右边分数更大"
        >
          ＜<small>右边更大</small>
        </button>
      </div>
      <div className="hint-text mt-3">比较两个分数的大小（分子 ÷ 分母）· 点击选项后自动进入下一题</div>
    </div>
  )
}

/** 基期与增长量：同时填写基期量和增长量 */
export function BasePeriodView({
  q,
  base,
  growth,
  onBase,
  onGrowth,
  onEnter,
}: {
  q: BasePeriodQuestion
  base: string
  growth: string
  onBase: (v: string) => void
  onGrowth: (v: string) => void
  onEnter: () => void
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onEnter()
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
            onChange={(e) => onBase(e.target.value)}
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
            onChange={(e) => onGrowth(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </label>
      </div>
      <div className="hint-text mt-3 text-center">两项均允许 2% 以内的误差 · 增长量可为负</div>
    </div>
  )
}

const LETTERS = ['A', 'B', 'C', 'D']

/** 基期比重 / 比重差选择题：题干 + A/B/C/D 四个选项 */
export function ChoiceView({
  q,
  selected,
  onSelect,
}: {
  q: BasePeriodShareQuestion | ShareGapQuestion
  selected?: number
  onSelect: (i: number) => void
}) {
  const isGap = q.type === 'sharegap'
  return (
    <div className="fade-in">
      <div className="choice-prompt text-center">
        <div>
          现期部分 <strong>A = {q.part}</strong>
          <span className="mx-2">，</span>
          现期整体 <strong>B = {q.total}</strong>
        </div>
        <div className="mt-1">
          部分增长率{' '}
          <strong>
            r<sub>A</sub> = {q.ra}%
          </strong>
          <span className="mx-2">，</span>
          整体增长率{' '}
          <strong>
            r<sub>B</sub> = {q.rb}%
          </strong>
        </div>
        <div className="choice-question mt-2">{isGap ? '则比重差为？' : '则基期比重约为？'}</div>
      </div>
      <div className="choice-options mt-4">
        {q.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            className={`choice-opt ${selected === i ? 'selected' : ''}`}
            onClick={() => onSelect(i)}
          >
            <span className="choice-letter">{LETTERS[i]}</span>
            <span className="choice-text">{opt}</span>
          </button>
        ))}
      </div>
      <div className="hint-text mt-3 text-center">
        {isGap
          ? '比重差 = (A ÷ B) × (rA − rB) ÷ (1 + rA)，rA ＞ rB 时比重上升'
          : '基期比重 = (A ÷ B) × (1 + rB) ÷ (1 + rA)'}
        <span className="d-block mt-1">点击选项后自动进入下一题</span>
      </div>
    </div>
  )
}
