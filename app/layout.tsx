import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import NotificationInit from '@/components/NotificationInit'

export const metadata: Metadata = {
  title: '减肥打卡',
  description: '个人减肥管理工具，记录体重、饮食、运动、饮水',
  manifest: '/weight-tracker/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '减肥打卡',
  },
  icons: {
    icon: '/weight-tracker/icon-192.png',
    apple: '/weight-tracker/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* iOS Safari PWA 全屏支持 */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="减肥打卡" />
        <link rel="apple-touch-icon" href="/weight-tracker/icon-192.png" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <NotificationInit />
        <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white shadow-sm">
          <main className="flex-1 overflow-y-auto pb-20">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
