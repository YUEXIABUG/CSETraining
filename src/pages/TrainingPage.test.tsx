// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AddSubQuestion, BasePeriodQuestion, MultiplyQuestion, QuestionType } from '../types'
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

vi.mock('../utils/generators', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/generators')>()
  return {
    ...actual,
    generateSet: (type: QuestionType) => {
      if (type === 'baseperiod') return [BQ1]
      if (type === 'addsub') return [ASQ1]
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
  it('提交后跳转到下一题，答完一组显示成绩单', () => {
    renderTraining('/train/multiply?count=2')

    expect(screen.getByText('200')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '100' } })
    fireEvent.click(screen.getByText('提交'))

    expect(screen.getByText('400')).toBeTruthy()
    expect(screen.queryByText('200')).toBeNull()
    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '100' } })
    fireEvent.click(screen.getByText('提交'))

    expect(screen.getByText(/成绩单/)).toBeTruthy()
    expect(screen.getByText(/正确率（2\/2）/)).toBeTruthy()
  })

  it('再来一组后回到第一题重新作答', () => {
    renderTraining('/train/multiply?count=2')

    fireEvent.change(screen.getByPlaceholderText('输入答案'), { target: { value: '100' } })
    fireEvent.click(screen.getByText('提交'))
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
    expect(screen.getByText('0%')).toBeTruthy()
    // 成绩单中基期量与增长量分别标注对错
    expect(screen.getAllByText('✓')).toHaveLength(1)
    expect(screen.getAllByText('✗')).toHaveLength(1)
  })
})
