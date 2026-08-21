// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  appendSession,
  exportHistoryJson,
  loadHistory,
  mergeImportJson,
  type SessionRecord,
} from './history'

const KEY = 'cse-training-history'

const base = {
  type: 'multiply' as const,
  count: 10,
  correct: 8,
  wrong: 2,
  skipped: 0,
  timeMs: 60000,
}

beforeEach(() => localStorage.clear())

describe('history 本地存储', () => {
  it('追加记录后可读取，字段完整', () => {
    appendSession(base)
    appendSession({ ...base, type: 'fraction' })
    const all = loadHistory()
    expect(all).toHaveLength(2)
    expect(all[0].v).toBe(1)
    expect(all[0].id).toBeTruthy()
    expect(all[0].ts).toBeGreaterThan(0)
    expect(all[0]).toMatchObject(base)
    expect(all[1].type).toBe('fraction')
  })

  it('套卷模式的分模块统计会被保存', () => {
    appendSession({
      ...base,
      type: 'exam',
      count: 34,
      modules: [{ label: '加减法', correct: 3, total: 4 }],
    })
    const all = loadHistory()
    expect(all[0].modules).toEqual([{ label: '加减法', correct: 3, total: 4 }])
  })

  it('数据损坏时按空记录处理', () => {
    localStorage.setItem(KEY, '{oops')
    expect(loadHistory()).toHaveLength(0)
    localStorage.setItem(KEY, '{"not":"array"}')
    expect(loadHistory()).toHaveLength(0)
  })
})

describe('导出', () => {
  it('导出为带版本与应用标识的 JSON', () => {
    appendSession(base)
    const payload = JSON.parse(exportHistoryJson())
    expect(payload.app).toBe('cse-training-history')
    expect(payload.version).toBe(1)
    expect(typeof payload.exportedAt).toBe('string')
    expect(payload.records).toHaveLength(1)
    expect(payload.records[0]).toMatchObject(base)
  })
})

describe('导入合并', () => {
  it('按 id 去重：已有记录跳过，新记录合并', () => {
    const recA = appendSession(base)
    const recB: SessionRecord = {
      v: 1,
      id: 'other-device-id',
      ts: Date.now(),
      ...base,
      correct: 5,
      wrong: 5,
    }
    const res = mergeImportJson(
      JSON.stringify({ app: 'cse-training-history', version: 1, records: [recA, recB] }),
    )
    expect(res.added).toBe(1)
    expect(res.skipped).toBe(1)
    expect(loadHistory()).toHaveLength(2)
  })

  it('兼容纯数组格式', () => {
    const res = mergeImportJson(JSON.stringify([{ v: 1, id: 'x', ts: 1, ...base }]))
    expect(res.added).toBe(1)
    expect(loadHistory()).toHaveLength(1)
  })

  it('非法记录被丢弃并计数', () => {
    const res = mergeImportJson(
      JSON.stringify({
        records: [
          { id: 'bad-type', ts: 1, type: 'unknown', count: 1, correct: 1, wrong: 0, skipped: 0, timeMs: 1 },
          { id: 'missing-fields', ts: 1 },
          { v: 1, id: 'ok', ts: 1, ...base },
        ],
      }),
    )
    expect(res.added).toBe(1)
    expect(res.invalid).toBe(2)
    expect(loadHistory()).toHaveLength(1)
  })

  it('非法 JSON 与无法识别的结构抛出带提示的错误', () => {
    expect(() => mergeImportJson('not-json')).toThrow(/不是有效的 JSON/)
    expect(() => mergeImportJson('{"foo":1}')).toThrow(/未找到成绩记录/)
  })

  it('导入后记录按时间升序排列', () => {
    appendSession({ ...base, correct: 1 })
    mergeImportJson(
      JSON.stringify({ records: [{ v: 1, id: 'older', ts: 1000, ...base, correct: 2 }] }),
    )
    const all = loadHistory()
    expect(all[0].id).toBe('older')
  })
})
