// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import AboutPage from './AboutPage'

afterEach(cleanup)

describe('AboutPage', () => {
  it('详细介绍各页面功能，并说明数据仅存本机', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AboutPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('关于本站')).toBeTruthy()
    // 功能介绍覆盖各训练模块
    expect(screen.getByText('多位加减法')).toBeTruthy()
    expect(screen.getAllByText(/套卷模式/).length).toBeGreaterThanOrEqual(1)
    // 按页面分区介绍功能
    expect(screen.getByText('答题体验')).toBeTruthy()
    expect(screen.getByText('成绩单')).toBeTruthy()
    expect(screen.getByText('我的成绩')).toBeTruthy()
    // 包含暂停功能介绍
    expect(screen.getAllByText(/暂停/).length).toBeGreaterThanOrEqual(1)
    // 本地存储说明与导出导入提示
    expect(screen.getByText(/本地存储（localStorage）/)).toBeTruthy()
    expect(screen.getAllByText(/导出/).length).toBeGreaterThanOrEqual(1)
  })
})
