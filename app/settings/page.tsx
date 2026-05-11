'use client'

import { useState, useEffect } from 'react'
import { getReminderSettings, saveReminderSettings, getGoal, saveGoal, exportData } from '@/lib/storage'
import { ReminderSettings, UserGoal } from '@/lib/types'
import { useRouter } from 'next/navigation'

function Toggle({ enabled, onChange, label, desc }: {
  enabled: boolean; onChange: (v: boolean) => void; label: string; desc: string
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-colors
          ${enabled ? 'bg-green-500' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [reminder, setReminder] = useState<ReminderSettings>({
    checkinEnabled: false, checkinTime: '08:00',
    exerciseEnabled: false, exerciseTime: '18:00',
    waterEnabled: false, waterTimes: ['08:00', '11:00', '14:00', '17:00'],
  })
  const [goal, setGoal] = useState<UserGoal | null>(null)
  const [editGoal, setEditGoal] = useState(false)
  const [goalForm, setGoalForm] = useState({ targetWeight: '', targetDate: '' })
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setReminder(getReminderSettings())
    const g = getGoal()
    setGoal(g)
    if (g) setGoalForm({ targetWeight: String(g.targetWeight), targetDate: g.targetDate })
    if (typeof Notification !== 'undefined') setNotifPerm(Notification.permission)
  }, [])

  async function requestNotifPermission() {
    if (typeof Notification === 'undefined') return
    const perm = await Notification.requestPermission()
    setNotifPerm(perm)
    if (perm === 'granted') {
      // 注册 Service Worker
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js')
      }
    }
  }

  function handleSaveReminder() {
    saveReminderSettings(reminder)
    // 通知 SW 更新提醒时间
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'UPDATE_REMINDERS', payload: reminder })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleSaveGoal() {
    if (!goal) return
    const tw = parseFloat(goalForm.targetWeight)
    if (isNaN(tw) || tw <= 0) return
    saveGoal({ ...goal, targetWeight: tw, targetDate: goalForm.targetDate })
    setGoal({ ...goal, targetWeight: tw, targetDate: goalForm.targetDate })
    setEditGoal(false)
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-xl font-bold text-gray-800">设置</h1>

      {/* 目标设置 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-600">🎯 减肥目标</h2>
          <button
            onClick={() => setEditGoal(e => !e)}
            className="text-xs text-green-600 hover:underline"
          >
            {editGoal ? '取消' : '修改'}
          </button>
        </div>
        {goal && !editGoal && (
          <div className="space-y-1 text-sm text-gray-600">
            <p>起始体重：<span className="font-medium text-gray-800">{goal.currentWeight} kg</span></p>
            <p>目标体重：<span className="font-medium text-gray-800">{goal.targetWeight} kg</span></p>
            <p>目标日期：<span className="font-medium text-gray-800">{goal.targetDate}</span></p>
            <p>开始日期：<span className="font-medium text-gray-800">{goal.startDate}</span></p>
          </div>
        )}
        {editGoal && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">目标体重 (kg)</label>
              <input
                type="number" step="0.1"
                value={goalForm.targetWeight}
                onChange={e => setGoalForm(f => ({ ...f, targetWeight: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">目标日期</label>
              <input
                type="date"
                value={goalForm.targetDate}
                onChange={e => setGoalForm(f => ({ ...f, targetDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <button
              onClick={handleSaveGoal}
              className="w-full bg-green-500 text-white text-sm py-2 rounded-xl hover:bg-green-600 transition-colors"
            >
              保存目标
            </button>
          </div>
        )}
      </div>

      {/* 提醒设置 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-600 mb-1">🔔 提醒设置</h2>

        {/* 通知权限 */}
        {notifPerm !== 'granted' && (
          <button
            onClick={requestNotifPermission}
            className="w-full text-sm bg-blue-50 text-blue-600 py-2.5 rounded-xl mb-3 hover:bg-blue-100 transition-colors font-medium"
          >
            {notifPerm === 'denied' ? '⚠️ 请在浏览器设置中开启通知权限' : '📱 开启通知权限'}
          </button>
        )}
        {notifPerm === 'granted' && (
          <p className="text-xs text-green-600 mb-3">✅ 通知权限已开启</p>
        )}

        <div className="divide-y divide-gray-100">
          <div>
            <Toggle
              enabled={reminder.checkinEnabled}
              onChange={v => setReminder(r => ({ ...r, checkinEnabled: v }))}
              label="打卡提醒"
              desc="每天提醒你完成打卡"
            />
            {reminder.checkinEnabled && (
              <div className="pb-3">
                <label className="text-xs text-gray-400 mb-1 block">提醒时间</label>
                <input
                  type="time"
                  value={reminder.checkinTime}
                  onChange={e => setReminder(r => ({ ...r, checkinTime: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>
            )}
          </div>
          <div>
            <Toggle
              enabled={reminder.exerciseEnabled}
              onChange={v => setReminder(r => ({ ...r, exerciseEnabled: v }))}
              label="运动提醒"
              desc="每天提醒你完成运动"
            />
            {reminder.exerciseEnabled && (
              <div className="pb-3">
                <label className="text-xs text-gray-400 mb-1 block">提醒时间</label>
                <input
                  type="time"
                  value={reminder.exerciseTime}
                  onChange={e => setReminder(r => ({ ...r, exerciseTime: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>
            )}
          </div>
          <div>
            <Toggle
              enabled={reminder.waterEnabled}
              onChange={v => setReminder(r => ({ ...r, waterEnabled: v }))}
              label="喝水提醒"
              desc="每天4次提醒你喝水"
            />
            {reminder.waterEnabled && (
              <div className="pb-3 space-y-2">
                <label className="text-xs text-gray-400 block">4次提醒时间</label>
                {reminder.waterTimes.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-10">第{['一','二','三','四'][i]}次</span>
                    <input
                      type="time"
                      value={t}
                      onChange={e => {
                        const times = [...reminder.waterTimes]
                        times[i] = e.target.value
                        setReminder(r => ({ ...r, waterTimes: times }))
                      }}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSaveReminder}
          className={`mt-3 w-full text-sm py-2.5 rounded-xl font-medium transition-colors
            ${saved ? 'bg-green-100 text-green-700' : 'bg-green-500 text-white hover:bg-green-600'}`}
        >
          {saved ? '✅ 已保存' : '保存提醒设置'}
        </button>
      </div>

      {/* 数据 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">💾 数据管理</h2>
        <button
          onClick={exportData}
          className="w-full text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl transition-colors font-medium"
        >
          导出数据为 JSON 文件
        </button>
      </div>

      {/* 关于 */}
      <div className="text-center text-xs text-gray-300 pt-2">
        减肥打卡 v1.0 · 数据存储在本地浏览器
      </div>
    </div>
  )
}
