import { useState } from 'react'
import { Sheet } from './components/Sheet'
import { RecordForm } from './components/RecordForm'
import { JobForm } from './components/JobForm'
import { Clock } from './screens/Clock'
import { Records } from './screens/Records'
import { Stats } from './screens/Stats'
import { Settings } from './screens/Settings'
import type { Job, WorkRecord } from './types'
import { addJob, addRecord, deleteJob, deleteRecord, updateJob, updateRecord, useDB } from './lib/store'
import { currentMonth } from './lib/time'
import { toast, useToastMessage } from './lib/toast'
import { IconChart, IconClock, IconList, IconSettings } from './components/Icons'

type Tab = 'clock' | 'records' | 'stats' | 'settings'

function initialTab(): Tab {
  const hash = location.hash.replace('#', '')
  return hash === 'records' || hash === 'stats' || hash === 'settings' ? hash : 'clock'
}

const TABS: { key: Tab; label: string; icon: typeof IconClock }[] = [
  { key: 'clock', label: '打卡', icon: IconClock },
  { key: 'records', label: '记录', icon: IconList },
  { key: 'stats', label: '统计', icon: IconChart },
  { key: 'settings', label: '设置', icon: IconSettings },
]

export default function App() {
  const db = useDB()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [month, setMonth] = useState(currentMonth())
  const toastMsg = useToastMessage()

  const [recordSheet, setRecordSheet] = useState<{ open: boolean; editing: WorkRecord | null }>({
    open: false,
    editing: null,
  })
  const [jobSheet, setJobSheet] = useState<{ open: boolean; editing: Job | null }>({
    open: false,
    editing: null,
  })

  return (
    <div className="app">
      <main className="content">
        {tab === 'clock' && (
          <Clock
            db={db}
            onManualAdd={() => setRecordSheet({ open: true, editing: null })}
          />
        )}
        {tab === 'records' && (
          <Records
            db={db}
            month={month}
            setMonth={setMonth}
            onAdd={() => setRecordSheet({ open: true, editing: null })}
            onEdit={(r) => setRecordSheet({ open: true, editing: r })}
          />
        )}
        {tab === 'stats' && <Stats db={db} month={month} setMonth={setMonth} />}
        {tab === 'settings' && (
          <Settings
            db={db}
            month={month}
            onEditJob={(j) => setJobSheet({ open: true, editing: j })}
          />
        )}
      </main>

      <nav className="tabbar">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`tab ${tab === key ? 'is-active' : ''}`}
            onClick={() => setTab(key)}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <Sheet
        open={recordSheet.open}
        title={recordSheet.editing ? '编辑记录' : '补录工时'}
        onClose={() => setRecordSheet({ open: false, editing: null })}
      >
        <RecordForm
          jobs={db.jobs}
          editing={recordSheet.editing}
          defaultDate={month === currentMonth() ? undefined : `${month}-01`}
          onSave={(r) => {
            if (recordSheet.editing) {
              updateRecord(r.id, r)
              toast('已更新')
            } else {
              addRecord(r)
              toast('已添加')
            }
            setRecordSheet({ open: false, editing: null })
          }}
          onDelete={(id) => {
            if (confirm('删除这条记录？')) {
              deleteRecord(id)
              setRecordSheet({ open: false, editing: null })
              toast('已删除')
            }
          }}
          onCancel={() => setRecordSheet({ open: false, editing: null })}
        />
      </Sheet>

      <Sheet
        open={jobSheet.open}
        title={jobSheet.editing ? '编辑工作' : '添加工作'}
        onClose={() => setJobSheet({ open: false, editing: null })}
      >
        <JobForm
          editing={jobSheet.editing}
          onSave={(data) => {
            if (jobSheet.editing) {
              updateJob(jobSheet.editing.id, data)
              toast('已保存')
            } else {
              addJob(data)
              toast('已添加')
            }
            setJobSheet({ open: false, editing: null })
          }}
          onDelete={(id) => {
            const count = db.records.filter((r) => r.jobId === id).length
            if (confirm(`删除这份工作？它关联的 ${count} 条记录也会被删除。`)) {
              deleteJob(id)
              setJobSheet({ open: false, editing: null })
              toast('已删除')
            }
          }}
          onCancel={() => setJobSheet({ open: false, editing: null })}
        />
      </Sheet>

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  )
}
