// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StatsPage from './StatsPage'

afterEach(cleanup)

/** 构造一条乘法练习记录（count 题中答对 correct 题，用时 1 分钟） */
function rec(i: number, correct: number, count = 10) {
  return {
    v: 1,
    id: `id-${i}`,
    ts: Date.UTC(2026, 7, i + 1, 10, 0),
    type: 'multiply',
    count,
    correct,
    wrong: count - correct,
    skipped: 0,
    timeMs: 60000,
  }
}

/** 构造一条套卷模式记录（含分模块统计） */
function examRec(i: number, correct: number, modules: { label: string; correct: number; total: number }[]) {
  return {
    v: 1,
    id: `exam-${i}`,
    ts: Date.UTC(2026, 7, i + 10, 10, 0),
    type: 'exam',
    count: 34,
    correct,
    wrong: 34 - correct,
    skipped: 0,
    timeMs: 60000,
    modules,
  }
}

function seed(records: unknown[]) {
  localStorage.setItem('cse-training-history', JSON.stringify(records))
}

function renderStats() {
  return render(
    <MemoryRouter initialEntries={['/stats']}>
      <StatsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  URL.createObjectURL = vi.fn(() => 'blob:mock')
  URL.revokeObjectURL = vi.fn()
})

describe('StatsPage', () => {
  it('没有记录时显示空状态', () => {
    renderStats()
    expect(screen.getByText('还没有练习记录')).toBeTruthy()
    expect(screen.getByText('开始训练')).toBeTruthy()
  })

  it('汇总统计、分模块统计与趋势图', () => {
    // 4 组练习：正确率 40% → 50% → 80% → 90%，总正确率 65%
    seed([rec(0, 4), rec(1, 5), rec(2, 8), rec(3, 9)])
    const { container } = renderStats()

    expect(screen.getByText('共 4 次练习')).toBeTruthy()
    expect(screen.getByText('40')).toBeTruthy() // 累计答题
    // 总正确率卡片与分模块行都会显示 65%
    expect(screen.getAllByText('65%').length).toBeGreaterThanOrEqual(2)
    // 分模块：乘法运算，最近 3 组均值 73% 对比之前 1 组 40% → +33
    const typeRow = container.querySelector('.type-stat-row')!
    expect(typeRow.textContent).toContain('乘法运算')
    expect(typeRow.textContent).toContain('4 组 · 40 题')
    expect(typeRow.textContent).toContain('+33')
    // 趋势折线图
    expect(container.querySelector('svg[aria-label="正确率趋势折线图"]')).toBeTruthy()
    // 练习记录含时间与用时
    expect(screen.getAllByText(/2026-08/).length).toBeGreaterThanOrEqual(1)
  })

  it('练习不足 4 组时进步幅度显示暂无对比', () => {
    seed([rec(0, 8)])
    renderStats()
    expect(screen.getByText('暂无对比')).toBeTruthy()
  })

  it('导出成绩生成 JSON 文件', () => {
    seed([rec(0, 8)])
    renderStats()
    fireEvent.click(screen.getByText('导出成绩'))
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/已导出 1 条记录/)).toBeTruthy()
  })

  it('导入成绩按 id 合并，重复记录跳过', async () => {
    seed([rec(0, 8)])
    const { container } = renderStats()

    const incoming = {
      app: 'cse-training-history',
      version: 1,
      records: [rec(0, 8), { ...rec(1, 9), id: 'new-device-id' }],
    }
    const file = new File([JSON.stringify(incoming)], 'grades.json', { type: 'application/json' })
    const input = container.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByText(/合并 1 条新记录/)).toBeTruthy()
    expect(screen.getByText('共 2 次练习')).toBeTruthy()
  })

  it('导入非法文件时给出错误提示', async () => {
    seed([rec(0, 8)])
    const { container } = renderStats()
    const file = new File(['这不是 JSON'], 'bad.json', { type: 'application/json' })
    const input = container.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByText(/导入失败/)).toBeTruthy()
  })

  it('删除历史数据：点击后弹出确认提醒，取消则记录保留', () => {
    seed([rec(0, 8), rec(1, 9)])
    renderStats()

    fireEvent.click(screen.getByText('删除历史数据'))
    expect(screen.getByText('确认删除全部成绩？')).toBeTruthy()
    expect(screen.getByText(/无法恢复/)).toBeTruthy()

    fireEvent.click(screen.getByText('取消'))
    expect(screen.queryByText('确认删除全部成绩？')).toBeNull()
    expect(screen.getByText('共 2 次练习')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('cse-training-history')!)).toHaveLength(2)
  })

  it('删除历史数据：确认后清空全部记录并回到空状态', () => {
    seed([rec(0, 8), rec(1, 9)])
    renderStats()

    fireEvent.click(screen.getByText('删除历史数据'))
    fireEvent.click(screen.getByText('确认删除'))

    expect(screen.getByText('还没有练习记录')).toBeTruthy()
    expect(localStorage.getItem('cse-training-history')).toBeNull()
  })

  it('练习记录可展开查看试卷详情，再次点击收起', () => {
    seed([rec(0, 8)])
    renderStats()

    fireEvent.click(screen.getByText('详情'))
    expect(screen.getByText('答对 8 题')).toBeTruthy()
    expect(screen.getByText('答错 2 题')).toBeTruthy()
    expect(screen.getByText('总用时 1 分 00 秒')).toBeTruthy()
    expect(screen.getByText('平均 6秒/题')).toBeTruthy()

    fireEvent.click(screen.getByText('详情'))
    expect(screen.queryByText('答对 8 题')).toBeNull()
  })

  it('套卷模式记录展开后可查看分模块表现', () => {
    seed([
      {
        ...rec(0, 20, 34),
        type: 'exam',
        wrong: 10,
        skipped: 4,
        modules: [
          { label: '加减法', correct: 3, total: 4 },
          { label: '基期增量', correct: 5, total: 12 },
        ],
      },
    ])
    renderStats()

    fireEvent.click(screen.getByText('详情'))
    expect(screen.getByText('分模块表现')).toBeTruthy()
    expect(screen.getByText('加减法')).toBeTruthy()
    expect(screen.getByText('对 3/4')).toBeTruthy()
    expect(screen.getByText('75%')).toBeTruthy()
    expect(screen.getByText('对 5/12')).toBeTruthy()
  })

  it('正确率趋势新增分模块折线图：仅练习 ≥2 组的模块单独绘制', () => {
    // 乘法 2 组（绘制）+ 分数比大小 1 组（不绘制）
    seed([rec(0, 4), rec(1, 6), { ...rec(2, 8), id: 'fraction-1', type: 'fraction' }])
    const { container } = renderStats()

    expect(screen.getByText(/分模块正确率趋势/)).toBeTruthy()
    const titles = Array.from(container.querySelectorAll('.module-trend-title')).map(
      (n) => n.textContent,
    )
    expect(titles).toContain('乘法运算')
    expect(titles).not.toContain('分数比大小')
    // 折线图总数 = 总正确率 1 张 + 分模块 1 张
    expect(container.querySelectorAll('svg[aria-label="正确率趋势折线图"]').length).toBe(2)
  })

  it('套卷分模块正确率并入对应单项模块趋势图，套卷整卷趋势图保留', () => {
    // 乘法：1 组单项练习（40%）+ 2 次套卷中的乘法成绩（60%、80%）→ 3 个数据点
    // 加减法：仅 1 次套卷数据点（不足 2 个，不绘制）
    seed([
      rec(0, 4),
      examRec(0, 20, [
        { label: '乘法运算', correct: 6, total: 10 },
        { label: '加减法', correct: 3, total: 4 },
      ]),
      examRec(1, 24, [{ label: '乘法运算', correct: 8, total: 10 }]),
    ])
    const { container } = renderStats()

    const cards = Array.from(container.querySelectorAll('.module-trend-card'))
    const titles = cards.map((c) => c.querySelector('.module-trend-title')?.textContent)
    expect(titles).toContain('乘法运算')
    // 套卷模式整卷总正确率趋势图保留
    expect(titles).toContain('套卷模式')
    expect(titles).not.toContain('多位加减法')

    const multiplyCard = cards.find(
      (c) => c.querySelector('.module-trend-title')?.textContent === '乘法运算',
    )!
    expect(multiplyCard.textContent).toContain('3 组')
    const dots = Array.from(multiplyCard.querySelectorAll('circle.tl-dot'))
    expect(dots).toHaveLength(3)
    // 来自套卷的 2 个数据点以空心圆展示
    expect(multiplyCard.querySelectorAll('circle.tl-dot-open')).toHaveLength(2)
    // 每个数据点带悬浮提示框，框内仅显示该点正确率
    const tooltips = Array.from(multiplyCard.querySelectorAll('.tl-point')).map(
      (g) => g.querySelector('.tl-tip-text')?.textContent ?? '',
    )
    expect(tooltips).toEqual(['40%', '60%', '80%'])

    // 套卷模式趋势图为整卷总正确率：2 次套卷 → 2 个数据点
    const examCard = cards.find(
      (c) => c.querySelector('.module-trend-title')?.textContent === '套卷模式',
    )!
    expect(examCard.querySelectorAll('circle.tl-dot')).toHaveLength(2)
  })

  it('没有记录时（首次进入）也可以直接导入本地 JSON 文件', async () => {
    const { container } = renderStats()
    expect(screen.getByText('还没有练习记录')).toBeTruthy()
    expect(screen.getByText('导入本地成绩')).toBeTruthy()

    const incoming = { app: 'cse-training-history', version: 1, records: [rec(0, 8)] }
    const file = new File([JSON.stringify(incoming)], 'grades.json', { type: 'application/json' })
    const input = container.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByText('共 1 次练习')).toBeTruthy()
    expect(screen.getByText(/导入完成：合并 1 条新记录/)).toBeTruthy()
  })

  it('趋势图支持日/周/月记录切换，按所选粒度聚合正确率', () => {
    // rec(i) 的时间为 8 月 (i+1) 日：rec(1) = 8 月 2 日（周日）40%、rec(2) = 8 月 3 日（周一）80%：
    // 日记录 → 2 个点；周记录 → 分属两周（7/27、8/3）仍 2 个点；月记录 → 合并为 (4+8)/20 = 60%
    seed([rec(1, 4), rec(2, 8)])
    const { container } = renderStats()
    const svg = container.querySelector('svg[aria-label="正确率趋势折线图"]')!
    const tips = () =>
      Array.from(svg.querySelectorAll('.tl-tip-text')).map((n) => n.textContent)

    expect(tips()).toEqual(['40%', '80%'])

    fireEvent.click(screen.getByText('周记录'))
    expect(tips()).toEqual(['40%', '80%'])
    expect(svg.textContent).toContain('7/27') // 8 月 2 日所在周从周一 7 月 27 日开始
    expect(svg.textContent).toContain('8/3')

    fireEvent.click(screen.getByText('月记录'))
    expect(tips()).toEqual(['60%'])
    expect(svg.textContent).toContain('2026/8')
  })

  it('趋势图仅统计最近半年的记录', () => {
    const day = 24 * 3600 * 1000
    const now = Date.now()
    seed([
      { ...rec(0, 4), id: 'old', ts: now - 200 * day },
      { ...rec(1, 6), id: 'recent-1', ts: now - 2 * day },
      { ...rec(2, 8), id: 'recent-2', ts: now - 1 * day },
    ])
    const { container } = renderStats()
    const svg = container.querySelector('svg[aria-label="正确率趋势折线图"]')!
    // 200 天前的记录不参与绘制，仅保留最近 2 条
    const tips = Array.from(svg.querySelectorAll('.tl-tip-text')).map((n) => n.textContent)
    expect(tips).toEqual(['60%', '80%'])
  })

  it('数据点悬浮提示为白色圆角矩形框，框内为黑色正确率', () => {
    seed([rec(0, 4), rec(1, 8)])
    const { container } = renderStats()
    const svg = container.querySelector('svg[aria-label="正确率趋势折线图"]')!
    const boxes = svg.querySelectorAll('.tl-tip-box')
    expect(boxes).toHaveLength(2)
    const rect = boxes[0].querySelector('rect.tl-tip-rect')!
    expect(rect.getAttribute('rx')).toBe('6')
    expect(boxes[0].querySelector('.tl-tip-text')!.textContent).toBe('40%')
  })
})
