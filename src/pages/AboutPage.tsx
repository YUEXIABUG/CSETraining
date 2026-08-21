import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { CATEGORIES, EXAM_CATEGORY } from '../meta'

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

      <section className="panel mt-4">
        <h2 className="section-title">
          <i className="bi bi-journal-bookmark me-2" />
          这是什么
        </h2>
        <p className="about-text">
          「考公速算训练营」是一个专为公务员考试<strong>资料分析</strong>板块打造的速算刷题工具。
          题目由内置出题引擎在本地随机生成，覆盖六大专项训练与套卷模式：
        </p>
        <ul className="about-list">
          {CATEGORIES.map((c) => (
            <li key={c.type}>
              <i className={`bi ${c.icon} me-2`} />
              {c.title}
            </li>
          ))}
          <li>
            <i className={`bi ${EXAM_CATEGORY.icon} me-2`} />
            {EXAM_CATEGORY.title}（34 题整卷，分模块出题）
          </li>
        </ul>
      </section>

      <section className="panel mt-4">
        <h2 className="section-title">
          <i className="bi bi-stars me-2" />
          功能亮点
        </h2>
        <ul className="about-list">
          <li>逐题计时 + 全组总计时，跳题回看时用时也会正确累计</li>
          <li>自动判分：填空题允许 1% 以内误差（加减法须完全准确），选择题即点即判</li>
          <li>成绩单提供正确率饼图、每题用时折线图与逐题详解</li>
          <li>「我的成绩」自动记录历次练习，统计正确率趋势与分模块进步幅度</li>
          <li>成绩支持导出 / 导入 JSON 文件，跨设备、跨浏览器自由迁移</li>
          <li>亮暗主题一键切换，自动记住你的偏好</li>
        </ul>
      </section>

      <section className="panel mt-4">
        <h2 className="section-title">
          <i className="bi bi-shield-lock me-2" />
          隐私与数据：全程不联网
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

      <section className="panel mt-4">
        <h2 className="section-title">
          <i className="bi bi-check2-square me-2" />
          判分规则速览
        </h2>
        <ul className="about-list">
          <li>多位加减法：答案必须完全准确</li>
          <li>乘法 / 基期与增长量：允许 1% 以内误差（基期量与增长量分别判分）</li>
          <li>分数比大小、基期比重、比重差：选对即得分</li>
          <li>未作答题目按错误计入正确率，成绩单中会单独标注</li>
        </ul>
      </section>

      <footer className="text-center text-muted small mt-5">
        考公速算训练营 · 纯前端开源项目 · 祝备考顺利 🎉
      </footer>

      <ThemeToggle />
    </div>
  )
}
