import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BasePeriodView, FractionView, NumericQuestionView } from '../components/QuestionViews'
import { CorrectAnswerCell, ResultCell, SummaryCell, UserAnswerCell } from '../components/ResultCells'
import { ThemeToggle } from '../components/ThemeToggle'
import { CATEGORIES, isQuestionType } from '../meta'
import type { AnswerPart, AnswerRecord, QuestionType } from '../types'
import { formatMs, formatMsShort } from '../utils/display'
import { generateSet, isWithinTolerance } from '../utils/generators'

export default function TrainingPage() {
  const navigate = useNavigate()
  const { type: typeParam } = useParams()
  const [searchParams] = useSearchParams()

  const qType: QuestionType = isQuestionType(typeParam) ? typeParam : 'addsub'
  const meta = CATEGORIES.find((c) => c.type === qType)!
  const parsed = Number.parseInt(searchParams.get('count') ?? '5', 10)
  const count = Number.isFinite(parsed) ? Math.min(100, Math.max(1, parsed)) : 5

  const [round, setRound] = useState(0)
  const questions = useMemo(() => generateSet(qType, count), [qType, count, round])

  const [index, setIndex] = useState(0)
  const [records, setRecords] = useState<AnswerRecord[]>([])
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz')
  const totalStart = useRef(Date.now())
  const qStart = useRef(Date.now())
  const lockRef = useRef(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(timer)
  }, [])

  // 题组刷新（换类型 / 换题数 / 再来一组）时重置所有状态与计时
  useEffect(() => {
    setIndex(0)
    setRecords([])
    setPhase('quiz')
    totalStart.current = Date.now()
    qStart.current = Date.now()
  }, [questions])

  useEffect(() => {
    lockRef.current = false
  }, [records.length, questions])

  const question = questions[index]

  const handleAnswer = (userText: string, correct: boolean, parts?: AnswerPart[]) => {
    if (phase !== 'quiz' || lockRef.current || records.length !== index) return
    lockRef.current = true
    const timeMs = Date.now() - qStart.current
    const next = [...records, { userText, correct, timeMs, parts }]
    setRecords(next)
    if (next.length >= questions.length) {
      setPhase('result')
    } else {
      setIndex(next.length)
      qStart.current = Date.now()
    }
  }

  const handleNumeric = (text: string) => {
    const val = Number.parseFloat(text)
    if (!Number.isFinite(val)) return
    if (question.type === 'addsub') {
      // 加减法答案不得有误差
      handleAnswer(text, val === question.answer)
    } else if (question.type === 'multiply') {
      handleAnswer(text, isWithinTolerance(val, question.answer))
    }
  }

  const handleBasePeriod = (baseText: string, growthText: string) => {
    if (question.type !== 'baseperiod') return
    const baseVal = Number.parseFloat(baseText)
    const growthVal = Number.parseFloat(growthText)
    if (!Number.isFinite(baseVal) || !Number.isFinite(growthVal)) return
    const baseCorrect = isWithinTolerance(baseVal, question.baseAnswer)
    const growthCorrect = isWithinTolerance(growthVal, question.growthAnswer)
    handleAnswer(`基期量 ${baseText}；增长量 ${growthText}`, baseCorrect && growthCorrect, [
      { label: '基期量', userText: baseText, correct: baseCorrect },
      { label: '增长量', userText: growthText, correct: growthCorrect },
    ])
  }

  if (phase === 'result') {
    const correctCount = records.filter((r) => r.correct).length
    const totalMs = records.reduce((s, r) => s + r.timeMs, 0)
    const accClassOf = (acc: number) =>
      acc >= 80 ? 'text-success' : acc >= 60 ? 'text-warning' : 'text-danger'
    const isBase = qType === 'baseperiod'
    const partAcc = (partIndex: number) =>
      Math.round((records.filter((r) => r.parts?.[partIndex]?.correct).length / questions.length) * 100)
    const accuracy = Math.round((correctCount / questions.length) * 100)
    return (
      <div>
        <div className="quiz-top">
          <div className="d-flex align-items-center gap-2">
            <Link to="/" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-chevron-left me-1" />
              返回首页
            </Link>
            <ThemeToggle />
          </div>
          <div className="fw-bold fs-5 quiz-title">{meta.title} · 成绩单</div>
          <span className="timer-chip">共 {questions.length} 题</span>
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
                  正确率（{correctCount}/{questions.length}）
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
              <div className="stat-value">{formatMs(totalMs / questions.length)}</div>
              <div className="stat-label">平均每题</div>
            </div>
          </div>
        </div>

        <div className="panel panel-flush mt-4">
          <div className="table-responsive">
            <table className="table result-table mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>题目</th>
                  <th>我的答案</th>
                  <th>正确答案</th>
                  <th>结果</th>
                  <th>用时</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => {
                  const r = records[i]
                  return (
                    <tr key={i}>
                      <td className="text-muted">{i + 1}</td>
                      <td>
                        <SummaryCell q={q} />
                      </td>
                      <td>
                        <UserAnswerCell q={q} r={r} />
                      </td>
                      <td>
                        <CorrectAnswerCell q={q} />
                      </td>
                      <td>
                        <ResultCell q={q} r={r} />
                      </td>
                      <td className="text-muted">{formatMs(r?.timeMs ?? 0)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
          <button
            type="button"
            className="btn btn-outline-secondary btn-lg px-4"
            onClick={() => navigate('/')}
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const totalMs = now - totalStart.current
  const qMs = now - qStart.current

  return (
    <div>
      <div className="quiz-top">
        <div className="d-flex align-items-center gap-2">
          <Link to="/" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-chevron-left me-1" />
            返回
          </Link>
          <ThemeToggle />
        </div>
        <div className="fw-bold fs-5 quiz-title">{meta.title}</div>
        <div className="d-flex gap-2 flex-wrap justify-content-end">
          <span className="timer-chip">
            总计 <strong>{formatMs(totalMs)}</strong>
          </span>
        </div>
      </div>

      <div className="quiz-body">
        {/* 左侧竖直进度轴：已完成题显示用时，当前题实时计时 */}
        <aside className="quiz-axis" aria-label="答题进度轴">
          {questions.map((_, i) => {
            const r = records[i]
            const isCurrent = i === index
            return (
              <div key={i} className={`axis-item ${r ? 'done' : isCurrent ? 'current' : 'todo'}`}>
                <span className="axis-dot">{i + 1}</span>
                <span className="axis-time">
                  {r ? formatMsShort(r.timeMs) : isCurrent ? formatMsShort(qMs) : ''}
                </span>
              </div>
            )
          })}
        </aside>

        <div className="quiz-main">
          <div className="d-flex justify-content-end">
            <span className="text-muted small fw-semibold">
              第 {index + 1} / {questions.length} 题
            </span>
          </div>

          <div className="quiz-card">
            {question.type === 'addsub' && (
              <NumericQuestionView key={index} hint="答案须完全准确 · 回车键快速提交" onAnswer={handleNumeric}>
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
            {question.type === 'multiply' && (
              <NumericQuestionView key={index} onAnswer={handleNumeric}>
                <span>{question.base}</span>
                <span className="op">×</span>
                <span>{question.percent}%</span>
                <span className="op">=</span>
                <span className="blank">?</span>
              </NumericQuestionView>
            )}
            {question.type === 'fraction' && (
              <FractionView
                key={index}
                q={question}
                onAnswer={(rel) => handleAnswer(rel, rel === question.answer)}
              />
            )}
            {question.type === 'baseperiod' && (
              <BasePeriodView key={index} q={question} onAnswer={handleBasePeriod} />
            )}
          </div>

          <div className="text-center text-muted small mt-3">
            {question.type === 'fraction' ? '点击按钮后自动提交并进入下一题' : '心算后输入答案，回车提交'}
          </div>
        </div>
      </div>
    </div>
  )
}
