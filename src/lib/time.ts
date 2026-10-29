export const pad2 = (n: number) => String(n).padStart(2, '0')

export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function currentMonth(): string {
  return todayStr().slice(0, 7)
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-')
  return `${y}年${Number(m)}月`
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function formatTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`
}

export function durationHours(start: string, end: string, breakMinutes: number): number {
  if (!start || !end) return 0
  let mins = parseTime(end) - parseTime(start)
  if (mins < 0) mins += 1440
  mins -= breakMinutes
  if (mins < 0) mins = 0
  return Math.round((mins / 60) * 100) / 100
}

export function formatClock(startedAt: number, now: number): string {
  const secs = Math.max(0, Math.floor((now - startedAt) / 1000))
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

export const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六']

export function dateLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${Number(m)}月${Number(d)}日`
}

export function nowTimeStr(d = new Date()): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}
