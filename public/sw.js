// Service Worker - 处理定时提醒通知
// 安装时跳过等待，立即激活
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// 存储提醒配置
let reminders = {
  checkinEnabled: false,
  checkinTime: '08:00',
  exerciseEnabled: false,
  exerciseTime: '18:00',
}

// 接收来自页面的消息
self.addEventListener('message', e => {
  if (e.data?.type === 'UPDATE_REMINDERS') {
    reminders = e.data.payload
  }
})

// 每分钟检查是否到了提醒时间
function checkReminders() {
  const now = new Date()
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  if (reminders.checkinEnabled && hhmm === reminders.checkinTime) {
    // 检查今天是否已打卡
    self.registration.showNotification('⏰ 减肥打卡提醒', {
      body: '还没打卡哦，点击记录今日数据 💪',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'checkin-reminder',   // 同tag只显示一次（防重复）
      data: { url: '/checkin' },
    })
  }

  if (reminders.exerciseEnabled && hhmm === reminders.exerciseTime) {
    self.registration.showNotification('🏃 运动提醒', {
      body: '该运动了！坚持每天锻炼，目标就在眼前 🎯',
      icon: '/icon-192.png',
      tag: 'exercise-reminder',
      data: { url: '/checkin' },
    })
  }
}

// 注册定时检查（每分钟）
setInterval(checkReminders, 60 * 1000)

// 点击通知跳转
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url ?? '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const c = clients.find(c => c.url.includes(self.location.origin))
      if (c) { c.focus(); c.navigate(url) }
      else self.clients.openWindow(url)
    })
  )
})
