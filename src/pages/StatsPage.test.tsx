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
})
