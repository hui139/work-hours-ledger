import { useMemo } from 'react'
import type { DB, WorkRecord } from '../types'
import {
  WEEKDAY_CN,
  currentMonth,
  dateLabel,
  daysInMonth,
  monthLabel,
  shiftMonth,
  weekdayOf,
} from '../lib/time'
import { fmtMoney, recordHours, recordPay, summarize } from '../lib/pay'
import { IconChevronLeft, IconChevronRight, IconPlus } from '../components/Icons'

interface Props {
  db: DB
  month: string
  setMonth: (m: string) => void
  onAdd: () => void
  onEdit: (r: WorkRecord) => void
}

export function Records({ db, month, setMonth, onAdd, onEdit }: Props) {
  const records = useMemo(
    () => db.records.filter((r) => r.date.startsWith(month)),
    [db.records, month],
  )
  const summary = useMemo(() => summarize(records), [records])
  const dim = daysInMonth(month)

  const groups = useMemo(() => {
    const map = new Map<string, WorkRecord[]>()
    for (const r of records) {
      const list = map.get(r.date) ?? []
      list.push(r)
      map.set(r.date, list)
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, list]) => ({
        date,
        list: list.sort((a, b) => a.start.localeCompare(b.start)),
        hours: list.reduce((s, r) => s + recordHours(r), 0),
        pieces: list.reduce((s, r) => s + (r.quantity || 0), 0),
        pay: list.reduce((s, r) => s + recordPay(r), 0),
      }))
  }, [records])

  const isCurrent = month === currentMonth()

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <p className="eyebrow">工时明细</p>
          <h1>记录</h1>
        </div>
        <button className="icon-btn" onClick={onAdd} aria-label="新增记录">
          <IconPlus />
        </button>
      </header>

      <div className="month-bar">
        <button
          className="icon-btn"
          onClick={() => setMonth(shiftMonth(month, -1))}
          aria-label="上一月"
        >
          <IconChevronLeft />
        </button>
        <div className="month-title">
          {monthLabel(month)}
          {!isCurrent && (
            <button className="link" onClick={() => setMonth(currentMonth())}>
              回到本月
            </button>
          )}
        </div>
        <button
          className="icon-btn"
          onClick={() => setMonth(shiftMonth(month, 1))}
          aria-label="下一月"
        >
          <IconChevronRight />
        </button>
      </div>

      <div className="stat-strip">
        <div>
          <span className="stat-label">出勤</span>
          <strong>
            {summary.days}
            <small>/{dim}天</small>
          </strong>
        </div>
        <div>
          <span className="stat-label">{summary.pieces > 0 && summary.hours === 0 ? '件数' : '工时'}</span>
          <strong>
            {summary.pieces > 0 && summary.hours === 0
              ? summary.pieces
              : summary.hours.toFixed(1)}
            <small>{summary.pieces > 0 && summary.hours === 0 ? '件' : 'h'}</small>
          </strong>
        </div>
        <div>
          <span className="stat-label">工资</span>
          <strong className="money">{fmtMoney(summary.pay)}</strong>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="card empty-card">
          <p className="empty">本月还没有记录</p>
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            补录一条
          </button>
        </div>
      ) : (
        <div className="groups">
          {groups.map((g) => (
            <section key={g.date} className="day-group">
              <div className="day-head">
                <span className="day-date">{dateLabel(g.date)}</span>
                <span className="day-week">周{WEEKDAY_CN[weekdayOf(g.date)]}</span>
                <span className="day-sum">
                  {g.hours > 0 ? `${g.hours.toFixed(2)}h` : `${g.pieces} 件`} · {fmtMoney(g.pay)}
                </span>
              </div>
              <ul className="record-list">
                {g.list.map((r) => {
                  const job = db.jobs.find((j) => j.id === r.jobId)
                  return (
                    <li key={r.id} className="record is-tappable" onClick={() => onEdit(r)}>
                      <i className="bar" style={{ background: job?.color ?? '#c7cbd3' }} />
                      <div className="record-main">
                        <div className="record-title">
                          {job?.name ?? '已删除'}
                          {(r.overtimeHours ?? 0) > 0 && (
                            <span className="tag">加班 {r.overtimeHours}h</span>
                          )}
                          {r.note && <span className="record-note">{r.note}</span>}
                        </div>
                        <div className="record-meta">
                          {r.start && r.end
                            ? `${r.start} - ${r.end}${r.breakMinutes > 0 ? ` · 休 ${r.breakMinutes}′` : ''}`
                            : r.payType === 'piece'
                              ? `单价 ${fmtMoney(r.rate)}/件`
                              : '未记录时间'}
                        </div>
                      </div>
                      <div className="record-right">
                        <strong>
                          {r.payType === 'piece'
                            ? `${r.quantity || 0} 件`
                            : `${recordHours(r).toFixed(2)}h`}
                        </strong>
                        <span className="money">{fmtMoney(recordPay(r))}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
