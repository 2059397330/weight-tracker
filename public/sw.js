// Service Worker - 处理定时提醒通知
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// 接收来自页面的消息：页面负责计算时间，SW 负责到点弹通知
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_NOTIFICATIONS') {
    const notifications = e.data.payload // [{delayMs, title, body, tag}]
    for (const n of notifications) {
      if (n.delayMs < 0) continue
      setTimeout(() => {
        self.registration.showNotification(n.title, {
          body: n.body,
          icon: '/weight-tracker/icon-192.png',
          badge: '/weight-tracker/icon-192.png',
          tag: n.tag,
          renotify: true,
          data: { url: n.url ?? '/weight-tracker/' },
        })
      }, n.delayMs)
    }
  }
})

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
