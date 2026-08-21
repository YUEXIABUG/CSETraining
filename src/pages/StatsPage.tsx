import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccuracyTrendChart } from '../components/Charts'
import { ThemeToggle } from '../components/ThemeToggle'
import { CATEGORIES, EXAM_CATEGORY, categoryOf } from '../meta'
import type { QuestionType } from '../types'
import { formatDateTime, formatMs, formatMsShort } from '../utils/display'
import {
  clearHistory,
  exportHistoryJson,
  loadHistory,
  mergeImportJson,
  type SessionRecord,
} from '../utils/history'

interface TypeStat {
  type: QuestionType
  /** 练习组数 */
  sessions: number
  /** 累计答题数 */
  questions: number
  /** 累计答对数 */
  correct: number
  /** 总正确率（0–100） */
  accuracy: number
  /** 平均每题用时（毫秒） */
  avgMs: number
  /** 最近 3 组与之前 3 组的正确率差值（百分点），数据不足为 null */
  delta: number | null
}

const accClassOf = (acc: number) =>
  acc >= 80 ? 'text-success' : acc >= 60 ? 'text-warning' : 'text-danger'

function computeTypeStats(history: SessionRecord[]): TypeStat[] {
  const types: QuestionType[] = [...CATEGORIES.map((c) => c.type), EXAM_CATEGORY.type]
  return types
    .map((type): TypeStat | null => {
      const list = history.filter((r) => r.type === type)
      if (list.length === 0) return null
      const questions = list.reduce((s, r) => s + r.count, 0)
      const correct = list.reduce((s, r) => s + r.correct, 0)
      const timeMs = list.reduce((s, r) => s + r.timeMs, 0)
      let delta: number | null = null
      if (list.length >= 4) {
        const accs = list.map((r) => (r.count ? Math.round((r.correct / r.count) * 100) : 0))
        const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
        delta = Math.round(avg(accs.slice(-3)) - avg(accs.slice(-6, -3)))
      }
      return {
        type,
        sessions: list.length,
        questions,
        correct,
        accuracy: questions ? Math.round((correct / questions) * 100) : 0,
        avgMs: questions ? timeMs / questions : 0,
        delta,
      }
    })
    .filter((s): s is TypeStat => s !== null)
}

/** 进步幅度标签：最近 3 组对比之前 3 组 */
function DeltaTag({ delta }: { delta: number | null }) {
  const title = '最近 3 组与之前 3 组的正确率差值（百分点）'
  if (delta === null) {
    return (
      <span className="delta-tag delta-flat" title="至少练习 4 组后开始对比">
        暂无对比
      </span>
    )
  }
  if (delta > 0) {
    return (
      <span className="delta-tag delta-up" title={title}>
        <i className="bi bi-arrow-up-right" /> +{delta}
      </span>
    )
  }
  if (delta < 0) {
    return (
      <span className="delta-tag delta-down" title={title}>
        <i className="bi bi-arrow-down-right" /> {delta}
      </span>
    )
  }
  return (
    <span className="delta-tag delta-flat" title={title}>
      持平
    </span>
  )
}

export default function StatsPage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState(loadHistory)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const totalQuestions = history.reduce((s, r) => s + r.count, 0)
  const totalCorrect = history.reduce((s, r) => s + r.correct, 0)
  const overallAcc = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const typeStats = computeTypeStats(history)
  const trendPoints = history.slice(-30).map((r) => {
    const d = new Date(r.ts)
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      value: r.count ? Math.round((r.correct / r.count) * 100) : 0,
    }
  })

  const handleExport = () => {
    const blob = new Blob([exportHistoryJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cse-training-grades-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setNotice({ kind: 'ok', text: `已导出 ${history.length} 条记录，请妥善保存该文件。` })
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      const res = mergeImportJson(text)
      setHistory(loadHistory())
      setNotice({
        kind: 'ok',
        text:
          res.added > 0
            ? `导入完成：合并 ${res.added} 条新记录${res.skipped ? `，跳过 ${res.skipped} 条本机已有记录` : ''}${res.invalid ? `，丢弃 ${res.invalid} 条无效记录` : ''}`
            : `没有可合并的新记录${res.skipped ? `（${res.skipped} 条已存在于本机）` : ''}`,
      })
    } catch (e) {
      setNotice({
        kind: 'err',
        text: e instanceof Error ? `导入失败：${e.message}` : '导入失败，请选择本站导出的 JSON 文件',
      })
    }
  }

  const handleClear = () => {
    clearHistory()
    setHistory([])
    setConfirmClear(false)
  }

  return (
    <div className="fade-in">
      <div className="quiz-top">
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/')}>
          <i className="bi bi-chevron-left me-1" />
          返回
        </button>
        <div className="fw-bold fs-5 quiz-title-static">我的成绩</div>
        {history.length > 0 && <span className="timer-chip">共 {history.length} 次练习</span>}
      </div>

      {history.length === 0 ? (
        <div className="panel empty-state mt-4 text-center">
          <i className="bi bi-trophy empty-icon" />
          <h2 className="fs-5 fw-bold">还没有练习记录</h2>
          <p className="text-muted">每次交卷后，成绩会自动记录在这里，见证你的进步。</p>
          <button type="button" className="btn btn-primary px-4" onClick={() => navigate('/')}>
            开始训练
          </button>
        </div>
      ) : (
        <>
          <div className="row g-3 mt-2">
            <div className="col-6 col-md-4">
              <div className="stat-card">
                <div className="stat-value">{history.length}</div>
                <div className="stat-label">练习组数</div>
              </div>
            </div>
            <div className="col-6 col-md-4">
              <div className="stat-card">
                <div className="stat-value">{totalQuestions}</div>
                <div className="stat-label">累计答题</div>
              </div>
            </div>
            <div className="col-6 col-md-4">
              <div className="stat-card">
                <div className={`stat-value ${accClassOf(overallAcc)}`}>{overallAcc}%</div>
                <div className="stat-label">总正确率（{totalCorrect}/{totalQuestions}）</div>
              </div>
            </div>
          </div>

          <section className="panel mt-4">
            <h2 className="section-title">
              <i className="bi bi-graph-up me-2" />
              正确率趋势
            </h2>
            <div className="chart-subtitle">最近 {trendPoints.length} 次练习的总正确率</div>
            {trendPoints.length >= 2 ? (
              <AccuracyTrendChart points={trendPoints} />
            ) : (
              <p className="text-muted small mb-0">再练习几组，就能看到正确率走势了。</p>
            )}
          </section>

          <section className="panel mt-4">
            <h2 className="section-title">
              <i className="bi bi-bullseye me-2" />
              分模块统计
            </h2>
            <div className="type-stats">
              {typeStats.map((s) => {
                const meta = categoryOf(s.type)
                return (
                  <div key={s.type} className="type-stat-row">
                    <span className={`cat-icon type-stat-icon ${meta.tint}`}>
                      <i className={`bi ${meta.icon}`} />
                    </span>
                    <span className="type-stat-title">{meta.title}</span>
                    <span className="type-stat-meta">
                      {s.sessions} 组 · {s.questions} 题
                    </span>
                    <span className={`type-stat-acc ${accClassOf(s.accuracy)}`}>{s.accuracy}%</span>
                    <span className="type-stat-meta">均 {formatMsShort(s.avgMs)}/题</span>
                    <DeltaTag delta={s.delta} />
                  </div>
                )
              })}
            </div>
          </section>

          <section className="panel mt-4">
            <h2 className="section-title">
              <i className="bi bi-clock-history me-2" />
              练习记录
            </h2>
            <div className="history-list">
              {history
                .slice(-30)
                .reverse()
                .map((r) => {
                  const acc = r.count ? Math.round((r.correct / r.count) * 100) : 0
                  return (
                    <div key={r.id} className="history-row">
                      <span className="history-date">{formatDateTime(r.ts)}</span>
                      <span className="history-type">{categoryOf(r.type).title}</span>
                      <span className="history-score">
                        对 {r.correct}/{r.count}
                        {r.skipped > 0 && <em className="history-skip">（未答 {r.skipped}）</em>}
                      </span>
                      <span className={`history-acc ${accClassOf(acc)}`}>{acc}%</span>
                      <span className="history-time">{formatMs(r.timeMs)}</span>
                    </div>
                  )
                })}
            </div>
            {history.length > 30 && (
              <div className="text-muted small mt-2">仅显示最近 30 条，完整数据可导出查看。</div>
            )}
          </section>

          <section className="panel mt-4">
            <h2 className="section-title">
              <i className="bi bi-box-arrow-in-down me-2" />
              数据管理
            </h2>
            <p className="text-muted small">
              成绩数据仅保存在本机浏览器的本地存储（localStorage）中，不会上传到任何服务器。
              清除浏览器数据会导致记录丢失；换设备或换浏览器时，可先导出 JSON 文件，再到新环境中导入合并。
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <button type="button" className="btn btn-outline-primary" onClick={handleExport}>
                <i className="bi bi-upload me-1" />
                导出成绩
              </button>
              <button type="button" className="btn btn-outline-primary" onClick={() => fileRef.current?.click()}>
                <i className="bi bi-download me-1" />
                导入成绩
              </button>
              <button type="button" className="btn btn-outline-danger" onClick={() => setConfirmClear(true)}>
                <i className="bi bi-trash3 me-1" />
                删除历史数据
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(e) => {
                  void handleFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>
            {notice && (
              <div className={`import-notice ${notice.kind === 'ok' ? 'notice-ok' : 'notice-err'}`} role="status">
                {notice.text}
              </div>
            )}
          </section>
        </>
      )}

      {confirmClear && (
        <div className="modal-overlay" onClick={() => setConfirmClear(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <i className="bi bi-exclamation-triangle me-2" />
              确认删除全部成绩？
            </div>
            <div className="modal-body">
              将删除本机保存的 {history.length} 条练习记录，且无法恢复。如需保留，请先「导出成绩」备份。
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setConfirmClear(false)}>
                取消
              </button>
              <button type="button" className="btn btn-danger" onClick={handleClear}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <ThemeToggle />
    </div>
  )
}
