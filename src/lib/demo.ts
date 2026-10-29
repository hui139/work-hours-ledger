import type { DB, Job, WorkRecord } from '../types'
import { JOB_COLORS } from '../types'
import { pad2, todayStr } from './time'
import { uid } from './store'

export function buildDemoDB(): DB {
  const now = Date.now()
  const jobs: Job[] = [
    {
      id: 'demo-a',
      name: '便利店兼职',
      payType: 'hourly',
      rate: 22,
      workdaysPerMonth: 21.75,
      hoursPerDay: 8,
      overtimeMultiplier: 1.5,
      color: JOB_COLORS[0],
      archived: false,
      createdAt: now - 40000,
    },
    {
      id: 'demo-b',
      name: '家教',
      payType: 'hourly',
      rate: 80,
      workdaysPerMonth: 21.75,
      hoursPerDay: 2,
      overtimeMultiplier: 1,
      color: JOB_COLORS[1],
      archived: false,
      createdAt: now - 30000,
    },
    {
      id: 'demo-c',
      name: '实习（月薪）',
      payType: 'monthly',
      rate: 4000,
      workdaysPerMonth: 21.75,
      hoursPerDay: 8,
      overtimeMultiplier: 1.5,
      color: JOB_COLORS[2],
      archived: false,
      createdAt: now - 20000,
    },
    {
      id: 'demo-d',
      name: '快递打包（计件）',
      payType: 'piece',
      rate: 0.8,
      workdaysPerMonth: 21.75,
      hoursPerDay: 8,
      overtimeMultiplier: 1,
      color: JOB_COLORS[3],
      archived: false,
      createdAt: now - 10000,
    },
  ]

  const records: WorkRecord[] = []
  const today = todayStr()
  const [y, m] = today.split('-').map(Number)
  const dim = new Date(y, m, 0).getDate()
  const todayDay = Number(today.slice(8, 10))

  const patterns = [
    { job: jobs[0], start: '09:00', end: '17:30', brk: 60, ot: 0 },
    { job: jobs[1], start: '19:00', end: '21:00', brk: 0, ot: 0 },
    { job: jobs[2], start: '10:00', end: '19:00', brk: 60, ot: 1 },
  ]

  for (let d = 1; d <= Math.min(dim, todayDay); d++) {
    const dow = new Date(y, m - 1, d).getDay()
    if (dow === 0 && d % 2 === 0) continue
    if (d % 7 === 3) continue
    const date = `${y}-${pad2(m)}-${pad2(d)}`

    if (d % 5 === 0) {
      const pieceJob = jobs[3]
      const withTime = d % 10 === 0
      const qty = 120 + ((d * 37) % 280)
      records.push({
        id: uid() + 'p' + d,
        jobId: pieceJob.id,
        date,
        start: withTime ? '14:00' : '',
        end: withTime ? '18:00' : '',
        breakMinutes: 0,
        overtimeHours: 0,
        quantity: qty,
        note: '打包快递',
        payType: pieceJob.payType,
        rate: pieceJob.rate,
        workdaysPerMonth: pieceJob.workdaysPerMonth,
        hoursPerDay: pieceJob.hoursPerDay,
        overtimeMultiplier: pieceJob.overtimeMultiplier,
        createdAt: now - (todayDay - d) * 86400000,
      })
      continue
    }

    const p = patterns[d % 3]
    records.push({
      id: uid() + d,
      jobId: p.job.id,
      date,
      start: p.start,
      end: p.end,
      breakMinutes: p.brk,
      overtimeHours: p.ot,
      quantity: 0,
      note: d % 6 === 0 ? '晚班' : '',
      payType: p.job.payType,
      rate: p.job.rate,
      workdaysPerMonth: p.job.workdaysPerMonth,
      hoursPerDay: p.job.hoursPerDay,
      overtimeMultiplier: p.job.overtimeMultiplier,
      createdAt: now - (todayDay - d) * 86400000,
    })
  }

  return { version: 1, jobs, records, active: null }
}
