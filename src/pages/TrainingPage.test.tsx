// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  AddSubQuestion,
  BasePeriodQuestion,
  BasePeriodShareQuestion,
  FractionQuestion,
  MultiplyQuestion,
  QuestionType,
  ShareGapQuestion,
} from '../types'
import TrainingPage from './TrainingPage'

afterEach(cleanup)

const MQ1: MultiplyQuestion = { type: 'multiply', base: 200, percent: 50, answer: 100 }
const MQ2: MultiplyQuestion = { type: 'multiply', base: 400, percent: 25, answer: 100 }
const ASQ1: AddSubQuestion = {
  type: 'addsub',
  terms: [
    { sign: 1, value: 1000 },
    { sign: 1, value: 2000 },
    { sign: 1, value: 3000 },
    { sign: 1, value: 4000 },
  ],
  answer: 10000,
}
const BQ1: BasePeriodQuestion = {
  type: 'baseperiod',
  amount: 10000,
  percent: 25,
  baseAnswer: 8000,
  growthAnswer: 2000,
}
const FQ1: FractionQuestion = {
  type: 'fraction',
  left: { n: 1, d: 2 },
  right: { n: 2, d: 5 },
  answer: '>',
}
const BPS1: BasePeriodShareQuestion = {
  type: 'baseperiodshare',
  part: 2000,
  total: 5000,
  ra: 10,
  rb: 5,
  options: ['38.18%', '40.00%', '36.36%', '42.11%'],
  correctIndex: 0,
  answer: 38.18,
}
const SG1: ShareGapQuestion = {
  type: 'sharegap',
  part: 2125,
  total: 3640,
  ra: 18.7,
  rb: 28.2,
  options: ['上升 4.67 个百分点', '下降 4.67 个百分点', '上升 5.13 个百分点', '下降 5.13 个百分点'],
  correctIndex: 1,
  answer: -4.67,
}

vi.mock('../utils/generators', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/generators')>()
  return {
    ...actual,
    generateSet: (type: QuestionType, count: number) => {
      if (type === 'baseperiod') return [BQ1]
      if (type === 'addsub') return [ASQ1]
      if (type === 'fraction') return Array.from({ length: count }, () => FQ1)
      if (type === 'baseperiodshare') return [BPS1]
      if (type === 'sharegap') return [SG1]
      if (type === 'exam') return actual.generateExam()
      return [MQ1, MQ2]
    },
  }
})

function renderTraining(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/train/:type" element={<TrainingPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TrainingPage 答题流程', () => {
  it('非末题显示「下一题」，末题显示「提交」，答完出成绩单', () => {
    const { container } = renderTraining('/train/multiply?count=2')

    expect(screen.getByText('200')).toBeTruthy()
    expect(screen.queryByText('提交')).toBeNull()
    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '100' } })
    fireEvent.click(screen.getByText('下一题'))

    expect(screen.getByText('400')).toBeTruthy()
    expect(screen.queryByText('200')).toBeNull()
    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '100' } })
    fireEvent.click(screen.getByText('提交'))

    expect(screen.getByText(/成绩单/)).toBeTruthy()
    expect(screen.getByText(/正确率（2\/2）/)).toBeTruthy()
    // 成绩单：题号列、图表分析、记录卡片，且左上角无返回首页
    expect(screen.getByText('题号 1')).toBeTruthy()
    expect(screen.getByText(/答题分析/)).toBeTruthy()
    expect(container.querySelector('.donut-svg')).toBeTruthy()
    expect(container.querySelector('.timeline-svg')).toBeTruthy()
    expect(screen.getByText(/答题记录/)).toBeTruthy()
  })

  it('再来一组后回到第一题重新作答', () => {
    renderTraining('/train/multiply?count=2')

    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '100' } })
    fireEvent.click(screen.getByText('下一题'))
    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '100' } })
    fireEvent.click(screen.getByText('提交'))

    fireEvent.click(screen.getByText('再来一组'))
    expect(screen.getByPlaceholderText('输入答案')).toBeTruthy()
    expect(screen.getByText(/第 1 \/ 2 题/)).toBeTruthy()
  })

  it('加减法答案不得有误差', () => {
    renderTraining('/train/addsub?count=1')

    // 9950 相对正确答案 10000 误差约 0.5%，旧容差规则会判对，现在必须判错
    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '9950' } })
    fireEvent.click(screen.getByText('提交'))
    expect(screen.getByText(/正确率（0\/1）/)).toBeTruthy()
    expect(screen.getByText('✗ 错误')).toBeTruthy()
  })

  it('答题期间可以切换亮暗主题', () => {
    localStorage.removeItem('cse-training-theme')
    document.documentElement.dataset.theme = 'light'
    renderTraining('/train/multiply?count=2')

    const btn = screen.getByLabelText('切换亮暗主题')
    fireEvent.click(btn)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.dataset.bsTheme).toBe('dark')
    fireEvent.click(btn)
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('基期与增长量需同时填写，成绩单分别判对错并分别统计正确率', () => {
    renderTraining('/train/baseperiod?count=1')

    // 基期量 8000 正确；增长量 2100 相对 2000 误差 5%，判错
    fireEvent.change(screen.getByPlaceholderText('输入基期量'), { target: { value: '8000' } })
    fireEvent.change(screen.getByPlaceholderText('输入增长量'), { target: { value: '2100' } })
    fireEvent.click(screen.getByText('提交'))

    expect(screen.getByText(/基期量正确率/)).toBeTruthy()
    expect(screen.getByText(/增长量正确率/)).toBeTruthy()
    expect(screen.getByText('100%')).toBeTruthy()
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1)
    // 成绩单中基期量与增长量分别标注对错
    expect(screen.getAllByText('✓')).toHaveLength(1)
    expect(screen.getAllByText('✗')).toHaveLength(1)
  })
})

describe('TrainingPage 跳题与回看', () => {
  it('可点击进度条题号切换题目，返回后答案保留', () => {
    renderTraining('/train/multiply?count=2')

    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '100' } })
    // 点击进度条上的第 2 题
    fireEvent.click(screen.getByText('2'))
    expect(screen.getByText('400')).toBeTruthy()
    // 通过「上一题」回到第 1 题
    fireEvent.click(screen.getByText('上一题'))
    expect(screen.getByText('200')).toBeTruthy()
    // 之前填写的答案仍然保留
    expect((screen.getByPlaceholderText('输入答案') as HTMLInputElement).value).toBe('100')
  })

  it('填空题可留空直接下一题，提交时弹窗提醒未答题目', () => {
    renderTraining('/train/multiply?count=2')

    // 第 1 题留空，直接下一题
    fireEvent.click(screen.getByText('下一题'))
    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '100' } })
    fireEvent.click(screen.getByText('提交'))

    // 弹窗提醒第 1 题未答
    expect(screen.getByText(/还有 1 题未作答/)).toBeTruthy()
    // 点「仍要提交」→ 未答题按错计
    fireEvent.click(screen.getByText('仍要提交'))
    expect(screen.getByText(/成绩单/)).toBeTruthy()
    expect(screen.getByText(/正确率（1\/2）/)).toBeTruthy()
    // 记录卡片与饼图图例都会出现「未作答」
    expect(screen.getAllByText('未作答').length).toBeGreaterThanOrEqual(1)
  })

  it('弹窗点「返回作答」会跳到第一道未答题', () => {
    renderTraining('/train/multiply?count=2')

    fireEvent.click(screen.getByText('下一题'))
    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '100' } })
    fireEvent.click(screen.getByText('提交'))
    expect(screen.getByText(/还有 1 题未作答/)).toBeTruthy()
    fireEvent.click(screen.getByText('返回作答'))
    // 回到第 1 题（200 × 50%）
    expect(screen.getByText('200')).toBeTruthy()
  })

  it('选择题可以「先不答」跳过，稍后可回来补答', () => {
    renderTraining('/train/fraction?count=1')

    expect(screen.getByText('先不答')).toBeTruthy()
    fireEvent.click(screen.getByText('先不答'))
    // 唯一一题先不答 → 触发提交提醒
    expect(screen.getByText(/还有 1 题未作答/)).toBeTruthy()
    fireEvent.click(screen.getByText('返回作答'))
    // 回到该题，选择「＞（左边更大）」后提交
    fireEvent.click(screen.getByTitle('左边分数更大'))
    fireEvent.click(screen.getByText('提交'))
    expect(screen.getByText(/正确率（1\/1）/)).toBeTruthy()
  })

  it('选择题点击选项后自动跳转下一题，末题点选项不跳转', () => {
    renderTraining('/train/fraction?count=2')

    // 第 1 题点击「＞」后自动跳到第 2 题
    fireEvent.click(screen.getByTitle('左边分数更大'))
    expect(screen.getByText(/第 2 \/ 2 题/)).toBeTruthy()

    // 第 2 题（末题）点选项仅记录、不跳转，显示提交
    fireEvent.click(screen.getByTitle('左边分数更大'))
    expect(screen.getByText('提交')).toBeTruthy()
    fireEvent.click(screen.getByText('提交'))
    expect(screen.getByText(/正确率（2\/2）/)).toBeTruthy()
  })

  it('答题中点击返回需确认，确认后回首页', () => {
    renderTraining('/train/multiply?count=2')
    fireEvent.click(screen.getByText('返回'))
    expect(screen.getByText(/确认返回首页/)).toBeTruthy()
    // 取消后仍在答题
    fireEvent.click(screen.getByText('继续答题'))
    expect(screen.getByPlaceholderText('输入答案')).toBeTruthy()
  })
})

describe('TrainingPage 新选择题型', () => {
  it('套卷模式进度条分模块显示六个模块', () => {
    renderTraining('/train/exam')
    expect(screen.getByText(/答题进度/)).toBeTruthy()
    for (const label of ['加减法', '比较大小', '乘法运算', '基期比重', '比重差', '基期增量']) {
      expect(screen.getByText(label)).toBeTruthy()
    }
    // 共 34 个题号，最后一题为 34
    expect(screen.getByText('34')).toBeTruthy()
    expect(screen.getByText(/第 1 \/ 34 题/)).toBeTruthy()
  })

  it('基期比重选择题：点选正确选项得分', () => {
    renderTraining('/train/baseperiodshare?count=1')
    expect(screen.getByText('A = 2000')).toBeTruthy()
    fireEvent.click(screen.getByText('38.18%'))
    fireEvent.click(screen.getByText('提交'))
    expect(screen.getByText(/正确率（1\/1）/)).toBeTruthy()
  })

  it('比重差选择题：点选正确选项得分', () => {
    renderTraining('/train/sharegap?count=1')
    fireEvent.click(screen.getByText('下降 4.67 个百分点'))
    fireEvent.click(screen.getByText('提交'))
    expect(screen.getByText(/正确率（1\/1）/)).toBeTruthy()
  })
})

describe('TrainingPage 成绩记录与进度样式', () => {
  it('交卷后将本次成绩写入本地记录', () => {
    localStorage.removeItem('cse-training-history')
    renderTraining('/train/multiply?count=2')

    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '100' } })
    fireEvent.click(screen.getByText('下一题'))
    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '100' } })
    fireEvent.click(screen.getByText('提交'))

    const raw = localStorage.getItem('cse-training-history')
    expect(raw).toBeTruthy()
    const records = JSON.parse(raw!)
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      type: 'multiply',
      count: 2,
      correct: 2,
      wrong: 0,
      skipped: 0,
    })
    expect(records[0].timeMs).toBeGreaterThanOrEqual(0)
  })

  it('已答 / 看过的进度圆圈显示荧光笔涂抹标记', () => {
    const { container } = renderTraining('/train/multiply?count=2')

    // 初始：第 1 题正在显示（看了没答），其圆圈有一个红色标记；图例常驻两个示例标记
    expect(container.querySelectorAll('.prog-chip .chip-mark')).toHaveLength(1)
    expect(container.querySelectorAll('.prog-chip.st-viewed .chip-mark')).toHaveLength(1)
    expect(container.querySelectorAll('.legend-chip .chip-mark')).toHaveLength(2)

    // 第 1 题作答后跳到第 2 题：第 1 题绿色标记，第 2 题红色标记
    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '100' } })
    fireEvent.click(screen.getByText('下一题'))
    expect(container.querySelectorAll('.prog-chip .chip-mark')).toHaveLength(2)
    expect(container.querySelectorAll('.prog-chip.st-answered .chip-mark')).toHaveLength(1)

    // 直接点提交触发未答提醒：第 2 题仍是「看了没答」红色标记
    fireEvent.click(screen.getByText('提交'))
    expect(container.querySelectorAll('.prog-chip.st-viewed .chip-mark')).toHaveLength(1)
  })
})
