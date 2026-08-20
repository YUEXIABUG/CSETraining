import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { CATEGORIES, EXAM_CATEGORY } from '../meta'

const PRESETS = [5, 10, 15, 20]
const STORAGE_KEY = 'cse-training-count'

function loadCount(): number {
  const saved = Number(sessionStorage.getItem(STORAGE_KEY))
  return Number.isFinite(saved) && saved >= 1 && saved <= 100 ? saved : 5
}

export default function HomePage() {
  const navigate = useNavigate()
  const [count, setCount] = useState(loadCount)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, String(count))
  }, [count])

  const applyCount = (v: number) => {
    if (!Number.isFinite(v)) return
    setCount(Math.min(100, Math.max(1, Math.round(v))))
  }

  const startExam = () => navigate('/train/exam')

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

      {/* 套卷模式：整卷固定 34 题，分模块出题 */}
      <section className="mt-4">
        <button type="button" className="exam-banner w-100" onClick={startExam}>
          <span className={`cat-icon ${EXAM_CATEGORY.tint}`}>
            <i className={`bi ${EXAM_CATEGORY.icon}`} />
          </span>
          <span className="exam-banner-body">
            <span className="cat-title d-block">{EXAM_CATEGORY.title}</span>
            <span className="cat-desc d-block">{EXAM_CATEGORY.desc}</span>
          </span>
          <span className="exam-banner-cta">
            开始考试
            <i className="bi bi-chevron-right ms-1" />
          </span>
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
                <span className="cat-desc d-block">{c.desc}</span>
              </span>
              <i className="bi bi-chevron-right cat-go" />
            </button>
          </div>
        ))}
      </section>

      <footer className="text-center text-muted small mt-5">
        加减法须完全准确 · 其余填空题允许 1% 以内误差 · 选择/比大小可先跳过稍后补答 · 交卷前会提醒未答题目
      </footer>

      <ThemeToggle />
    </div>
  )
}
