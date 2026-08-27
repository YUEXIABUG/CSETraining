import { formatMsShort } from '../utils/display'

export interface PieSegment {
  label: string
  value: number
  color: string
}

function annularSector(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number,
): string {
  const point = (r: number, deg: number): [number, number] => {
    const rad = ((deg - 90) * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
  }
  const [x1, y1] = point(rOuter, startDeg)
  const [x2, y2] = point(rOuter, endDeg)
  const [x3, y3] = point(rInner, endDeg)
  const [x4, y4] = point(rInner, startDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`
}

/** 环形饼图：中心显示正确率，右侧图例 */
export function DonutChart({
  segments,
  centerLabel,
  centerSub,
}: {
  segments: PieSegment[]
  centerLabel: string
  centerSub?: string
}) {
  const total = segments.reduce((s, d) => s + d.value, 0)
  const visible = segments.filter((d) => d.value > 0)
  const cx = 60
  const cy = 60
  const rOuter = 54
  const rInner = 35
  let acc = 0
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 120 120" className="donut-svg" role="img" aria-label="答题结果分布">
        {total === 0 || visible.length === 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={(rOuter + rInner) / 2}
            fill="none"
            stroke="var(--progress-bg)"
            strokeWidth={rOuter - rInner}
          />
        ) : visible.length === 1 ? (
          <circle
            cx={cx}
            cy={cy}
            r={(rOuter + rInner) / 2}
            fill="none"
            stroke={visible[0].color}
            strokeWidth={rOuter - rInner}
          />
        ) : (
          visible.map((d) => {
            const start = (acc / total) * 360
            acc += d.value
            const end = (acc / total) * 360
            const gap = end - start > 4 ? 0.8 : 0
            return <path key={d.label} d={annularSector(cx, cy, rOuter, rInner, start, end - gap)} fill={d.color} />
          })
        )}
        <text x={cx} y={centerSub ? cy - 2 : cy + 5} textAnchor="middle" className="donut-center-value">
          {centerLabel}
        </text>
        {centerSub && (
          <text x={cx} y={cy + 15} textAnchor="middle" className="donut-center-sub">
            {centerSub}
          </text>
        )}
      </svg>
      <div className="donut-legend">
        {segments.map((d) => (
          <div key={d.label} className="legend-item">
            <span className="legend-dot" style={{ background: d.color }} />
            <span className="legend-label">{d.label}</span>
            <strong className="legend-value">{d.value} 题</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export interface TrendPoint {
  /** 横轴标签（如日期或序号） */
  label: string
  /** 纵轴数值（0–100） */
  value: number
}

/** 折线图：正确率趋势（纵轴固定 0–100%）；可选 color 用于区分不同模块的折线 */
export function AccuracyTrendChart({ points, color }: { points: TrendPoint[]; color?: string }) {
  const n = points.length
  if (n === 0) return null
  const W = 560
  const H = 200
  const padL = 44
  const padR = 16
  const padT = 14
  const padB = 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const x = (i: number) => (n === 1 ? padL + innerW / 2 : padL + (i * innerW) / (n - 1))
  const y = (pct: number) => padT + innerH - (pct / 100) * innerH
  const pts = points.map((p, i) => ({ x: x(i), y: y(p.value), ...p, i }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L ${pts[n - 1].x.toFixed(1)} ${(padT + innerH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
  const labelStep = n <= 10 ? 1 : Math.ceil(n / 8)
  const xLabels = pts.filter((p) => p.i % labelStep === 0 || p.i === n - 1)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="timeline-svg" role="img" aria-label="正确率趋势折线图">
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} className="tl-grid" />
          <text x={padL - 8} y={y(v) + 4} textAnchor="end" className="tl-tick">
            {v}%
          </text>
        </g>
      ))}
      <path d={area} className="tl-area" style={color ? { fill: color, opacity: 0.12 } : undefined} />
      <path d={line} className="tl-line" style={color ? { stroke: color } : undefined} />
      {pts.map((p) => (
        <circle key={p.i} cx={p.x} cy={p.y} r={2.8} className="tl-dot" style={color ? { fill: color } : undefined}>
          <title>{`${p.label} · ${p.value}%`}</title>
        </circle>
      ))}
      {xLabels.map((p) => (
        <text key={p.i} x={p.x} y={H - 8} textAnchor="middle" className="tl-tick">
          {p.label}
        </text>
      ))}
    </svg>
  )
}

function niceCeil(v: number): number {
  if (v <= 5) return Math.max(1, Math.ceil(v))
  if (v <= 20) return Math.ceil(v / 5) * 5
  return Math.ceil(v / 10) * 10
}

/** 折线图：每题用时趋势（毫秒输入） */
export function TimeLineChart({ times }: { times: number[] }) {
  const n = times.length
  if (n === 0) return null
  const W = 560
  const H = 220
  const padL = 52
  const padR = 16
  const padT = 16
  const padB = 30
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const maxSec = Math.max(...times.map((t) => t / 1000), 1)
  const niceMax = niceCeil(maxSec)
  const x = (i: number) => (n === 1 ? padL + innerW / 2 : padL + (i * innerW) / (n - 1))
  const y = (sec: number) => padT + innerH - (sec / niceMax) * innerH
  const pts = times.map((t, i) => ({ x: x(i), y: y(t / 1000), t, i }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L ${pts[n - 1].x.toFixed(1)} ${(padT + innerH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
  const labelStep = n <= 10 ? 1 : Math.ceil(n / 8)
  const xLabels = pts.filter((p) => p.i % labelStep === 0 || p.i === n - 1)
  const yTicks = [0, niceMax / 2, niceMax]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="timeline-svg" role="img" aria-label="每题用时折线图">
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} className="tl-grid" />
          <text x={padL - 8} y={y(v) + 4} textAnchor="end" className="tl-tick">
            {Math.round(v)}秒
          </text>
        </g>
      ))}
      <path d={area} className="tl-area" />
      <path d={line} className="tl-line" />
      {pts.map((p) => (
        <circle key={p.i} cx={p.x} cy={p.y} r={2.8} className="tl-dot">
          <title>{`第 ${p.i + 1} 题 · ${formatMsShort(p.t)}`}</title>
        </circle>
      ))}
      {xLabels.map((p) => (
        <text key={p.i} x={p.x} y={H - 8} textAnchor="middle" className="tl-tick">
          {p.i + 1}
        </text>
      ))}
    </svg>
  )
}
