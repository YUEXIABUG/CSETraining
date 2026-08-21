import { isQuestionType } from '../meta'
import type { QuestionType } from '../types'

/** 一次练习（交卷）的成绩记录 */
export interface SessionRecord {
  /** 记录格式版本 */
  v: 1
  /** 唯一标识（导入合并时按此去重） */
  id: string
  /** 交卷时间戳（毫秒） */
  ts: number
  type: QuestionType
  /** 本组题数 */
  count: number
  /** 答对题数 */
  correct: number
  /** 答错题数 */
  wrong: number
  /** 未作答题数 */
  skipped: number
  /** 总用时（毫秒） */
  timeMs: number
  /** 套卷模式：分模块统计 */
  modules?: { label: string; correct: number; total: number }[]
}

export interface HistoryExport {
  app: 'cse-training-history'
  version: 1
  exportedAt: string
  records: SessionRecord[]
}

export interface ImportResult {
  /** 新增（本地原本没有）的记录数 */
  added: number
  /** 因重复被跳过的记录数 */
  skipped: number
  /** 格式不合法被丢弃的记录数 */
  invalid: number
}

const STORAGE_KEY = 'cse-training-history'
/** 本地最多保留的记录数，避免无限增长 */
const MAX_RECORDS = 500

function newId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function saveAll(records: SessionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    /* 隐私模式等场景下忽略存储失败 */
  }
}

/** 过滤并校验单条记录，非法返回 null */
function sanitizeRecord(item: unknown): SessionRecord | null {
  if (typeof item !== 'object' || item === null) return null
  const r = item as Record<string, unknown>
  if (typeof r.id !== 'string' || r.id === '') return null
  if (typeof r.ts !== 'number' || !Number.isFinite(r.ts)) return null
  if (typeof r.type !== 'string' || !isQuestionType(r.type)) return null
  if (
    typeof r.count !== 'number' ||
    !Number.isFinite(r.count) ||
    typeof r.correct !== 'number' ||
    !Number.isFinite(r.correct) ||
    typeof r.wrong !== 'number' ||
    !Number.isFinite(r.wrong) ||
    typeof r.skipped !== 'number' ||
    !Number.isFinite(r.skipped) ||
    typeof r.timeMs !== 'number' ||
    !Number.isFinite(r.timeMs)
  ) {
    return null
  }
  const rec: SessionRecord = {
    v: 1,
    id: r.id,
    ts: r.ts,
    type: r.type,
    count: r.count,
    correct: r.correct,
    wrong: r.wrong,
    skipped: r.skipped,
    timeMs: r.timeMs,
  }
  if (Array.isArray(r.modules)) {
    const mods = r.modules.filter(
      (m): m is { label: string; correct: number; total: number } => {
        if (typeof m !== 'object' || m === null) return false
        const mm = m as Record<string, unknown>
        return (
          typeof mm.label === 'string' &&
          typeof mm.correct === 'number' &&
          typeof mm.total === 'number'
        )
      },
    )
    if (mods.length > 0) rec.modules = mods
  }
  return rec
}

/** 读取全部历史记录（按时间升序） */
export function loadHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(sanitizeRecord)
      .filter((r): r is SessionRecord => r !== null)
  } catch {
    return []
  }
}

/** 追加一条记录，返回写入后的完整记录 */
export function appendSession(
  input: Omit<SessionRecord, 'v' | 'id' | 'ts'>,
): SessionRecord {
  const rec: SessionRecord = { v: 1, id: newId(), ts: Date.now(), ...input }
  const all = loadHistory()
  all.push(rec)
  all.sort((a, b) => a.ts - b.ts)
  saveAll(all.slice(-MAX_RECORDS))
  return rec
}

/** 导出为 JSON 字符串（用于下载备份 / 跨设备转移） */
export function exportHistoryJson(): string {
  const payload: HistoryExport = {
    app: 'cse-training-history',
    version: 1,
    exportedAt: new Date().toISOString(),
    records: loadHistory(),
  }
  return JSON.stringify(payload, null, 2)
}

/** 从任意 JSON 值中提取记录数组；无法识别时抛错 */
function extractRecords(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed
  if (typeof parsed === 'object' && parsed !== null) {
    const records = (parsed as { records?: unknown }).records
    if (Array.isArray(records)) return records
  }
  throw new Error('无法识别该文件的格式：未找到成绩记录列表')
}

/**
 * 解析导入内容并合并进本地记录（按 id 去重，不会覆盖已有数据）。
 * 内容不合法时抛出带提示信息的错误。
 */
export function mergeImportJson(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('文件内容不是有效的 JSON')
  }
  const incoming = extractRecords(parsed)
  const existing = loadHistory()
  const ids = new Set(existing.map((r) => r.id))
  let added = 0
  let invalid = 0
  for (const item of incoming) {
    const rec = sanitizeRecord(item)
    if (rec === null) {
      invalid++
      continue
    }
    if (ids.has(rec.id)) continue
    ids.add(rec.id)
    existing.push(rec)
    added++
  }
  existing.sort((a, b) => a.ts - b.ts)
  saveAll(existing.slice(-MAX_RECORDS))
  return { added, skipped: incoming.length - added - invalid, invalid }
}
