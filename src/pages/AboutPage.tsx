import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { CATEGORIES, EXAM_CATEGORY } from '../meta'
import type { QuestionType } from '../types'

/** 跑马灯标语（渲染两份拷贝实现无缝滚动） */
const TICKER_ITEMS = [
  '✏️ 速算练起来',
  '📊 资料分析稳稳拿捏',
  '⏱️ 逐题计时',
  '⏸️ 随时暂停休息',
  '🎯 自动判分',
  '💾 成绩只存本机',
  '🧮 六大专项 + 套卷模式',
  '🚀 一战成「公」',
]

/** 各训练模块一句话说明 */
const MODULE_SUBS: Record<QuestionType, string> = {
  addsub: '整数加减混合 · 须完全准确',
  multiply: '三位数 × 百分比 · 允许 1% 误差',
  fraction: '两个接近的分数 · 点选比大小',
  baseperiod: '由现期量与增长率求基期量与增长量',
  baseperiodshare: '四选一求基期比重',
  sharegap: '四选一判断比重差方向与数值',
  exam: '默认 34 题整卷 · 支持自定义题型与题数',
}

/** 答题体验 */
const ANSWER_FEATURES = [
  { emoji: '🖱️', text: '自由跳题：点击进度条上的任意题号即可切换，「上一题」可回看并修改已答题目' },
  { emoji: '🖍️', text: '荧光笔进度条：已答画绿色「Z」字、看了没答画红色、未看保持灰底，作答状态一目了然' },
  { emoji: '⏱️', text: '逐题计时：每题单独累计用时，全组总计时实时展示，跳题来回切换也会正确累计' },
  { emoji: '⏸️', text: '暂停答题：答题中可随时点「暂停」，弹窗实时显示已离开时间，暂停期间不计入用时' },
  { emoji: '🛡️', text: '交卷保护：提交时若有未答题目，会弹窗列出题号，可选返回补答或仍要提交' },
  { emoji: '🚪', text: '离开确认：答题过程中点击「返回」会弹窗确认，防止误触丢失进度' },
  { emoji: '🔢', text: '每组题数自选：单项训练默认 5 题，支持 1–100 自定义' },
  { emoji: '🧩', text: '自定义套卷：首页「自定义套卷 · 题型与题数」可为每个题型单独设置题数（0 表示不包含），搭建专属试卷' },
  { emoji: '🌓', text: '亮暗主题：右下角悬浮按钮一键切换，自动记住你的偏好' },
]

/** 成绩单 */
const RESULT_FEATURES = [
  { emoji: '📊', text: '成绩总览：正确率、总用时、平均每题用时；「基期与增长量」按基期量、增长量分别统计' },
  { emoji: '🧾', text: '题号表：答对绿色、答错红色、未作答灰色（套卷模式按模块分组），点击题号即可定位记录卡片' },
  { emoji: '🔍', text: '「仅看错题」：一键筛选，答题记录只保留答错与未作答的题目' },
  { emoji: '📈', text: '图表分析：答对 / 答错 / 未作答饼图 + 每题用时折线图，套卷模式另附分模块正确率与模块详情' },
  { emoji: '📝', text: '逐题记录：题目、我的答案、正确答案（含计算过程）、对错与用时逐题展示，未作答明确标注' },
]

/** 我的成绩 */
const STATS_FEATURES = [
  { emoji: '💾', text: '自动记录：每次交卷自动保存一条成绩（模块、题数、对错、用时），最多保留 500 条' },
  { emoji: '📈', text: '正确率趋势：最近半年的走势折线图，支持日 / 周 / 月记录切换，另附分模块趋势图' },
  { emoji: '🏅', text: '分模块统计：各模块练习量、正确率、平均每题用时与进步幅度（最近 3 组对比之前 3 组）' },
  { emoji: '📋', text: '练习记录：最近 30 条明细，每条可点「详情」展开回看该次试卷的对错与用时' },
  { emoji: '📦', text: '导出 / 导入：一键导出 JSON 备份，换设备或浏览器时导入即可去重合并，不覆盖已有数据' },
]

const RULES = [
  '多位加减法：答案必须完全准确',
  '乘法：允许 1% 以内误差',
  '基期与增长量：允许 2% 以内误差（基期量与增长量分别判分）',
  '分数比大小、基期比重、比重差：选对即得分',
  '未作答题目按错误计入正确率，成绩单中会单独标注',
]

export default function AboutPage() {
  const navigate = useNavigate()
  return (
    <div className="fade-in about-page">
      <div className="quiz-top">
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/')}>
          <i className="bi bi-chevron-left me-1" />
          返回
        </button>
        <div className="fw-bold fs-5 quiz-title-static">关于本站</div>
      </div>

      {/* 顶部横幅：彩虹渐变标题 + 漂浮贴纸 + 徽章 */}
      <section className="about-hero mt-4">
        <span className="about-tape about-tape-l" aria-hidden="true" />
        <span className="about-tape about-tape-r" aria-hidden="true" />
        <span className="about-float about-float-1" aria-hidden="true">📝</span>
        <span className="about-float about-float-2" aria-hidden="true">🧮</span>
        <span className="about-float about-float-3" aria-hidden="true">📊</span>
        <span className="about-float about-float-4" aria-hidden="true">🎯</span>
        <div className="about-hero-pill">📖 资料分析 · 速算练习笔记</div>
        <h1 className="about-hero-title">考公速算训练营</h1>
        <p className="about-hero-sub">
          专为公务员考试<strong>资料分析</strong>打造的速算刷题工具 · 题目由出题引擎本地随机生成
        </p>
        <div className="about-badges">
          <span className="about-badge">🧮 六大专项 + 套卷</span>
          <span className="about-badge">⏸️ 随时暂停</span>
          <span className="about-badge">💾 数据仅存本机</span>
          <span className="about-badge">🌓 亮暗双主题</span>
        </div>
      </section>

      {/* 标语跑马灯 */}
      <div className="about-ticker mt-4" aria-hidden="true">
        <div className="about-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} className="about-ticker-item">
              {t}
              <span className="about-ticker-dot">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* 这是什么：模块贴纸墙 */}
      <section className="about-card tilt-l mt-4">
        <h2 className="section-title">
          <i className="bi bi-journal-bookmark me-2" />
          <span className="about-title-text">这是什么</span>
        </h2>
        <p className="about-text">
          「考公速算训练营」覆盖六大专项训练与套卷模式，全部题目由内置出题引擎随机生成，随刷随新：
        </p>
        <div className="about-modules">
          {CATEGORIES.map((c) => (
            <div key={c.type} className="about-module">
              <span className={`cat-icon ${c.tint}`}>
                <i className={`bi ${c.icon}`} />
              </span>
              <span className="about-module-title">{c.title}</span>
              <span className="about-module-sub">{MODULE_SUBS[c.type]}</span>
            </div>
          ))}
          <div className="about-module">
            <span className={`cat-icon ${EXAM_CATEGORY.tint}`}>
              <i className={`bi ${EXAM_CATEGORY.icon}`} />
            </span>
            <span className="about-module-title">{EXAM_CATEGORY.title}</span>
            <span className="about-module-sub">{MODULE_SUBS[EXAM_CATEGORY.type]}</span>
          </div>
        </div>
      </section>

      {/* 答题体验 */}
      <section className="about-card tape-pink tilt-r mt-4">
        <h2 className="section-title">
          <i className="bi bi-pencil-square me-2" />
          <span className="about-title-text">答题体验</span>
        </h2>
        <div className="about-features">
          {ANSWER_FEATURES.map((f) => (
            <div key={f.text} className="about-feature">
              <span className="about-feature-emoji" aria-hidden="true">
                {f.emoji}
              </span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 成绩单 */}
      <section className="about-card tape-green tilt-l mt-4">
        <h2 className="section-title">
          <i className="bi bi-clipboard-data me-2" />
          <span className="about-title-text">成绩单</span>
        </h2>
        <div className="about-features">
          {RESULT_FEATURES.map((f) => (
            <div key={f.text} className="about-feature">
              <span className="about-feature-emoji" aria-hidden="true">
                {f.emoji}
              </span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 我的成绩 */}
      <section className="about-card tape-pink tilt-r mt-4">
        <h2 className="section-title">
          <i className="bi bi-trophy me-2" />
          <span className="about-title-text">我的成绩</span>
        </h2>
        <div className="about-features">
          {STATS_FEATURES.map((f) => (
            <div key={f.text} className="about-feature">
              <span className="about-feature-emoji" aria-hidden="true">
                {f.emoji}
              </span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 判分规则：勾选清单 */}
      <section className="about-card tape-green tilt-l mt-4">
        <h2 className="section-title">
          <i className="bi bi-check2-square me-2" />
          <span className="about-title-text">判分规则速览</span>
        </h2>
        <ul className="about-checks">
          {RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      {/* 隐私与数据：简要说明 */}
      <section className="about-card tilt-r mt-4">
        <h2 className="section-title">
          <i className="bi bi-shield-check me-2" />
          <span className="about-title-text">隐私与数据</span>
        </h2>
        <div className="about-note">
          <p>
            <i className="bi bi-hdd me-2" />
            主题偏好、题数设置与历次成绩均保存在你本机浏览器的本地存储（localStorage）中；本站为纯前端页面，不收集任何个人数据。
          </p>
          <p className="mb-0">
            <i className="bi bi-exclamation-circle me-2" />
            <strong>请注意：</strong>
            清除浏览器数据或更换浏览器 / 设备会丢失成绩记录，建议在「我的成绩」页定期<strong>导出</strong>
            JSON 文件备份，到新环境<strong>导入</strong>即可合并。
          </p>
        </div>
      </section>

      <footer className="text-center small mt-5">
        🎓 考公速算训练营 · 纯前端开源项目 · 祝备考顺利，一战成「公」🎉
      </footer>

      <ThemeToggle />
    </div>
  )
}
