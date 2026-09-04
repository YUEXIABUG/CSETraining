import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { CATEGORIES, EXAM_CATEGORY } from '../meta'
import type { QuestionType } from '../types'
import { EXAM_SEGMENTS } from '../utils/generators'

const PRESETS = [5, 10, 15, 20]
const STORAGE_KEY = 'cse-training-count'
/** 自定义套卷：各题型题数（0 表示不包含该题型） */
type ExamCounts = Partial<Record<QuestionType, number>>
const EXAM_CUSTOM_KEY = 'cse-training-exam-custom'
const EXAM_TYPE_MAX = 100

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

export default function HomePage() {
  const navigate = useNavigate()
  const [count, setCount] = useState(loadCount)
  const [showExamBuilder, setShowExamBuilder] = useState(false)
  const [examCounts, setExamCounts] = useState<ExamCounts>(loadExamCounts)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, String(count))
  }, [count])

  const applyCount = (v: number) => {
    if (!Number.isFinite(v)) return
    setCount(Math.min(100, Math.max(1, Math.round(v))))
  }

  const startExam = () => navigate('/train/exam')

  const examTotal = EXAM_SEGMENTS.reduce((s, seg) => s + (examCounts[seg.type] ?? 0), 0)

  const applyExamCount = (type: QuestionType, v: number) => {
    if (!Number.isFinite(v)) return
    setExamCounts((cs) => ({ ...cs, [type]: Math.min(EXAM_TYPE_MAX, Math.max(0, Math.round(v))) }))
  }

  const startCustomExam = () => {
    if (examTotal <= 0) return
    sessionStorage.setItem(EXAM_CUSTOM_KEY, JSON.stringify(examCounts))
    const query = EXAM_SEGMENTS.filter((s) => (examCounts[s.type] ?? 0) > 0)
      .map((s) => `${s.type}=${examCounts[s.type]}`)
      .join('&')
    navigate(`/train/exam?${query}`)
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
            <input
              type="number"
              min={1}
              max={100}
              className="form-control count-input"
              value={count}
              onChange={(e) => {
                if (e.target.value === '') return
                applyCount(Number(e.target.value))
              }}
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

      {/* 套卷模式：默认 34 题整卷，分模块出题；也可自定义题型与题数 */}
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
        <div className="modal-overlay" onClick={() => setShowExamBuilder(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <i className="bi bi-sliders me-2" />
              自定义套卷
            </div>
            <div className="modal-body">
              <p className="mb-3">为每个题型设置题数（0 表示不包含），题目按以下题型顺序出题。</p>
              <div className="exam-builder-rows">
                {EXAM_SEGMENTS.map((s) => (
                  <label key={s.type} className="exam-builder-row">
                    <span className="exam-builder-label">{s.label}</span>
                    <input
                      type="number"
                      min={0}
                      max={EXAM_TYPE_MAX}
                      className="form-control exam-builder-input"
                      value={examCounts[s.type] ?? 0}
                      onChange={(e) => {
                        if (e.target.value === '') return
                        applyExamCount(s.type, Number(e.target.value))
                      }}
                    />
                  </label>
                ))}
              </div>
              <div className="exam-builder-total mt-3">
                <strong>共 {examTotal} 题</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setExamCounts(defaultExamCounts())}>
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
