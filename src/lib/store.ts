import { useSyncExternalStore } from 'react'
import type { ActiveSession, DB, Job, WorkRecord } from '../types'
import { JOB_COLORS } from '../types'
import { todayStr } from './time'

const KEY = 'work-hours-ledger.v1'

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function emptyDB(): DB {
  const now = Date.now()
  const job: Job = {
    id: uid(),
    name: '我的工作',
    payType: 'hourly',
    rate: 20,
    workdaysPerMonth: 21.75,
    hoursPerDay: 8,
    overtimeMultiplier: 1.5,
    color: JOB_COLORS[0],
    archived: false,
    createdAt: now,
  }
  return { version: 1, jobs: [job], records: [], active: null }
}

function normalize(raw: unknown): DB {
  const db = raw as Partial<DB> | null
  if (!db || !Array.isArray(db.jobs) || !Array.isArray(db.records)) return emptyDB()
  return {
    version: 1,
    jobs: db.jobs as Job[],
    records: (db.records as WorkRecord[]).map((r) => ({
      ...r,
      quantity: Number(r.quantity) || 0,
    })),
    active: (db.active as ActiveSession | null) ?? null,
  }
}

let cache: DB | null = null
const listeners = new Set<() => void>()

function load(): DB {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    cache = raw ? normalize(JSON.parse(raw)) : emptyDB()
  } catch {
    cache = emptyDB()
  }
  return cache
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* 存储不可用时静默失败 */
  }
}

function emit() {
  listeners.forEach((l) => l())
}

export function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function getDB(): DB {
  return load()
}

export function mutate(fn: (db: DB) => void) {
  const prev = load()
  const db: DB = { ...prev, jobs: [...prev.jobs], records: [...prev.records] }
  fn(db)
  cache = db
  persist()
  emit()
}

export function useDB(): DB {
  return useSyncExternalStore(subscribe, getDB, getDB)
}

export function addJob(partial: Omit<Job, 'id' | 'createdAt' | 'archived'>): Job {
  const job: Job = { ...partial, id: uid(), createdAt: Date.now(), archived: false }
  mutate((db) => {
    db.jobs.push(job)
  })
  return job
}

export function updateJob(id: string, patch: Partial<Job>) {
  mutate((db) => {
    const i = db.jobs.findIndex((j) => j.id === id)
    if (i >= 0) db.jobs[i] = { ...db.jobs[i], ...patch }
  })
}

export function deleteJob(id: string) {
  mutate((db) => {
    db.jobs = db.jobs.filter((j) => j.id !== id)
    db.records = db.records.filter((r) => r.jobId !== id)
    if (db.active?.jobId === id) db.active = null
  })
}

export function addRecord(record: WorkRecord) {
  mutate((db) => {
    db.records.push(record)
  })
}

export function updateRecord(id: string, patch: Partial<WorkRecord>) {
  mutate((db) => {
    const i = db.records.findIndex((r) => r.id === id)
    if (i >= 0) db.records[i] = { ...db.records[i], ...patch }
  })
}

export function deleteRecord(id: string) {
  mutate((db) => {
    db.records = db.records.filter((r) => r.id !== id)
  })
}

export function clockIn(jobId: string, note = '') {
  mutate((db) => {
    db.active = { jobId, startedAt: Date.now(), breakMinutes: 0, note }
  })
}

export function clockOut(breakMinutes = 0, quantity = 0) {
  const db = load()
  const active = db.active
  if (!active) return null
  const job = db.jobs.find((j) => j.id === active.jobId)
  if (!job) {
    mutate((d) => {
      d.active = null
    })
    return null
  }
  const end = new Date()
  const start = new Date(active.startedAt)
  const sameDay = todayStr(start) === todayStr(end)
  const record: WorkRecord = {
    id: uid(),
    jobId: job.id,
    date: todayStr(start),
    start: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
    end: sameDay
      ? `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
      : '23:59',
    breakMinutes,
    overtimeHours: 0,
    quantity: job.payType === 'piece' ? Math.max(0, Number(quantity) || 0) : 0,
    note: active.note,
    payType: job.payType,
    rate: job.rate,
    workdaysPerMonth: job.workdaysPerMonth,
    hoursPerDay: job.hoursPerDay,
    overtimeMultiplier: job.overtimeMultiplier,
    createdAt: Date.now(),
  }
  mutate((d) => {
    d.records.push(record)
    d.active = null
  })
  return record
}

export function cancelClockIn() {
  mutate((db) => {
    db.active = null
  })
}

export function importDB(raw: unknown): boolean {
  const db = normalize(raw)
  if (!db.jobs.length && !db.records.length) return false
  mutate((d) => {
    d.jobs = db.jobs
    d.records = db.records
    d.active = db.active
  })
  return true
}

export function resetAll() {
  cache = emptyDB()
  persist()
  emit()
}
