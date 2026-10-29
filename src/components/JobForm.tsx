import { useState } from 'react'
import type { Job, PayType } from '../types'
import { JOB_COLORS, PAY_RATE_UNIT, PAY_TYPE_LABEL } from '../types'
import { fmtMoney, hourlyRate } from '../lib/pay'
import { IconTrash } from './Icons'

interface Props {
  editing?: Job | null
  onSave: (job: Omit<Job, 'id' | 'createdAt' | 'archived'>) => void
  onDelete?: (id: string) => void
  onCancel: () => void
}

const TYPES: PayType[] = ['hourly', 'daily', 'monthly', 'piece']

export function JobForm({ editing, onSave, onDelete, onCancel }: Props) {
  const [name, setName] = useState(editing?.name ?? '')
  const [payType, setPayType] = useState<PayType>(editing?.payType ?? 'hourly')
  const [rate, setRate] = useState<number>(editing?.rate ?? 20)
  const [workdaysPerMonth, setWorkdaysPerMonth] = useState(editing?.workdaysPerMonth ?? 21.75)
  const [hoursPerDay, setHoursPerDay] = useState(editing?.hoursPerDay ?? 8)
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(editing?.overtimeMultiplier ?? 1.5)
  const [color, setColor] = useState(editing?.color ?? JOB_COLORS[0])
  const [error, setError] = useState('')

  const profile = { payType, rate, workdaysPerMonth, hoursPerDay, overtimeMultiplier }
  const isPiece = payType === 'piece'

  function submit() {
    if (!name.trim()) {
      setError('请填写工作名称')
      return
    }
    if (!(rate > 0)) {
      setError('请填写有效的薪资')
      return
    }
    onSave({
      name: name.trim(),
      payType,
      rate: Number(rate),
      workdaysPerMonth: Number(workdaysPerMonth) || 21.75,
      hoursPerDay: Number(hoursPerDay) || 8,
      overtimeMultiplier: Number(overtimeMultiplier) || 1.5,
      color,
    })
  }

  return (
    <div className="form">
      <label className="field">
        <span className="field-label">工作名称</span>
        <input
          type="text"
          placeholder={isPiece ? '例如：快递打包' : '例如：便利店兼职'}
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <div className="field">
        <span className="field-label">计薪方式</span>
        <div className="seg seg-block">
          {TYPES.map((t) => (
            <button key={t} className={payType === t ? 'is-active' : ''} onClick={() => setPayType(t)}>
              {PAY_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span className="field-label">
          {isPiece ? '计件单价' : '薪资标准'}（{PAY_RATE_UNIT[payType]}）
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={payType === 'hourly' || payType === 'piece' ? 0.5 : 100}
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
        />
      </label>

      {payType === 'monthly' && (
        <label className="field">
          <span className="field-label">每月计薪天数</span>
          <input
            type="number"
            inputMode="decimal"
            min={1}
            max={31}
            step={0.25}
            value={workdaysPerMonth}
            onChange={(e) => setWorkdaysPerMonth(Number(e.target.value))}
          />
        </label>
      )}

      {!isPiece && (
        <div className="field-row">
          <label className="field">
            <span className="field-label">每日标准工时</span>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              max={24}
              step={0.5}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span className="field-label">加班倍率</span>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              max={5}
              step={0.5}
              value={overtimeMultiplier}
              onChange={(e) => setOvertimeMultiplier(Number(e.target.value))}
            />
          </label>
        </div>
      )}

      <div className="field">
        <span className="field-label">颜色标记</span>
        <div className="swatches">
          {JOB_COLORS.map((c) => (
            <button
              key={c}
              className={`swatch ${c === color ? 'is-active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <div className="preview">
        {isPiece ? (
          <>
            <div>
              <span className="preview-label">做 100 件可得</span>
              <strong className="money">{fmtMoney(rate * 100)}</strong>
            </div>
            <div>
              <span className="preview-label">做 500 件可得</span>
              <strong className="money">{fmtMoney(rate * 500)}</strong>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="preview-label">折算时薪</span>
              <strong>{fmtMoney(hourlyRate(profile))} / h</strong>
            </div>
            <div>
              <span className="preview-label">加班时薪</span>
              <strong>{fmtMoney(hourlyRate(profile) * overtimeMultiplier)} / h</strong>
            </div>
          </>
        )}
      </div>

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
