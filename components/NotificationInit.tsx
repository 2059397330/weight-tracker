'use client'

import { useEffect } from 'react'
import { getReminderSettings } from '@/lib/storage'
import { scheduleNotifications } from '@/lib/scheduler'

export default function NotificationInit() {
  useEffect(() => {
    // 注册 SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/weight-tracker/sw.js').then(() => {
        // SW 就绪后调度今天的通知
        const settings = getReminderSettings()
        scheduleNotifications(settings)
      })
    }
  }, [])

  return null
}
