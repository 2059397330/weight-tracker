'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CheckSquare, BarChart2, Settings } from 'lucide-react'

const tabs = [
  { href: '/', label: '首页', Icon: Home },
  { href: '/checkin', label: '打卡', Icon: CheckSquare },
  { href: '/data', label: '数据', Icon: BarChart2 },
  { href: '/settings', label: '设置', Icon: Settings },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 flex z-50">
      {tabs.map(({ href, label, Icon }) => {
        const active = path === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors
              ${active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span className="mt-0.5">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
