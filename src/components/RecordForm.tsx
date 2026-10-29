import { useState } from 'react'
import type { Job, WorkRecord } from '../types'
import { durationHours, todayStr } from '../lib/time'
import { fmtMoney, recordPay } from '../lib/pay'
import { profileOf } from '../lib/pay'
import { uid } from '../lib/store'
import { IconTrash } from './Icons'

interface Props {
  jobs: Job[]
  editing?: WorkRecord | null
  defaultJobId?: string
  defaultDate?: string
  onSave: (record: WorkRecord) => void
  onDelete?: (id: string) => void
  onCancel: () => void
}

export function RecordForm({
  jobs,
  editing,
  defaultJobId,
  defaultDate,
  onSave,
  onDelete,
  onCancel,
}: Props) {
  const activeJobs = jobs.filter((j) => !j.archived)
  const jobPool = editing && !activeJobs.some((j) => j.id === editing.jobId)
    ? [...activeJobs, ...jobs.filter((j) => j.id === editing.jobId)]
    : activeJobs

  const firstJobId = editing?.jobId ?? defaultJobId ?? jobPool[0]?.id ?? ''
  const firstJob = jobPool.find((j) => j.id === firstJobId)

  const [jobId, setJobId] = useState(firstJobId)
  const [date, setDate] = useState(editing?.date ?? defaultDate ?? todayStr())
  const [start, setStart] = useState(editing?.start || '09:00')
  const [end, setEnd] = useState(editing?.end || '18:00')
  const [breakMinutes, setBreakMinutes] = useState(editing?.breakMinutes ?? 60)
  const [overtimeHours, setOvertimeHours] = useState(editing?.overtimeHours ?? 0)
  const [quantity, setQuantity] = useState(editing?.quantity ?? 0)
  const [hasTime, setHasTime] = useState(
    () => (editing ? Boolean(editing.start) : firstJob?.payType !== 'piece'),
  )
  const [note, setNote] = useState(editing?.note ?? '')
  const [error, setError] = useState('')

  const job = jobPool.find((j) => j.id === jobId)
  const isPiece = job?.payType === 'piece'

  function pickJob(id: string) {
    setJobId(id)
    const next = jobPool.find((j) => j.id === id)
    if (next?.payType !== 'piece') setHasTime(true)
  }

  const draft: WorkRecord | null = job
    ? {
        id: editing?.id ?? 'preview',
        jobId: job.id,
        date,
        start: hasTime ? start : '',
        end: hasTime ? end : '',
        breakMinutes: hasTime ? Number(breakMinutes) || 0 : 0,
        overtimeHours: isPiece ? 0 : Number(overtimeHours) || 0,
        quantity: isPiece ? Number(quantity) || 0 : 0,
        note,
        ...profileOf(job),
        createdAt: editing?.createdAt ?? 0,
      }
    : null

  const previewHours = draft && hasTime ? durationHours(start, end, draft.breakMinutes) : 0
  const previewPay = draft ? recordPay(draft) : 0

  function submit() {
    if (!job) {
      setError('请先选择工作')
      return
    }
    if (!date) {
      setError('请选择日期')
      return
    }
    if (isPiece) {
      if (!(Number(quantity) > 0)) {
        setError('请填写完成件数')
        return
      }
    } else if (!hasTime) {
      setError('计时工作需要填写上下班时间')
      return
    }
    if (hasTime) {
      if (start === end) {
        setError('开始和结束时间不能相同')
        return
      }
      if (durationHours(start, end, Number(breakMinutes) || 0) <= 0) {
        setError('休息时长超过了工作时长')
        return
      }
    }
    if (!draft) return
    onSave({
      ...draft,
      id: editing?.id ?? uid(),
      createdAt: editing?.createdAt ?? Date.now(),
      note: note.trim(),
    })
  }

  return (
    <div className="form">
      <label className="field">
        <span className="field-label">工作</span>
        <div className="chips">
          {jobPool.map((j) => (
            <button
              key={j.id}
              type="button"
              className={`chip ${j.id === jobId ? 'is-active' : ''}`}
              style={j.id === jobId ? { borderColor: j.color, color: j.color } : undefined}
              onClick={() => pickJob(j.id)}
            >
              <i className="dot" style={{ background: j.color }} />
              {j.name}
              {j.payType === 'piece' && <span className="chip-tag">计件</span>}
            </button>
          ))}
        </div>
      </label>

      <label className="field">
        <span className="field-label">日期</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      {isPiece && (
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
            />
          </label>
          <div className="field">
            <span className="field-label">单价</span>
            <div className="static-value">
              {fmtMoney(job.rate)}
              <em>/件</em>
            </div>
          </div>
        </div>
      )}

      {isPiece && (
        <label className="switch-row">
          <span>同时记录上下班时间</span>
          <input
            type="checkbox"
            className="switch"
            checked={hasTime}
            onChange={(e) => setHasTime(e.target.checked)}
          />
        </label>
      )}

      {hasTime && (
        <div className="field-row">
          <label className="field">
            <span className="field-label">开始</span>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">结束</span>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>
      )}

      {(hasTime || !isPiece) && (
        <div className="field-row">
          {hasTime && (
            <label className="field">
              <span className="field-label">休息（分钟）</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={5}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
              />
            </label>
          )}
          {!isPiece && (
            <label className="field">
              <span className="field-label">加班（小时）</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.5}
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(Number(e.target.value))}
              />
            </label>
          )}
        </div>
      )}

      <label className="field">
        <span className="field-label">备注（可选）</span>
        <input
          type="text"
          placeholder={isPiece ? '例如：打包快递' : '例如：晚班 / 仓库整理'}
          value={note}
          maxLength={60}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      {draft && (
        <div className="preview">
          {isPiece ? (
            <>
              <div>
                <span className="preview-label">件数</span>
                <strong>{Number(quantity) || 0} 件</strong>
              </div>
              {hasTime && (
                <div>
                  <span className="preview-label">工时</span>
                  <strong>{previewHours.toFixed(2)} h</strong>
                </div>
              )}
              <div>
                <span className="preview-label">计件工资</span>
                <strong className="money">{fmtMoney(previewPay)}</strong>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="preview-label">工时</span>
                <strong>{previewHours.toFixed(2)} h</strong>
              </div>
              <div>
                <span className="preview-label">预计工资</span>
                <strong className="money">{fmtMoney(previewPay)}</strong>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        {editing && onDelete && (
          <button className="btn btn-ghost btn-danger" onClick={() => onDelete(editing.id)}>
            <IconTrash /> 删除
          </button>
        )}
        <button className="btn btn-ghost" onClick={onCancel}>
          取消
        </button>
        <button className="btn btn-primary" onClick={submit}>
          保存
        </button>
      </div>
    </div>
  )
}
