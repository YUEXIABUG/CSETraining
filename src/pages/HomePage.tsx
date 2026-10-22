import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { CountStepper } from '../components/CountStepper'
import { ThemeToggle } from '../components/ThemeToggle'
import { CATEGORIES, EXAM_CATEGORY } from '../meta'
import { EXAM_SEGMENTS, type ExamSegment } from '../utils/generators'

const PRESETS = [5, 10, 15, 20]
const STORAGE_KEY = 'cse-training-count'
/** 自定义套卷：各题型题数（0 表示不包含该题型） */
type ExamType = ExamSegment['type']
type ExamCounts = Partial<Record<ExamType, number>>
const EXAM_CUSTOM_KEY = 'cse-training-exam-custom'
const EXAM_ORDER_KEY = 'cse-training-exam-order'
const EXAM_TYPE_MAX = 100

const SEGMENT_BY_TYPE = new Map<ExamType, ExamSegment>(
  EXAM_SEGMENTS.map((s) => [s.type, s] as const),
)
const DEFAULT_EXAM_ORDER = EXAM_SEGMENTS.map((s) => s.type)

interface DropTarget {
  type: ExamType
  /** true 表示插入到目标题型之后，false 表示之前 */
  after: boolean
}

function loadCount(): number {
  const saved = Number(sessionStorage.getItem(STORAGE_KEY))
  return Number.isFinite(saved) && saved >= 1 && saved <= 100 ? saved : 5
}

function defaultExamCounts(): ExamCounts {
  const counts: ExamCounts = {}
  for (const s of EXAM_SEGMENTS) counts[s.type] = s.count
  return counts
}

function loadExamCounts(): ExamCounts {
  try {
    const raw = sessionStorage.getItem(EXAM_CUSTOM_KEY)
    if (!raw) return defaultExamCounts()
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const counts: ExamCounts = {}
    for (const s of EXAM_SEGMENTS) {
      const v = Number(parsed[s.type])
      counts[s.type] = Number.isFinite(v) ? Math.min(EXAM_TYPE_MAX, Math.max(0, Math.round(v))) : s.count
    }
    return counts
  } catch {
    return defaultExamCounts()
  }
}

/** 读取自定义套卷的题型顺序（缺失 / 非法的题型按默认顺序补齐） */
function loadExamOrder(): ExamType[] {
  try {
    const raw = sessionStorage.getItem(EXAM_ORDER_KEY)
    if (!raw) return [...DEFAULT_EXAM_ORDER]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...DEFAULT_EXAM_ORDER]
    const order: ExamType[] = []
    for (const v of parsed) {
      if (typeof v !== 'string') continue
      const type = v as ExamType
      if (SEGMENT_BY_TYPE.has(type) && !order.includes(type)) order.push(type)
    }
    for (const type of DEFAULT_EXAM_ORDER) {
      if (!order.includes(type)) order.push(type)
    }
    return order
  } catch {
    return [...DEFAULT_EXAM_ORDER]
  }
}

/** 将某一题型移动到目标题型之前 / 之后，返回新顺序 */
function moveExamType(
  order: ExamType[],
  fromType: ExamType,
  targetType: ExamType,
  after: boolean,
): ExamType[] {
  const from = order.indexOf(fromType)
  if (from < 0 || fromType === targetType || !order.includes(targetType)) return order
  const next = [...order]
  next.splice(from, 1)
  const insertAt = next.indexOf(targetType) + (after ? 1 : 0)
  next.splice(insertAt, 0, fromType)
  return next
}

export default function HomePage() {
  const navigate = useNavigate()
  const [count, setCount] = useState(loadCount)
  const [showExamBuilder, setShowExamBuilder] = useState(false)
  const [examCounts, setExamCounts] = useState<ExamCounts>(loadExamCounts)
  const [examOrder, setExamOrder] = useState<ExamType[]>(loadExamOrder)
  const [dragType, setDragType] = useState<ExamType | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const dragRef = useRef<{
    type: ExamType
    pointerId: number
    startY: number
    moved: boolean
    drop: DropTarget | null
  } | null>(null)
  /** 记录按下时是否点在遮罩本身，避免拖动手柄后在弹窗外松开时误关闭弹窗 */
  const overlayDownRef = useRef(false)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, String(count))
  }, [count])

  useEffect(() => {
    sessionStorage.setItem(EXAM_ORDER_KEY, JSON.stringify(examOrder))
  }, [examOrder])

  const applyCount = (v: number) => {
    if (!Number.isFinite(v)) return
    setCount(Math.min(100, Math.max(1, Math.round(v))))
  }

  const startExam = () => navigate('/train/exam')

  const orderedSegments = examOrder
    .map((type) => SEGMENT_BY_TYPE.get(type))
    .filter((s): s is ExamSegment => Boolean(s))
  const examTotal = orderedSegments.reduce((s, seg) => s + (examCounts[seg.type] ?? 0), 0)

  const applyExamCount = (type: ExamType, v: number) => {
    if (!Number.isFinite(v)) return
    setExamCounts((cs) => ({ ...cs, [type]: Math.min(EXAM_TYPE_MAX, Math.max(0, Math.round(v))) }))
  }

  const startCustomExam = () => {
    if (examTotal <= 0) return
    sessionStorage.setItem(EXAM_CUSTOM_KEY, JSON.stringify(examCounts))
    sessionStorage.setItem(EXAM_ORDER_KEY, JSON.stringify(examOrder))
    const chosen = orderedSegments.filter((s) => (examCounts[s.type] ?? 0) > 0)
    const query = chosen.map((s) => `${s.type}=${examCounts[s.type]}`).join('&')
    navigate(`/train/exam?${query}&order=${chosen.map((s) => s.type).join(',')}`)
  }

  const beginDrag = (type: ExamType, e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    dragRef.current = { type, pointerId: e.pointerId, startY: e.clientY, moved: false, drop: null }
    setDragType(type)
    setDropTarget(null)
  }

  const finishDrag = () => {
    const drag = dragRef.current
    const drop = drag?.drop
    if (drag && drop) {
      setExamOrder((prev) => moveExamType(prev, drag.type, drop.type, drop.after))
    }
    dragRef.current = null
    setDragType(null)
    setDropTarget(null)
  }

  const cancelDrag = () => {
    dragRef.current = null
    setDragType(null)
    setDropTarget(null)
  }

  // 拖动中监听整个窗口：指针移出弹窗或松开在弹窗外也能正确结束
  useEffect(() => {
    if (!dragType) return
    const rowAt = (x: number, y: number): HTMLElement | null => {
      if (typeof document.elementFromPoint !== 'function') return null
      const el = document.elementFromPoint(x, y)
      return el instanceof Element ? el.closest<HTMLElement>('[data-exam-type]') : null
    }
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || e.pointerId !== drag.pointerId) return
      if (!drag.moved && Math.abs(e.clientY - drag.startY) < 3) return
      drag.moved = true
      const row = rowAt(e.clientX, e.clientY)
      const type = row?.dataset.examType as ExamType | undefined
      if (!row || !type || !SEGMENT_BY_TYPE.has(type) || type === drag.type) {
        drag.drop = null
        setDropTarget(null)
        return
      }
      const rect = row.getBoundingClientRect()
      const after = e.clientY > rect.top + rect.height / 2
      if (drag.drop?.type === type && drag.drop.after === after) return
      drag.drop = { type, after }
      setDropTarget({ type, after })
    }
    const onUp = (e: PointerEvent) => {
      if (dragRef.current?.pointerId !== e.pointerId) return
      finishDrag()
    }
    const onCancel = (e: PointerEvent) => {
      if (dragRef.current?.pointerId !== e.pointerId) return
      cancelDrag()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDrag()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('keydown', onKey)
    }
  }, [dragType])

  /** 手柄聚焦时也可用 ↑ ↓ 调整顺序，兼顾键盘操作 */
  const moveByKeyboard = (type: ExamType, delta: number) => {
    setExamOrder((prev) => {
      const from = prev.indexOf(type)
      const to = from + delta
      if (from < 0 || to < 0 || to >= prev.length) return prev
      const next = [...prev]
      ;[next[from], next[to]] = [next[to], next[from]]
      return next
    })
  }

  const onHandleKeyDown = (type: ExamType, e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveByKeyboard(type, -1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveByKeyboard(type, 1)
    }
  }

  return (
    <div className="home-page">
      <header className="hero text-center">
        <h1 className="mb-2">考公速算训练营</h1>
        <p>资料分析速算专项 · 逐题计时 · 自动判分 · 支持回看与跳题</p>
      </header>

      <section className="panel mt-4">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <span className="fw-bold">每组题数</span>
          <div className="d-flex gap-2 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className={`count-chip ${count === p ? 'active' : ''}`}
                onClick={() => applyCount(p)}
              >
                {p} 题
              </button>
            ))}
          </div>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <span className="text-muted small">自定义</span>
            <CountStepper
              value={count}
              min={1}
              max={100}
              label="自定义每组题数"
              decreaseLabel="减少每组题数"
              increaseLabel="增加每组题数"
              onChange={applyCount}
            />
          </div>
        </div>
      </section>

      <section className="home-links mt-4">
        <button type="button" className="home-link" onClick={() => navigate('/stats')}>
          <i className="bi bi-trophy" />
          <span className="home-link-body">
            <span className="d-block">我的成绩</span>
            <span className="home-link-sub">历次练习统计 · 进步趋势 · 数据迁移</span>
          </span>
          <i className="bi bi-chevron-right home-link-go" />
        </button>
        <button type="button" className="home-link" onClick={() => navigate('/about')}>
          <i className="bi bi-info-circle" />
          <span className="home-link-body">
            <span className="d-block">关于本站</span>
            <span className="home-link-sub">功能介绍 · 全程离线 · 数据仅存本机</span>
          </span>
          <i className="bi bi-chevron-right home-link-go" />
        </button>
      </section>

      {/* 套卷模式：默认 34 题整卷，分模块出题；也可自定义题型、题数与顺序 */}
      <section className="mt-4">
        <button type="button" className="exam-banner w-100" onClick={startExam}>
          <span className={`cat-icon ${EXAM_CATEGORY.tint}`}>
            <i className={`bi ${EXAM_CATEGORY.icon}`} />
          </span>
          <span className="exam-banner-body">
            <span className="cat-title d-block">{EXAM_CATEGORY.title}</span>
            <span className="exam-banner-sub">默认 34 题整卷 · 分模块出题</span>
          </span>
          <span className="exam-banner-cta">
            开始考试
            <i className="bi bi-chevron-right ms-1" />
          </span>
        </button>
        <button type="button" className="exam-custom-btn" onClick={() => setShowExamBuilder(true)}>
          <i className="bi bi-sliders me-2" />
          自定义套卷 · 题型与题数
        </button>
      </section>

      <section className="row g-3 mt-1">
        {CATEGORIES.map((c) => (
          <div className="col-12 col-md-6 col-xl-4" key={c.type}>
            <button
              type="button"
              className="cat-card w-100"
              onClick={() => navigate(`/train/${c.type}?count=${count}`)}
            >
              <span className={`cat-icon ${c.tint}`}>
                <i className={`bi ${c.icon}`} />
              </span>
              <span className="cat-body">
                <span className="cat-title d-block">{c.title}</span>
              </span>
              <i className="bi bi-chevron-right cat-go" />
            </button>
          </div>
        ))}
      </section>

      <footer className="text-center text-muted small mt-5">
        加减法须完全准确 · 乘法允许 1% 以内误差 · 基期与增长量允许 2% 以内误差 · 选择/比大小可先跳过稍后补答 · 交卷前会提醒未答题目
      </footer>

      {showExamBuilder && (
        <div
          className="modal-overlay"
          onPointerDown={(e) => {
            overlayDownRef.current = e.target === e.currentTarget
          }}
          onClick={(e) => {
            const close = overlayDownRef.current && e.target === e.currentTarget
            overlayDownRef.current = false
            if (close) setShowExamBuilder(false)
          }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <i className="bi bi-sliders me-2" />
              自定义套卷
            </div>
            <div className="modal-body">
              <p className="mb-2">为每个题型设置题数（0 表示不包含）。</p>
              <p className="exam-builder-hint">
                <i className="bi bi-grip-vertical me-1" aria-hidden="true" />
                拖动左侧手柄调整顺序，套卷将按此顺序出题
              </p>
              <div className="exam-builder-rows">
                {orderedSegments.map((s) => (
                  <div
                    key={s.type}
                    data-exam-type={s.type}
                    className={[
                      'exam-builder-row',
                      dragType === s.type ? 'is-dragging' : '',
                      dropTarget?.type === s.type
                        ? dropTarget.after
                          ? 'drop-after'
                          : 'drop-before'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <button
                      type="button"
                      className="exam-builder-handle"
                      aria-label={`拖动调整${s.label}顺序`}
                      title="拖动调整顺序（也可用 ↑ ↓ 键）"
                      onPointerDown={(e) => beginDrag(s.type, e)}
                      onKeyDown={(e) => onHandleKeyDown(s.type, e)}
                    >
                      <i className="bi bi-grip-vertical" aria-hidden="true" />
                    </button>
                    <label className="exam-builder-label" htmlFor={`exam-count-${s.type}`}>
                      {s.label}
                    </label>
                    <CountStepper
                      id={`exam-count-${s.type}`}
                      value={examCounts[s.type] ?? 0}
                      min={0}
                      max={EXAM_TYPE_MAX}
                      decreaseLabel={`减少${s.label}题数`}
                      increaseLabel={`增加${s.label}题数`}
                      onChange={(v) => applyExamCount(s.type, v)}
                    />
                  </div>
                ))}
              </div>
              <div className="exam-builder-total mt-3">
                <strong>共 {examTotal} 题</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setExamCounts(defaultExamCounts())
                  setExamOrder([...DEFAULT_EXAM_ORDER])
                }}
              >
                恢复默认
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowExamBuilder(false)}>
                取消
              </button>
              <button type="button" className="btn btn-primary" disabled={examTotal <= 0} onClick={startCustomExam}>
                开始考试
              </button>
            </div>
          </div>
        </div>
      )}

      <ThemeToggle />
    </div>
  )
}
