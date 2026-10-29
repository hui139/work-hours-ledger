import type { Job, PayType, WorkRecord } from '../types'
import { durationHours } from './time'

export interface PayProfile {
  payType: PayType
  rate: number
  workdaysPerMonth: number
  hoursPerDay: number
  overtimeMultiplier: number
}

export function profileOf(job: Job): PayProfile {
  return {
    payType: job.payType,
    rate: job.rate,
    workdaysPerMonth: job.workdaysPerMonth || 21.75,
    hoursPerDay: job.hoursPerDay || 8,
    overtimeMultiplier: job.overtimeMultiplier || 1.5,
  }
}

/** 折算出的标准时薪（计件返回 0，没有意义） */
export function hourlyRate(p: PayProfile): number {
  if (p.payType === 'piece') return 0
  if (p.payType === 'hourly') return p.rate
  if (p.payType === 'daily') return p.rate / (p.hoursPerDay || 8)
  return p.rate / (p.workdaysPerMonth || 21.75) / (p.hoursPerDay || 8)
}

export function recordHours(r: WorkRecord): number {
  if (!r.start || !r.end) return 0
  return durationHours(r.start, r.end, r.breakMinutes)
}

/** 正常工时工资 + 加班工资；计件为 件数 × 单价 */
export function recordPay(r: WorkRecord): number {
  if (r.payType === 'piece') {
    return round2((r.quantity || 0) * r.rate)
  }
  const h = recordHours(r)
  const normal = hourlyRate(r) * h
  const overtime = hourlyRate(r) * (r.overtimeHours || 0) * (r.overtimeMultiplier || 1.5)
  return round2(normal + overtime)
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function fmtMoney(n: number, symbol = '¥'): string {
  const abs = Math.abs(n)
  const s = abs >= 1000 ? abs.toFixed(0) : abs.toFixed(2)
  return `${n < 0 ? '-' : ''}${symbol}${Number(s).toLocaleString('zh-CN', {
    minimumFractionDigits: abs >= 1000 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export interface MonthSummary {
  hours: number
  pay: number
  days: number
  overtime: number
  pieces: number
  byJob: { jobId: string; hours: number; pay: number; days: number; pieces: number }[]
}

export function summarize(records: WorkRecord[]): MonthSummary {
  const days = new Set<string>()
  const map = new Map<string, { hours: number; pay: number; days: Set<string>; pieces: number }>()
  let hours = 0
  let pay = 0
  let overtime = 0
  let pieces = 0

  for (const r of records) {
    const h = recordHours(r)
    const p = recordPay(r)
    const q = r.quantity || 0
    hours += h
    pay += p
    overtime += r.overtimeHours || 0
    pieces += q
    days.add(r.date)

    const cur = map.get(r.jobId) ?? { hours: 0, pay: 0, days: new Set<string>(), pieces: 0 }
    cur.hours += h
    cur.pay += p
    cur.pieces += q
    cur.days.add(r.date)
    map.set(r.jobId, cur)
  }

  return {
    hours: round2(hours),
    pay: round2(pay),
    days: days.size,
    overtime: round2(overtime),
    pieces: round2(pieces),
    byJob: [...map.entries()].map(([jobId, v]) => ({
      jobId,
      hours: round2(v.hours),
      pay: round2(v.pay),
      days: v.days.size,
      pieces: round2(v.pieces),
    })),
  }
}
