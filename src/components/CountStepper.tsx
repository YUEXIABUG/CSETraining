import { useEffect, useState } from 'react'

interface CountStepperProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  /** 输入框 id，用于与外部 label 关联 */
  id?: string
  /** 输入框的无障碍名称（外部已有 label 时可省略） */
  label?: string
  /** 减少按钮的无障碍名称 */
  decreaseLabel: string
  /** 增加按钮的无障碍名称 */
  increaseLabel: string
}

/**
 * 站内统一风格的题数步进器：自定义加减按钮替代浏览器原生数字输入框箭头，
 * 与圆角胶囊 / 蓝色强调色的整体设计保持一致，支持亮暗主题。
 */
export function CountStepper({
  value,
  min,
  max,
  onChange,
  id,
  label,
  decreaseLabel,
  increaseLabel,
}: CountStepperProps) {
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState(String(value))

  // 失焦时跟随外部值；聚焦时保留用户正在输入的内容
  useEffect(() => {
    if (!focused) setText(String(value))
  }, [value, focused])

  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)))

  const step = (delta: number) => {
    const next = clamp(value + delta)
    setText(String(next))
    onChange(next)
  }

  return (
    <div className="count-stepper">
      <button
        type="button"
        className="count-step-btn"
        aria-label={decreaseLabel}
        disabled={value <= min}
        onClick={() => step(-1)}
      >
        <i className="bi bi-dash-lg" aria-hidden="true" />
      </button>
      <input
        id={id}
        type="number"
        className="count-step-input"
        inputMode="numeric"
        min={min}
        max={max}
        aria-label={label}
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          setText(String(value))
        }}
        onChange={(e) => {
          const raw = e.target.value
          setText(raw)
          if (raw.trim() === '') return
          const v = Number(raw)
          if (!Number.isFinite(v)) return
          const next = clamp(v)
          setText(String(next))
          onChange(next)
        }}
      />
      <button
        type="button"
        className="count-step-btn"
        aria-label={increaseLabel}
        disabled={value >= max}
        onClick={() => step(1)}
      >
        <i className="bi bi-plus-lg" aria-hidden="true" />
      </button>
    </div>
  )
}
