// 通知调度器：页面打开时调用，计算今天剩余提醒并发给 SW
import { ReminderSettings } from './types'

// HH:mm -> 今天该时间的毫秒时间戳
function todayMs(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

// 距离今天某时间还有多少毫秒（负数表示已过）
function delayMs(hhmm: string): number {
  return todayMs(hhmm) - Date.now()
}

export async function scheduleNotifications(settings: ReminderSettings) {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  if (Notification.permission !== 'granted') return

  const reg = await navigator.serviceWorker.ready
  if (!reg.active) return

  const notifications: Array<{
    delayMs: number
    title: string
    body: string
    tag: string
    url: string
  }> = []

  // 打卡提醒
  if (settings.checkinEnabled) {
    const d = delayMs(settings.checkinTime)
    if (d > 0) {
      notifications.push({
        delayMs: d,
        title: '⏰ 减肥打卡提醒',
        body: '还没打卡哦，点击记录今日数据 💪',
        tag: 'checkin-reminder',
        url: '/weight-tracker/checkin/',
      })
    }
  }

  // 运动提醒
  if (settings.exerciseEnabled) {
    const d = delayMs(settings.exerciseTime)
    if (d > 0) {
      notifications.push({
        delayMs: d,
        title: '🏃 运动提醒',
        body: '该运动了！坚持每天锻炼，目标就在眼前 🎯',
        tag: 'exercise-reminder',
        url: '/weight-tracker/checkin/',
      })
    }
  }

  // 喝水提醒（4次）
  if (settings.waterEnabled && Array.isArray(settings.waterTimes)) {
    settings.waterTimes.forEach((t, i) => {
      const d = delayMs(t)
      if (d > 0) {
        notifications.push({
          delayMs: d,
          title: '💧 喝水提醒',
          body: `第${['一', '二', '三', '四'][i]}次喝水时间到！每天8杯水，健康减肥两不误 🥤`,
          tag: `water-${i}`,
          url: '/weight-tracker/',
        })
      }
    })
  }

  if (notifications.length === 0) return

  reg.active.postMessage({
    type: 'SCHEDULE_NOTIFICATIONS',
    payload: notifications,
  })
}
