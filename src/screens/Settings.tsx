import { useRef, useState } from 'react'
import type { DB, Job } from '../types'
import { PAY_RATE_SUFFIX, PAY_TYPE_LABEL } from '../types'
import { fmtMoney, hourlyRate, profileOf } from '../lib/pay'
import { monthLabel } from '../lib/time'
import { backupJSON, readFileText, recordsToCSV, saveFile } from '../lib/export'
import { importDB, resetAll } from '../lib/store'
import { toast } from '../lib/toast'
import {
  IconChevronRight,
  IconDownload,
  IconPencil,
  IconPlus,
  IconUpload,
} from '../components/Icons'

interface Props {
  db: DB
  month: string
  onEditJob: (job: Job | null) => void
}

export function Settings({ db, month, onEditJob }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const jobs = [...db.jobs].sort((a, b) => a.createdAt - b.createdAt)

  async function exportCSV(scope: 'month' | 'all') {
    const list =
      scope === 'month' ? db.records.filter((r) => r.date.startsWith(month)) : db.records
    if (!list.length) {
      toast('没有可导出的记录')
      return
    }
    setBusy('csv')
    try {
      const name = scope === 'month' ? `工时账本_${month}.csv` : `工时账本_全部.csv`
      await saveFile(name, recordsToCSV(list, db.jobs), 'text/csv')
      toast('已导出 CSV')
    } catch (e) {
      toast('导出失败：' + (e instanceof Error ? e.message : '未知错误'))
    } finally {
      setBusy(null)
    }
  }

  async function exportBackup() {
    setBusy('json')
    try {
      const stamp = new Date().toISOString().slice(0, 10)
      await saveFile(`工时账本_备份_${stamp}.json`, backupJSON(db), 'application/json')
      toast('已导出备份')
    } catch (e) {
      toast('备份失败：' + (e instanceof Error ? e.message : '未知错误'))
    } finally {
      setBusy(null)
    }
  }

  async function onPickFile(file: File | undefined) {
    if (!file) return
    try {
      const text = await readFileText(file)
      const data = JSON.parse(text)
      if (!confirm('导入会覆盖当前所有数据，确定继续？')) return
      if (importDB(data)) toast('导入成功')
      else toast('文件内容无效')
    } catch {
      toast('无法解析该文件')
    }
  }

  return (
    <div className="screen">
      <header className="screen-head">
        <div>
          <p className="eyebrow">偏好与数据</p>
          <h1>设置</h1>
        </div>
      </header>

      <section className="card">
        <div className="card-head">
          <h2>工作</h2>
          <button className="link link-with-icon" onClick={() => onEditJob(null)}>
            <IconPlus size={14} /> 添加
          </button>
        </div>
        <ul className="job-list">
          {jobs.map((j) => (
            <li key={j.id} className="job-item" onClick={() => onEditJob(j)}>
              <i className="bar" style={{ background: j.color }} />
              <div className="job-main">
                <div className="job-name">{j.name}</div>
                <div className="job-meta">
                  {PAY_TYPE_LABEL[j.payType]} {fmtMoney(j.rate)}
                  {PAY_RATE_SUFFIX[j.payType]}
                  {j.payType === 'daily' &&
                    ` · 折合 ${fmtMoney(hourlyRate(profileOf(j)))}/时`}
                  {j.payType === 'monthly' &&
                    ` · 折合 ${fmtMoney(hourlyRate(profileOf(j)))}/时`}
                </div>
              </div>
              <IconPencil className="job-edit" />
            </li>
          ))}
          {jobs.length === 0 && <p className="empty">还没有工作，点右上角添加</p>}
        </ul>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>数据导出</h2>
        </div>
        <div className="action-list">
          <button className="action-row" onClick={() => exportCSV('month')} disabled={busy === 'csv'}>
            <IconDownload />
            <span>
              导出本月 CSV
              <em>{monthLabel(month)}</em>
            </span>
            <IconChevronRight size={16} />
          </button>
          <button className="action-row" onClick={() => exportCSV('all')} disabled={busy === 'csv'}>
            <IconDownload />
            <span>
              导出全部 CSV
              <em>共 {db.records.length} 条记录</em>
            </span>
            <IconChevronRight size={16} />
          </button>
          <button className="action-row" onClick={exportBackup} disabled={busy === 'json'}>
            <IconDownload />
            <span>
              导出完整备份
              <em>JSON 格式，可用于换机迁移</em>
            </span>
            <IconChevronRight size={16} />
          </button>
          <button className="action-row" onClick={() => fileRef.current?.click()}>
            <IconUpload />
            <span>
              从备份恢复
              <em>会覆盖当前全部数据</em>
            </span>
            <IconChevronRight size={16} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              onPickFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>关于</h2>
        </div>
        <div className="about">
          <p>工时账本 v{__APP_VERSION__}</p>
          <p className="muted">所有数据仅保存在本机，不联网、不上传。</p>
          <button
            className="btn btn-ghost btn-danger btn-sm"
            onClick={() => {
              if (confirm('确定清空所有工时记录和工作设置？此操作不可撤销。')) {
                if (confirm('再次确认：数据将被删除，建议先导出备份。')) {
                  resetAll()
                  toast('已清空')
                }
              }
            }}
          >
            清空全部数据
          </button>
        </div>
      </section>
    </div>
  )
}
