export type PayType = 'hourly' | 'daily' | 'monthly' | 'piece'

export interface Job {
  id: string
  name: string
  payType: PayType
  rate: number
  workdaysPerMonth: number
  hoursPerDay: number
  overtimeMultiplier: number
  color: string
  archived: boolean
  createdAt: number
}

export interface WorkRecord {
  id: string
  jobId: string
  date: string
  /** 计件记录可以不记时间，此时为空字符串 */
  start: string
  end: string
  breakMinutes: number
  overtimeHours: number
  /** 计件件数，计时类记录为 0 */
  quantity: number
  note: string
  payType: PayType
  rate: number
  workdaysPerMonth: number
  hoursPerDay: number
  overtimeMultiplier: number
  createdAt: number
}

export interface ActiveSession {
  jobId: string
  startedAt: number
  breakMinutes: number
  note: string
}

export interface DB {
  version: 1
  jobs: Job[]
  records: WorkRecord[]
  active: ActiveSession | null
}

export const PAY_TYPE_LABEL: Record<PayType, string> = {
  hourly: '时薪',
  daily: '日薪',
  monthly: '月薪',
  piece: '计件',
}

export const PAY_RATE_UNIT: Record<PayType, string> = {
  hourly: '元/小时',
  daily: '元/天',
  monthly: '元/月',
  piece: '元/件',
}

export const PAY_RATE_SUFFIX: Record<PayType, string> = {
  hourly: '/时',
  daily: '/天',
  monthly: '/月',
  piece: '/件',
}

export const JOB_COLORS = [
  '#2b6cff',
  '#00b578',
  '#f59e0b',
  '#ef4b6b',
  '#8b5cf6',
  '#0ea5e9',
  '#14b8a6',
  '#f97316',
]
