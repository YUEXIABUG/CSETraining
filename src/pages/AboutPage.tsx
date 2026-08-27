import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { CATEGORIES, EXAM_CATEGORY } from '../meta'

/** 跑马灯标语（渲染两份拷贝实现无缝滚动） */
const TICKER_ITEMS = [
  '✏️ 速算练起来',
  '📊 资料分析稳稳拿捏',
  '⏱️ 逐题计时',
  '🎯 自动判分',
  '🔌 离线可用 · 零收集',
  '💾 成绩只存本机',
  '🧮 六大专项 + 套卷模式',
  '🚀 一战成「公」',
]

const FEATURES = [
  { emoji: '⏱️', text: '逐题计时 + 全组总计时，跳题回看时用时也会正确累计' },
  { emoji: '🧮', text: '自动判分：乘法允许 1% 以内误差、基期与增长量允许 2% 以内误差（加减法须完全准确），选择题即点即判' },
  { emoji: '📈', text: '成绩单提供正确率饼图、每题用时折线图与逐题详解' },
  { emoji: '🏆', text: '「我的成绩」自动记录历次练习，统计正确率趋势与分模块进步幅度' },
  { emoji: '📦', text: '成绩支持导出 / 导入 JSON 文件，跨设备、跨浏览器自由迁移' },
  { emoji: '🌓', text: '亮暗主题一键切换，自动记住你的偏好' },
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
          <span className="about-badge">🔌 离线可用</span>
          <span className="about-badge">💾 数据仅存本机</span>
          <span className="about-badge">🆓 纯前端开源</span>
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
            </div>
          ))}
          <div className="about-module">
            <span className={`cat-icon ${EXAM_CATEGORY.tint}`}>
              <i className={`bi ${EXAM_CATEGORY.icon}`} />
            </span>
            <span className="about-module-title">{EXAM_CATEGORY.title}</span>
            <span className="about-module-sub">34 题整卷 · 分模块出题</span>
          </div>
        </div>
      </section>

      {/* 功能亮点：emoji 徽章卡片 */}
      <section className="about-card tape-pink tilt-r mt-4">
        <h2 className="section-title">
          <i className="bi bi-stars me-2" />
          <span className="about-title-text">功能亮点</span>
        </h2>
        <div className="about-features">
          {FEATURES.map((f) => (
            <div key={f.text} className="about-feature">
              <span className="about-feature-emoji" aria-hidden="true">
                {f.emoji}
              </span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 隐私与数据：便签纸 + 红色印章 */}
      <section className="about-card about-privacy tilt-l mt-4">
        <div className="about-stamp" aria-hidden="true">
          不联网
        </div>
        <h2 className="section-title">
          <i className="bi bi-shield-lock me-2" />
          <span className="about-title-text">隐私与数据：全程不联网</span>
        </h2>
        <div className="about-note">
          <p>
            <i className="bi bi-wifi-off me-2" />
            <strong>本站没有任何后端服务器。</strong>
            打开页面后所有功能均在你的浏览器内完成：不发送网络请求、不收集任何数据、没有统计脚本与广告。
          </p>
          <p>
            <i className="bi bi-hdd me-2" />
            <strong>所有数据都只存在你自己的浏览器里。</strong>
            主题偏好、题数设置与历次成绩均保存在本机浏览器的本地存储（localStorage）中，绝不会上传到任何地方。
          </p>
          <p className="mb-0">
            <i className="bi bi-exclamation-circle me-2" />
            <strong>请注意：</strong>
            清除浏览器数据或更换浏览器 / 设备会丢失成绩记录。建议在「我的成绩」页定期
            <strong>导出</strong> JSON 文件备份，并在新环境中<strong>导入</strong>合并。
          </p>
        </div>
      </section>

      {/* 判分规则：勾选清单 */}
      <section className="about-card tape-green tilt-r mt-4">
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

      <footer className="text-center small mt-5">
        🎓 考公速算训练营 · 纯前端开源项目 · 祝备考顺利，一战成「公」🎉
      </footer>

      <ThemeToggle />
    </div>
  )
}
