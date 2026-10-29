import { useEffect, useMemo, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { IconCheck, IconClock, IconPlus } from '../components/Icons'
import { cancelClockIn, clockIn, clockOut } from '../lib/store'
import type { DB } from '../types'
import { WEEKDAY_CN, formatClock, nowTimeStr, todayStr, weekdayOf } from '../lib/time'
import { fmtMoney, recordHours, recordPay } from '../lib/pay'
import { toast } from '../lib/toast'

interface Props {
  db: DB
  onManualAdd: () => void
}

export function Clock({ db, onManualAdd }: Props) {
  const [now, setNow] = useState(() => Date.now())
  const [pickJob, setPickJob] = useState<string>('')
  const [outOpen, setOutOpen] = useState(false)
  const [breakMinutes, setBreakMinutes] = useState(0)
  const [quantity, setQuantity] = useState(0)

  const jobs = db.jobs.filter((j) => !j.archived)
  const active = db.active
  const activeJob = active ? db.jobs.find((j) => j.id === active.jobId) : undefined

  useEffect(() => {
    if (!active) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [active])

  const today = todayStr()
  const todayRecords = useMemo(
    () => db.records.filter((r) => r.date === today).sort((a, b) => a.start.localeCompare(b.start)),
    [db.records, today],
  )
  const todayHours = todayRecords.reduce((s, r) => s + recordHours(r), 0)
  const todayPay = todayRecords.reduce((s, r) => s + recordPay(r), 0)

  const selectedId = pickJob || jobs[0]?.id || ''

  function handleClockIn() {
    if (!selectedId) {
      toast('请先到「设置」添加一份工作')
      return
    }
    clockIn(selectedId)
    setBreakMinutes(0)
    setQuantity(0)
  }

  function handleClockOut() {
    const rec = clockOut(breakMinutes, quantity)
    setOutOpen(false)
    if (!rec) return
    if (rec.payType === 'piece') toast(`已记录 ${rec.quantity} 件，${fmtMoney(recordPay(rec))}`)
    else toast(`已记录 ${recordHours(rec).toFixed(2)} 小时`)
  }

  const liveElapsed = active ? Math.floor((now - active.startedAt) / 1000 / 60) : 0

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <p className="eyebrow">{today.replace(/-/g, '.')} 周{WEEKDAY_CN[weekdayOf(today)]}</p>
          <h1>今天</h1>
        </div>
        <button className="icon-btn" onClick={onManualAdd} aria-label="补录工时">
          <IconPlus />
        </button>
      </header>

      {active && activeJob ? (
        <section className="clock-card is-running" style={{ ['--job' as string]: activeJob.color }}>
          <div className="clock-job">
            <i className="dot" style={{ background: activeJob.color }} />
            {activeJob.name}
            <span className="clock-badge">计时中</span>
          </div>
          <div className="clock-time">{formatClock(active.startedAt, now)}</div>
          <div className="clock-sub">
            上班 {new Date(active.startedAt).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {liveElapsed >= 60 && ` · 已 ${Math.floor(liveElapsed / 60)} 小时`}
          </div>
          <div className="clock-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (confirm('放弃本次打卡？不会生成记录。')) {
                  cancelClockIn()
                  toast('已取消打卡')
                }
              }}
            >
              取消
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => setOutOpen(true)}>
              <IconCheck /> 下班打卡
            </button>
          </div>
        </section>
      ) : (
        <section className="clock-card">
          <div className="clock-idle-label">选择工作后开始计时</div>
          <div className="clock-chips">
            {jobs.map((j) => (
              <button
                key={j.id}
                className={`chip ${j.id === selectedId ? 'is-active' : ''}`}
                style={j.id === selectedId ? { borderColor: j.color, color: j.color } : undefined}
                onClick={() => setPickJob(j.id)}
              >
                <i className="dot" style={{ background: j.color }} />
                {j.name}
                {j.payType === 'piece' && <span className="chip-tag">计件</span>}
              </button>
            ))}
            {jobs.length === 0 && <p className="muted">还没有工作，去「设置」添加</p>}
          </div>
          <button className="btn btn-primary btn-clock" onClick={handleClockIn} disabled={!jobs.length}>
            <IconClock /> 上班打卡
          </button>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2>今日记录</h2>
          <span className="muted">
            {todayHours.toFixed(2)} h · {fmtMoney(todayPay)}
          </span>
        </div>
        {todayRecords.length === 0 ? (
          <p className="empty">今天还没有记录，打个卡或手动补录吧</p>
        ) : (
          <ul className="record-list">
            {todayRecords.map((r) => {
              const job = db.jobs.find((j) => j.id === r.jobId)
              return (
                <li key={r.id} className="record">
                  <i className="bar" style={{ background: job?.color ?? '#c7cbd3' }} />
                  <div className="record-main">
                    <div className="record-title">
                      {job?.name ?? '已删除'}
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
        )}
      </section>

      <Sheet
        open={outOpen}
        title="确认下班"
        onClose={() => setOutOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOutOpen(false)}>
              继续工作
            </button>
            <button className="btn btn-primary" onClick={handleClockOut}>
              确认下班
            </button>
          </>
        }
      >
        <p className="sheet-note">
          本次上班 {active ? nowTimeStr(new Date(active.startedAt)) : '--:--'}，现在 {nowTimeStr()}
        </p>
        {activeJob?.payType === 'piece' && (
          <div className="field-row">
            <label className="field">
              <span className="field-label">完成件数</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="0"
              />
            </label>
            <div className="field">
              <span className="field-label">单价</span>
              <div className="static-value">
                {fmtMoney(activeJob.rate)}
                <em>/件</em>
              </div>
            </div>
          </div>
        )}
        <label className="field">
          <span className="field-label">休息时长（分钟）</span>
          <div className="chips">
            {[0, 30, 60, 90].map((m) => (
              <button
                key={m}
                className={`chip ${breakMinutes === m ? 'is-active' : ''}`}
                onClick={() => setBreakMinutes(m)}
              >
                {m === 0 ? '无' : `${m} 分钟`}
              </button>
            ))}
          </div>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={5}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
          />
        </label>
        {active && (
          <p className="sheet-note">
            计入工时约{' '}
            <strong>
              {Math.max(0, Math.round(((now - active.startedAt) / 3600000 - breakMinutes / 60) * 100) / 100).toFixed(2)}{' '}
              h
            </strong>
            {activeJob?.payType === 'piece' && (
              <>
                ，计件工资 <strong>{fmtMoney(quantity * activeJob.rate)}</strong>
              </>
            )}
          </p>
        )}
      </Sheet>
    </div>
  )
}
