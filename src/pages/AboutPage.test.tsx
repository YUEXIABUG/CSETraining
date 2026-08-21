// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import AboutPage from './AboutPage'

afterEach(cleanup)

describe('AboutPage', () => {
  it('介绍网站功能，并说明全程离线、数据仅存本机', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AboutPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('关于本站')).toBeTruthy()
    // 功能介绍覆盖各训练模块
    expect(screen.getByText('多位加减法')).toBeTruthy()
    expect(screen.getAllByText(/套卷模式/).length).toBeGreaterThanOrEqual(1)
    // 离线与本地存储说明
    expect(screen.getByText(/全程不联网/)).toBeTruthy()
    expect(screen.getByText(/不发送网络请求/)).toBeTruthy()
    expect(screen.getByText(/本地存储（localStorage）/)).toBeTruthy()
    expect(screen.getAllByText(/导出/).length).toBeGreaterThanOrEqual(1)
  })
})
