import { useMemo, useState } from 'react'
import type { DB } from '../types'
import { PAY_TYPE_LABEL } from '../types'
import { daysInMonth, monthLabel, shiftMonth, todayStr } from '../lib/time'
import { fmtMoney, recordHours, recordPay, round2, summarize } from '../lib/pay'
import { IconChevronLeft, IconChevronRight } from '../components/Icons'

interface Props {
  db: DB
  month: string
  setMonth: (m: string) => void
}

type ChartMode = 'hours' | 'pay' | 'pieces'

interface PaySlice {
  id: string
  name: string
  color: string
  pay: number
}

function IncomePie({ items }: { items: PaySlice[] }) {
  const size = 132
  const stroke = 18
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const total = items.reduce((s, i) => s + i.pay, 0)
  const gap = items.length > 1 ? Math.min(3, circumference * 0.009) : 0

  const slices = items.map((item, index) => {
    const length = (item.pay / total) * circumference
    const offset =
      items.slice(0, index).reduce((s, x) => s + (x.pay / total) * circumference, 0)
    const dash = Math.max(0, length - gap)
    return (
      <circle
        key={item.id}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={item.color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    )
  })

  return (
    <div className="pie-wrap">
      <div className="pie">
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#eef0f4"
            strokeWidth={stroke}
          />
          {slices}
        </svg>
        <div className="pie-center">
          <span>合计</span>
          <strong className="money">{fmtMoney(total)}</strong>
        </div>
      </div>
      <ul className="pie-legend">
        {items.map((i) => (
          <li key={i.id}>
            <i className="dot" style={{ background: i.color }} />
            <span className="pie-name">{i.name}</span>
            <em>{((i.pay / total) * 100).toFixed(0)}%</em>
            <strong>{fmtMoney(i.pay)}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Stats({ db, month, setMonth }: Props) {
  const [mode, setMode] = useState<ChartMode>('hours')

  const records = useMemo(
    () => db.records.filter((r) => r.date.startsWith(month)),
    [db.records, month],
  )
  const summary = useMemo(() => summarize(records), [records])
  const dim = daysInMonth(month)

  const daily = useMemo(() => {
    const arr = Array.from({ length: dim }, (_, i) => ({
      day: i + 1,
      hours: 0,
      pay: 0,
      pieces: 0,
    }))
    for (const r of records) {
      const d = Number(r.date.slice(8, 10)) - 1
      if (d >= 0 && d < dim) {
        arr[d].hours += recordHours(r)
        arr[d].pay += recordPay(r)
        arr[d].pieces += r.quantity || 0
      }
    }
    return arr.map((x) => ({
      ...x,
      hours: round2(x.hours),
      pay: round2(x.pay),
      pieces: round2(x.pieces),
    }))
  }, [records, dim])

  const hasPieces = summary.pieces > 0
  const activeMode: ChartMode = mode === 'pieces' && !hasPieces ? 'hours' : mode
  const valueOf = (d: { hours: number; pay: number; pieces: number }) =>
    activeMode === 'hours' ? d.hours : activeMode === 'pay' ? d.pay : d.pieces
  const max = Math.max(1, ...daily.map((d) => valueOf(d)))
  const today = todayStr()
  const jobMap = new Map(db.jobs.map((j) => [j.id, j]))
  const paySlices: PaySlice[] = [...summary.byJob]
    .filter((s) => s.pay > 0)
    .sort((a, b) => b.pay - a.pay)
    .map((s) => {
      const job = jobMap.get(s.jobId)
      return {
        id: s.jobId,
        name: job?.name ?? '已删除',
        color: job?.color ?? '#c7cbd3',
        pay: s.pay,
      }
    })

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <p className="eyebrow">月度汇总</p>
          <h1>统计</h1>
        </div>
      </header>

      <div className="month-bar">
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="上一月">
          <IconChevronLeft />
        </button>
        <div className="month-title">{monthLabel(month)}</div>
        <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="下一月">
          <IconChevronRight />
        </button>
      </div>

      <section className="summary-card">
        <span className="summary-label">本月工资</span>
        <div className="summary-pay money">{fmtMoney(summary.pay)}</div>
        <div className="summary-grid">
          <div>
            <span>总工时</span>
            <strong>{summary.hours.toFixed(2)} h</strong>
          </div>
          <div>
            <span>出勤天数</span>
            <strong>{summary.days} 天</strong>
          </div>
          <div>
            <span>平均日薪</span>
            <strong>{fmtMoney(summary.days ? summary.pay / summary.days : 0)}</strong>
          </div>
          <div>
            <span>加班合计</span>
            <strong>{summary.overtime.toFixed(1)} h</strong>
          </div>
          {hasPieces && (
            <div>
              <span>计件合计</span>
              <strong>{summary.pieces} 件</strong>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>收入构成</h2>
          <span className="muted">按工作</span>
        </div>
        {paySlices.length === 0 ? (
          <p className="empty">本月暂无收入</p>
        ) : (
          <IncomePie items={paySlices} />
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>
            每日{activeMode === 'hours' ? '工时' : activeMode === 'pay' ? '收入' : '件数'}
          </h2>
          <div className="seg">
            <button
              className={activeMode === 'hours' ? 'is-active' : ''}
              onClick={() => setMode('hours')}
            >
              工时
            </button>
            <button className={activeMode === 'pay' ? 'is-active' : ''} onClick={() => setMode('pay')}>
              收入
            </button>
            {hasPieces && (
              <button
                className={activeMode === 'pieces' ? 'is-active' : ''}
                onClick={() => setMode('pieces')}
              >
                件数
              </button>
            )}
          </div>
        </div>
        {summary.days === 0 ? (
          <p className="empty">本月暂无数据</p>
        ) : (
          <>
            <div className="chart">
              {daily.map((d) => {
                const v = valueOf(d)
                const h = v > 0 ? Math.max(4, (v / max) * 100) : 0
                const isToday = `${month}-${String(d.day).padStart(2, '0')}` === today
                return (
                  <div
                    className="chart-col"
                    key={d.day}
                    title={`${d.day}日 · ${d.hours.toFixed(2)}h · ${d.pieces}件 · ${fmtMoney(d.pay)}`}
                  >
                    <div className="chart-bar-wrap">
                      <div
                        className={`chart-bar ${isToday ? 'is-today' : ''}`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                    {d.day % 5 === 1 || d.day === dim ? (
                      <span className="chart-tick">{d.day}</span>
                    ) : (
                      <span className="chart-tick" />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="chart-legend">
              <span>
                最高{' '}
                {activeMode === 'hours'
                  ? `${max.toFixed(1)} h`
                  : activeMode === 'pay'
                    ? fmtMoney(max)
                    : `${max} 件`}
              </span>
              <span>
                日均{' '}
                {activeMode === 'hours'
                  ? `${(summary.hours / Math.max(1, summary.days)).toFixed(1)} h`
                  : activeMode === 'pay'
                    ? fmtMoney(summary.pay / Math.max(1, summary.days))
                    : `${(summary.pieces / Math.max(1, summary.days)).toFixed(1)} 件`}
              </span>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>按工作拆分</h2>
        </div>
        {summary.byJob.length === 0 ? (
          <p className="empty">暂无数据</p>
        ) : (
          <ul className="job-stats">
            {summary.byJob
              .sort((a, b) => b.pay - a.pay)
              .map((s) => {
                const job = jobMap.get(s.jobId)
                const pct = summary.pay ? (s.pay / summary.pay) * 100 : 0
                return (
                  <li key={s.jobId}>
                    <div className="job-stat-head">
                      <span className="job-stat-name">
                        <i className="dot" style={{ background: job?.color ?? '#c7cbd3' }} />
                        {job?.name ?? '已删除'}
                        {job && <em>{PAY_TYPE_LABEL[job.payType]}</em>}
                      </span>
                      <span className="money">{fmtMoney(s.pay)}</span>
                    </div>
                    <div className="progress">
                      <i
                        style={{ width: `${pct}%`, background: job?.color ?? '#c7cbd3' }}
                      />
                    </div>
                    <div className="job-stat-sub">
                      {s.days} 天 ·{' '}
                      {job?.payType === 'piece'
                        ? `${s.pieces} 件`
                        : `${s.hours.toFixed(2)} h`}{' '}
                      · 占比 {pct.toFixed(0)}%
                    </div>
                  </li>
                )
              })}
          </ul>
        )}
      </section>

      <p className="foot-note">
        统计口径：时薪按实发小时数计算；日薪/月薪按每天{' '}
        {db.jobs[0]?.hoursPerDay ?? 8} 小时折算；计件按件数 × 单价计算；加班单独按倍率计算。
      </p>
    </div>
  )
}
