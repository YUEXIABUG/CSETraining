import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DonutChart, TimeLineChart } from '../components/Charts'
import {
  BasePeriodView,
  ChoiceView,
  FractionView,
  NumericQuestionView,
} from '../components/QuestionViews'
import {
  CorrectAnswerCell,
  ResultBadge,
  ResultCell,
  SummaryCell,
  UserAnswerCell,
} from '../components/ResultCells'
import { ThemeToggle } from '../components/ThemeToggle'
import { categoryOf, isQuestionType } from '../meta'
import type { AnswerRecord, Question, QuestionType } from '../types'
import { formatMs, formatMsShort } from '../utils/display'
import { examModuleRanges, generateSet, isWithinTolerance } from '../utils/generators'

/** 每题的草稿答案（切换题目时保留，可回看修改） */
interface Draft {
  text?: string
  baseText?: string
  growthText?: string
  relation?: '>' | '<'
  choiceIndex?: number
}

type ChipStatus = 'answered' | 'viewed' | 'unseen'

function isChoiceType(q: Question): boolean {
  return q.type === 'fraction' || q.type === 'baseperiodshare' || q.type === 'sharegap'
}

/** 该题是否已作答（提交前用于未答提醒） */
function isAnswered(q: Question, d: Draft | undefined): boolean {
  if (!d) return false
  switch (q.type) {
    case 'addsub':
    case 'multiply':
      return (d.text ?? '').trim() !== ''
    case 'baseperiod':
      return (d.baseText ?? '').trim() !== '' && (d.growthText ?? '').trim() !== ''
    case 'fraction':
      return d.relation !== undefined
    case 'baseperiodshare':
    case 'sharegap':
      return d.choiceIndex !== undefined
  }
}

const LETTERS = ['A', 'B', 'C', 'D']

export default function TrainingPage() {
  const navigate = useNavigate()
  const { type: typeParam } = useParams()
  const [searchParams] = useSearchParams()

  const qType: QuestionType = isQuestionType(typeParam) ? typeParam : 'addsub'
  const meta = categoryOf(qType)
  const parsed = Number.parseInt(searchParams.get('count') ?? '5', 10)
  const count = Number.isFinite(parsed) ? Math.min(100, Math.max(1, parsed)) : 5

  const [round, setRound] = useState(0)
  const questions = useMemo(() => generateSet(qType, count), [qType, count, round])
  const moduleRanges = useMemo(() => (qType === 'exam' ? examModuleRanges() : []), [qType])

  const [index, setIndex] = useState(0)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [viewed, setViewed] = useState<boolean[]>([])
  const [records, setRecords] = useState<AnswerRecord[]>([])
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz')
  const [now, setNow] = useState(Date.now())

  const [showExit, setShowExit] = useState(false)
  const [showUnanswered, setShowUnanswered] = useState(false)
  const [unanswered, setUnanswered] = useState<number[]>([])
  const pendingRef = useRef<Draft[] | null>(null)

  const timeAccumRef = useRef<number[]>([])
  const qStartRef = useRef(Date.now())
  const totalStartRef = useRef(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(timer)
  }, [])

  // 题组刷新（换类型 / 换题数 / 再来一组）时重置所有状态与计时
  useEffect(() => {
    setIndex(0)
    setDrafts(questions.map(() => ({})))
    setViewed(questions.map((_, i) => i === 0))
    setRecords([])
    setPhase('quiz')
    setShowExit(false)
    setShowUnanswered(false)
    setUnanswered([])
    pendingRef.current = null
    timeAccumRef.current = questions.map(() => 0)
    qStartRef.current = Date.now()
    totalStartRef.current = Date.now()
  }, [questions])

  const question = questions[index]
  const draft = drafts[index] ?? {}
  const isLast = index === questions.length - 1
  const choice = question ? isChoiceType(question) : false

  const flushCurrent = () => {
    timeAccumRef.current[index] = (timeAccumRef.current[index] ?? 0) + (Date.now() - qStartRef.current)
    qStartRef.current = Date.now()
  }

  const goTo = (i: number) => {
    if (phase !== 'quiz' || i < 0 || i >= questions.length || i === index) return
    flushCurrent()
    setIndex(i)
    setViewed((v) => {
      const n = [...v]
      n[i] = true
      return n
    })
  }

  const patchDraft = (patch: Partial<Draft>) => {
    setDrafts((ds) => {
      const n = [...ds]
      n[index] = { ...n[index], ...patch }
      return n
    })
  }

  const buildRecords = (ds: Draft[]): AnswerRecord[] =>
    questions.map((q, i) => {
      const d = ds[i] ?? {}
      const timeMs = Math.round(timeAccumRef.current[i] ?? 0)
      switch (q.type) {
        case 'addsub': {
          const txt = (d.text ?? '').trim()
          if (txt === '') return { userText: '', correct: false, timeMs, skipped: true }
          const val = Number.parseFloat(txt)
          return { userText: txt, correct: Number.isFinite(val) && val === q.answer, timeMs }
        }
        case 'multiply': {
          const txt = (d.text ?? '').trim()
          if (txt === '') return { userText: '', correct: false, timeMs, skipped: true }
          const val = Number.parseFloat(txt)
          return { userText: txt, correct: Number.isFinite(val) && isWithinTolerance(val, q.answer), timeMs }
        }
        case 'baseperiod': {
          const bt = (d.baseText ?? '').trim()
          const gt = (d.growthText ?? '').trim()
          if (bt === '' && gt === '') return { userText: '', correct: false, timeMs, skipped: true }
          const bv = Number.parseFloat(bt)
          const gv = Number.parseFloat(gt)
          const baseCorrect = Number.isFinite(bv) && isWithinTolerance(bv, q.baseAnswer)
          const growthCorrect = Number.isFinite(gv) && isWithinTolerance(gv, q.growthAnswer)
          return {
            userText: `基期量 ${bt || '—'}；增长量 ${gt || '—'}`,
            correct: baseCorrect && growthCorrect,
            timeMs,
            parts: [
              { label: '基期量', userText: bt || '—', correct: baseCorrect },
              { label: '增长量', userText: gt || '—', correct: growthCorrect },
            ],
          }
        }
        case 'fraction': {
          if (d.relation === undefined) return { userText: '', correct: false, timeMs, skipped: true }
          return {
            userText: d.relation === '>' ? '＞ 左边更大' : '＜ 右边更大',
            correct: d.relation === q.answer,
            timeMs,
          }
        }
        case 'baseperiodshare':
        case 'sharegap': {
          if (d.choiceIndex === undefined) return { userText: '', correct: false, timeMs, skipped: true }
          return {
            userText: `${LETTERS[d.choiceIndex]}. ${q.options[d.choiceIndex]}`,
            correct: d.choiceIndex === q.correctIndex,
            timeMs,
          }
        }
      }
    })

  const finishSubmit = (ds: Draft[]) => {
    setRecords(buildRecords(ds))
    setPhase('result')
  }

  const beginSubmit = (ds: Draft[]) => {
    flushCurrent()
    const un = questions.map((q, i) => (isAnswered(q, ds[i]) ? -1 : i)).filter((i) => i >= 0)
    if (un.length > 0) {
      pendingRef.current = ds
      setUnanswered(un)
      setShowUnanswered(true)
      return
    }
    finishSubmit(ds)
  }

  const confirmSubmit = () => {
    setShowUnanswered(false)
    finishSubmit(pendingRef.current ?? drafts)
  }

  const backToAnswer = () => {
    setShowUnanswered(false)
    if (unanswered.length > 0) goTo(unanswered[0])
  }

  const handlePrimary = () => {
    if (isLast) beginSubmit(drafts)
    else goTo(index + 1)
  }

  const handleSkip = () => {
    const cleared = [...drafts]
    cleared[index] = {}
    setDrafts(cleared)
    if (!isLast) {
      goTo(index + 1)
    } else {
      beginSubmit(cleared)
    }
  }

  /* ---------- 成绩单 ---------- */
  if (phase === 'result') {
    const total = questions.length
    const correctCount = records.filter((r) => !r.skipped && r.correct).length
    const skippedCount = records.filter((r) => r.skipped).length
    const wrongCount = total - correctCount - skippedCount
    const totalMs = records.reduce((s, r) => s + r.timeMs, 0)
    const accuracy = total ? Math.round((correctCount / total) * 100) : 0
    const accClassOf = (acc: number) =>
      acc >= 80 ? 'text-success' : acc >= 60 ? 'text-warning' : 'text-danger'
    const isBase = qType === 'baseperiod'
    const partAcc = (partIndex: number) =>
      Math.round((records.filter((r) => r.parts?.[partIndex]?.correct).length / total) * 100)
    const moduleLabelAt = (i: number) =>
      moduleRanges.find((r) => i >= r.start && i < r.end)?.label ?? ''

    return (
      <div className="fade-in">
        <div className="quiz-top">
          <div className="fw-bold fs-5 quiz-title-static">{meta.title} · 成绩单</div>
          <span className="timer-chip">共 {total} 题</span>
        </div>

        <div className="row g-3 mt-2">
          {isBase ? (
            <>
              <div className="col-6 col-sm-3">
                <div className="stat-card">
                  <div className={`stat-value ${accClassOf(partAcc(0))}`}>{partAcc(0)}%</div>
                  <div className="stat-label">基期量正确率</div>
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <div className="stat-card">
                  <div className={`stat-value ${accClassOf(partAcc(1))}`}>{partAcc(1)}%</div>
                  <div className="stat-label">增长量正确率</div>
                </div>
              </div>
            </>
          ) : (
            <div className="col-12 col-sm-4">
              <div className="stat-card">
                <div className={`stat-value ${accClassOf(accuracy)}`}>{accuracy}%</div>
                <div className="stat-label">
                  正确率（{correctCount}/{total}）
                </div>
              </div>
            </div>
          )}
          <div className={isBase ? 'col-6 col-sm-3' : 'col-12 col-sm-4'}>
            <div className="stat-card">
              <div className="stat-value">{formatMs(totalMs)}</div>
              <div className="stat-label">总用时</div>
            </div>
          </div>
          <div className={isBase ? 'col-6 col-sm-3' : 'col-12 col-sm-4'}>
            <div className="stat-card">
              <div className="stat-value">{formatMs(total ? totalMs / total : 0)}</div>
              <div className="stat-label">平均每题</div>
            </div>
          </div>
        </div>

        <section className="panel mt-4">
          <h2 className="section-title">
            <i className="bi bi-graph-up-arrow me-2" />
            答题分析
          </h2>
          <div className="row g-4 align-items-center">
            <div className="col-12 col-md-5">
              <DonutChart
                centerLabel={`${accuracy}%`}
                centerSub="正确率"
                segments={[
                  { label: '答对', value: correctCount, color: 'var(--ok)' },
                  { label: '答错', value: wrongCount, color: 'var(--bad)' },
                  { label: '未作答', value: skippedCount, color: 'var(--faint)' },
                ]}
              />
            </div>
            <div className="col-12 col-md-7">
              <div className="chart-subtitle">每题用时趋势</div>
              <TimeLineChart times={records.map((r) => r.timeMs)} />
            </div>
          </div>
          {qType === 'exam' && (
            <div className="module-breakdown mt-4">
              <div className="chart-subtitle">分模块正确率</div>
              <div className="module-chips">
                {moduleRanges.map((r) => {
                  const sub = records.slice(r.start, r.end)
                  const ok = sub.filter((x) => !x.skipped && x.correct).length
                  const pct = sub.length ? Math.round((ok / sub.length) * 100) : 0
                  return (
                    <div key={r.label} className="module-chip">
                      <span className="module-chip-label">{r.label}</span>
                      <span className={`module-chip-acc ${accClassOf(pct)}`}>
                        {ok}/{sub.length}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        <h2 className="section-title mt-4">
          <i className="bi bi-list-check me-2" />
          答题记录
        </h2>
        <div className="result-records">
          {questions.map((q, i) => {
            const r = records[i]
            return (
              <div key={i} className="result-record">
                <div className="record-head">
                  <span className="record-no">题号 {i + 1}</span>
                  {qType === 'exam' && <span className="record-module">{moduleLabelAt(i)}</span>}
                  <ResultBadge r={r} />
                  <span className="record-time">
                    <i className="bi bi-stopwatch me-1" />
                    {formatMs(r?.timeMs ?? 0)}
                  </span>
                </div>
                <div className="record-grid">
                  <div className="record-row">
                    <span className="record-label">题目</span>
                    <div className="record-value">
                      <SummaryCell q={q} />
                    </div>
                  </div>
                  <div className="record-row">
                    <span className="record-label">我的答案</span>
                    <div className="record-value">
                      <UserAnswerCell q={q} r={r} />
                    </div>
                  </div>
                  <div className="record-row">
                    <span className="record-label">正确答案</span>
                    <div className="record-value">
                      <CorrectAnswerCell q={q} />
                    </div>
                  </div>
                  <div className="record-row">
                    <span className="record-label">结果</span>
                    <div className="record-value">
                      <ResultCell q={q} r={r} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="d-flex justify-content-center gap-3 mt-4 flex-wrap">
          <button
            type="button"
            className="btn btn-primary btn-lg px-4"
            onClick={() => setRound((v) => v + 1)}
          >
            <i className="bi bi-arrow-repeat me-2" />
            再来一组
          </button>
          <button type="button" className="btn btn-outline-secondary btn-lg px-4" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
        <ThemeToggle />
      </div>
    )
  }

  /* ---------- 答题 ---------- */
  const totalMs = now - totalStartRef.current
  const qMs = (timeAccumRef.current[index] ?? 0) + (now - qStartRef.current)

  const statusOf = (i: number): ChipStatus => {
    if (isAnswered(questions[i], drafts[i])) return 'answered'
    if (viewed[i]) return 'viewed'
    return 'unseen'
  }

  const chipTime = (i: number): number => {
    let t = timeAccumRef.current[i] ?? 0
    if (i === index) t += now - qStartRef.current
    return t
  }

  const renderChip = (i: number) => {
    const cls = ['prog-chip', `st-${statusOf(i)}`]
    if (i === index) cls.push('current')
    return (
      <button
        key={i}
        type="button"
        className={cls.join(' ')}
        onClick={() => goTo(i)}
        title={`第 ${i + 1} 题 · 用时 ${formatMsShort(chipTime(i))}`}
      >
        {i + 1}
      </button>
    )
  }

  const answeredInRange = (start: number, end: number) => {
    let n = 0
    for (let i = start; i < end; i++) if (isAnswered(questions[i], drafts[i])) n++
    return n
  }

  return (
    <div>
      <div className="quiz-top">
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowExit(true)}>
          <i className="bi bi-chevron-left me-1" />
          返回
        </button>
        <div className="fw-bold fs-5 quiz-title">{meta.title}</div>
        <div className="d-flex gap-2 align-items-center">
          <span className="timer-chip d-none d-sm-inline-block">
            总计 <strong>{formatMs(totalMs)}</strong>
          </span>
        </div>
      </div>

      <section className="panel progress-panel mt-3">
        <div className="progress-head">
          <span className="progress-title">
            <i className="bi bi-signpost-split me-2" />
            答题进度
          </span>
          <span className="text-muted small fw-semibold">
            第 {index + 1} / {questions.length} 题 · 本题 {formatMsShort(qMs)}
          </span>
        </div>
        {qType === 'exam' ? (
          <div className="progress-modules">
            {moduleRanges.map((r) => (
              <div key={r.label} className="progress-module">
                <div className="progress-module-label">
                  {r.label}
                  <span className="progress-module-count">
                    {answeredInRange(r.start, r.end)}/{r.end - r.start}
                  </span>
                </div>
                <div className="progress-chips-flow">
                  {Array.from({ length: r.end - r.start }, (_, k) => renderChip(r.start + k))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={questions.length <= 10 ? 'progress-col' : 'progress-grid'}>
            {questions.map((_, i) => renderChip(i))}
          </div>
        )}
        <div className="progress-legend">
          <span>
            <i className="legend-swatch lg-answered" />
            已答
          </span>
          <span>
            <i className="legend-swatch lg-viewed" />
            看了没答
          </span>
          <span>
            <i className="legend-swatch lg-unseen" />
            未看
          </span>
        </div>
      </section>

      <div className="quiz-card">
        {question?.type === 'addsub' && (
          <NumericQuestionView
            key={index}
            hint="答案须完全准确 · 回车键进入下一题"
            value={draft.text ?? ''}
            onChange={(v) => patchDraft({ text: v })}
            onEnter={handlePrimary}
          >
            {question.terms.map((t, i) => (
              <span key={i}>
                {i > 0 && <span className="op">{t.sign === 1 ? '+' : '−'}</span>}
                {t.value}
              </span>
            ))}
            <span className="op">=</span>
            <span className="blank">?</span>
          </NumericQuestionView>
        )}
        {question?.type === 'multiply' && (
          <NumericQuestionView
            key={index}
            value={draft.text ?? ''}
            onChange={(v) => patchDraft({ text: v })}
            onEnter={handlePrimary}
          >
            <span>{question.base}</span>
            <span className="op">×</span>
            <span>{question.percent}%</span>
            <span className="op">=</span>
            <span className="blank">?</span>
          </NumericQuestionView>
        )}
        {question?.type === 'fraction' && (
          <FractionView
            key={index}
            q={question}
            selected={draft.relation}
            onSelect={(rel) => patchDraft({ relation: rel })}
          />
        )}
        {question?.type === 'baseperiod' && (
          <BasePeriodView
            key={index}
            q={question}
            base={draft.baseText ?? ''}
            growth={draft.growthText ?? ''}
            onBase={(v) => patchDraft({ baseText: v })}
            onGrowth={(v) => patchDraft({ growthText: v })}
            onEnter={handlePrimary}
          />
        )}
        {(question?.type === 'baseperiodshare' || question?.type === 'sharegap') && (
          <ChoiceView
            key={index}
            q={question}
            selected={draft.choiceIndex}
            onSelect={(i) => patchDraft({ choiceIndex: i })}
          />
        )}
      </div>

      <div className="quiz-actions">
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          <i className="bi bi-chevron-left me-1" />
          上一题
        </button>
        <div className="quiz-actions-right">
          {choice && (
            <button type="button" className="btn btn-outline-warning" onClick={handleSkip}>
              先不答
            </button>
          )}
          {isLast ? (
            <button type="button" className="btn btn-success px-4" onClick={handlePrimary}>
              <i className="bi bi-check-lg me-1" />
              提交
            </button>
          ) : (
            <button type="button" className="btn btn-primary px-4" onClick={handlePrimary}>
              下一题
              <i className="bi bi-chevron-right ms-1" />
            </button>
          )}
        </div>
      </div>

      {showExit && (
        <div className="modal-overlay" onClick={() => setShowExit(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <i className="bi bi-exclamation-triangle me-2" />
              确认返回首页？
            </div>
            <div className="modal-body">当前答题进度将不会保存，确定要离开吗？</div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowExit(false)}>
                继续答题
              </button>
              <button type="button" className="btn btn-danger" onClick={() => navigate('/')}>
                确认离开
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnanswered && (
        <div className="modal-overlay" onClick={backToAnswer}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <i className="bi bi-exclamation-circle me-2" />
              还有 {unanswered.length} 题未作答
            </div>
            <div className="modal-body">
              以下题号尚未作答：
              <span className="unanswered-list">
                {unanswered.map((i) => (
                  <span key={i} className="unanswered-no">
                    {i + 1}
                  </span>
                ))}
              </span>
              你可以返回继续作答，或直接提交（未答题目按错误计）。
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline-secondary" onClick={backToAnswer}>
                返回作答
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmSubmit}>
                仍要提交
              </button>
            </div>
          </div>
        </div>
      )}

      <ThemeToggle />
    </div>
  )
}
