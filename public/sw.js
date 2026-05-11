// Service Worker - 处理定时提醒通知
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// 存储提醒配置
let reminders = {
  checkinEnabled: false,
  checkinTime: '08:00',
  exerciseEnabled: false,
  exerciseTime: '18:00',
  waterEnabled: false,
  waterTimes: ['08:00', '11:00', '14:00', '17:00'],
}

// 已触发过的喝水提醒（防止同一分钟重复）key = HH:mm
const firedWater = new Set()
let lastCheckinDate = ''
let lastExerciseDate = ''

// 接收来自页面的消息
self.addEventListener('message', e => {
  if (e.data?.type === 'UPDATE_REMINDERS') {
    reminders = e.data.payload
    firedWater.clear()
  }
})

// 每分钟检查是否到了提醒时间
function checkReminders() {
  const now = new Date()
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const today = now.toLocaleDateString('sv') // YYYY-MM-DD

  // 打卡提醒（每天只触发一次）
  if (reminders.checkinEnabled && hhmm === reminders.checkinTime && lastCheckinDate !== today) {
    lastCheckinDate = today
    self.registration.showNotification('⏰ 减肥打卡提醒', {
      body: '还没打卡哦，点击记录今日数据 💪',
      icon: '/weight-tracker/icon-192.png',
      badge: '/weight-tracker/icon-192.png',
      tag: 'checkin-reminder',
      data: { url: '/weight-tracker/checkin/' },
    })
  }

  // 运动提醒（每天只触发一次）
  if (reminders.exerciseEnabled && hhmm === reminders.exerciseTime && lastExerciseDate !== today) {
    lastExerciseDate = today
    self.registration.showNotification('🏃 运动提醒', {
      body: '该运动了！坚持每天锻炼，目标就在眼前 🎯',
      icon: '/weight-tracker/icon-192.png',
      tag: 'exercise-reminder',
      data: { url: '/weight-tracker/checkin/' },
    })
  }

  // 喝水提醒（每天4次，每个时间点只触发一次）
  if (reminders.waterEnabled && Array.isArray(reminders.waterTimes)) {
    for (const t of reminders.waterTimes) {
      const fireKey = `${today}_${t}`
      if (hhmm === t && !firedWater.has(fireKey)) {
        firedWater.add(fireKey)
        // 只保留最近100条，防止内存泄漏
        if (firedWater.size > 100) {
          const first = firedWater.values().next().value
          firedWater.delete(first)
        }
        self.registration.showNotification('💧 喝水提醒', {
          body: '记得喝水！每天8杯水，健康减肥两不误 🥤',
          icon: '/weight-tracker/icon-192.png',
          tag: `water-${t}`,
          data: { url: '/weight-tracker/' },
        })
      }
    }
  }
}

// 每分钟检查
setInterval(checkReminders, 60 * 1000)

// 点击通知跳转
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url ?? '/weight-tracker/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const c = clients.find(c => c.url.includes(self.location.origin))
      if (c) { c.focus(); c.navigate(url) }
      else self.clients.openWindow(url)
    })
  )
})
