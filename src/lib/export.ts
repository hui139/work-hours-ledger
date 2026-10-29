import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { DB, Job, WorkRecord } from '../types'
import { PAY_TYPE_LABEL } from '../types'
import { recordHours } from './pay'
import { recordPay } from './pay'

const csvCell = (v: string | number) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function recordsToCSV(records: WorkRecord[], jobs: Job[]): string {
  const jobName = new Map(jobs.map((j) => [j.id, j.name]))
  const header = [
    '日期',
    '工作',
    '开始',
    '结束',
    '休息(分钟)',
    '工时(小时)',
    '加班(小时)',
    '件数',
    '计薪方式',
    '薪资标准',
    '当日工资',
    '备注',
  ]
  const rows = [...records]
    .sort((a, b) => (a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date)))
    .map((r) => [
      r.date,
      jobName.get(r.jobId) ?? '已删除',
      r.start,
      r.end,
      r.breakMinutes,
      recordHours(r).toFixed(2),
      (r.overtimeHours || 0).toFixed(2),
      r.quantity || 0,
      PAY_TYPE_LABEL[r.payType],
      r.rate,
      recordPay(r).toFixed(2),
      r.note || '',
    ])
  const totalHours = records.reduce((s, r) => s + recordHours(r), 0)
  const totalPieces = records.reduce((s, r) => s + (r.quantity || 0), 0)
  const totalPay = records.reduce((s, r) => s + recordPay(r), 0)
  rows.push([
    '合计',
    '',
    '',
    '',
    '',
    totalHours.toFixed(2),
    '',
    totalPieces,
    '',
    '',
    totalPay.toFixed(2),
    '',
  ])
  return '\ufeff' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export function backupJSON(db: DB): string {
  return JSON.stringify({ ...db, exportedAt: new Date().toISOString() }, null, 2)
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function saveFile(filename: string, content: string, mime: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    download(filename, content, mime)
    return
  }
  await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })
  const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache })
  await Share.share({
    title: filename,
    url: uri,
    dialogTitle: '导出文件',
  })
}

export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'utf-8')
  })
}
