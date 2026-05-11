import { UserGoal, DailyRecord, ReminderSettings } from './types'
import { format, subDays } from 'date-fns'

const KEYS = {
  goal: 'wt_goal',
  records: 'wt_records',
  reminder: 'wt_reminder',
  backup: 'wt_backup',
} as const

// ---- 通用 ----
function isBrowser() {
  return typeof window !== 'undefined'
}

// ---- 目标 ----
export function getGoal(): UserGoal | null {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(KEYS.goal)
  return raw ? JSON.parse(raw) : null
}

export function saveGoal(goal: UserGoal): void {
  localStorage.setItem(KEYS.goal, JSON.stringify(goal))
}

// ---- 打卡记录 ----
export function getAllRecords(): Record<string, DailyRecord> {
  if (!isBrowser()) return {}
  const raw = localStorage.getItem(KEYS.records)
  return raw ? JSON.parse(raw) : {}
}

function saveAllRecords(records: Record<string, DailyRecord>) {
  localStorage.setItem(KEYS.records, JSON.stringify(records))
  autoBackup(records)
}

export function getRecord(date: string): DailyRecord | null {
  const all = getAllRecords()
  return all[date] ?? null
}

export function upsertRecord(date: string, patch: Partial<Omit<DailyRecord, 'date' | 'updatedAt'>>) {
  const all = getAllRecords()
  const existing = all[date] ?? { date, updatedAt: '' }
  all[date] = { ...existing, ...patch, date, updatedAt: new Date().toISOString() }
  saveAllRecords(all)
}

// 获取最近 N 天记录（含无记录的日期）
export function getRecentRecords(days: number): DailyRecord[] {
  const all = getAllRecords()
  const result: DailyRecord[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
    result.push(all[date] ?? { date, updatedAt: '' })
  }
  return result
}

// 补卡：最多允许补3天前
export function canMakeup(date: string): boolean {
  const today = format(new Date(), 'yyyy-MM-dd')
  const diff = (new Date(today).getTime() - new Date(date).getTime()) / 86400000
  return diff > 0 && diff <= 3
}

// ---- 提醒设置 ----
export function getReminderSettings(): ReminderSettings {
  if (!isBrowser()) return {
    checkinEnabled: false, checkinTime: '08:00',
    exerciseEnabled: false, exerciseTime: '18:00',
  }
  const raw = localStorage.getItem(KEYS.reminder)
  return raw ? JSON.parse(raw) : {
    checkinEnabled: false, checkinTime: '08:00',
    exerciseEnabled: false, exerciseTime: '18:00',
  }
}

export function saveReminderSettings(s: ReminderSettings) {
  localStorage.setItem(KEYS.reminder, JSON.stringify(s))
}

// ---- 自动备份（IndexedDB 冗余） ----
function autoBackup(records: Record<string, DailyRecord>) {
  try {
    // 简单备份到另一个 localStorage key，每天覆盖
    const backupKey = `${KEYS.backup}_${format(new Date(), 'yyyy-MM-dd')}`
    localStorage.setItem(backupKey, JSON.stringify(records))
    // 只保留最近7天备份
    for (let i = 8; i <= 30; i++) {
      const oldKey = `${KEYS.backup}_${format(subDays(new Date(), i), 'yyyy-MM-dd')}`
      localStorage.removeItem(oldKey)
    }
  } catch {
    // 忽略备份失败
  }
}

// 导出为 JSON 文件（手动触发）
export function exportData() {
  const data = {
    goal: getGoal(),
    records: getAllRecords(),
    reminder: getReminderSettings(),
    exportedAt: new Date().toISOString(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `weight-tracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
  a.click()
  URL.revokeObjectURL(url)
}
