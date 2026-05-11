'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getGoal, getRecord, getRecentRecords } from '@/lib/storage'
import { format, differenceInDays } from 'date-fns'
import { UserGoal, DailyRecord } from '@/lib/types'
import Link from 'next/link'

// 进度环组件
function ProgressRing({ percent, size = 140 }: { percent: number; size?: number }) {
  const r = (size - 16) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={12} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#22c55e" strokeWidth={12}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
        fontSize={size * 0.2} fontWeight="bold" fill="#16a34a">
        {Math.round(percent)}%
      </text>
    </svg>
  )
}

function CheckItem({ label, done, emoji }: { label: string; done: boolean; emoji: string }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors
      ${done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      <span className="text-xl">{emoji}</span>
      <span className={`flex-1 text-sm font-medium ${done ? 'text-green-700' : 'text-gray-500'}`}>
        {label}
      </span>
      <span className={`text-lg ${done ? '' : 'opacity-30'}`}>{done ? '✅' : '⭕'}</span>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [goal, setGoal] = useState<UserGoal | null>(null)
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(null)
  const [latestWeight, setLatestWeight] = useState<number | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    const g = getGoal()
    if (!g) { router.replace('/setup'); return }
    setGoal(g)
    setTodayRecord(getRecord(today))

    // 找最近一次有体重的记录
    const recent = getRecentRecords(30)
    const last = [...recent].reverse().find(r => r.weight !== undefined)
    setLatestWeight(last?.weight ?? g.currentWeight)
  }, [today, router])

  if (!goal) return null

  // 减重进度 = (起始 - 当前) / (起始 - 目标)
  const totalNeed = goal.currentWeight - goal.targetWeight
  const alreadyLost = goal.currentWeight - (latestWeight ?? goal.currentWeight)
  const percent = totalNeed > 0 ? Math.max(0, (alreadyLost / totalNeed) * 100) : 0

  const daysLeft = differenceInDays(new Date(goal.targetDate), new Date())
  const todayChecks = {
    weight: todayRecord?.weight !== undefined,
    diet: todayRecord?.diet !== undefined,
    exercise: todayRecord?.exercise !== undefined,
    water: todayRecord?.water !== undefined,
  }
  const checkedCount = Object.values(todayChecks).filter(Boolean).length

  const today_str = format(new Date(), 'M月d日 EEEE', { locale: undefined })

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">减肥打卡</h1>
          <p className="text-sm text-gray-400 mt-0.5">{format(new Date(), 'yyyy年M月d日')}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">距目标还有</p>
          <p className="text-2xl font-bold text-green-600">{Math.max(0, daysLeft)}<span className="text-sm font-normal text-gray-400 ml-0.5">天</span></p>
        </div>
      </div>

      {/* 进度环 */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 flex items-center gap-5">
        <ProgressRing percent={percent} />
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">减重目标进度</p>
          <p className="text-2xl font-bold text-gray-800">
            {latestWeight?.toFixed(1) ?? goal.currentWeight.toFixed(1)}
            <span className="text-sm font-normal text-gray-400 ml-1">kg</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            目标 {goal.targetWeight} kg · 已减 {Math.max(0, alreadyLost).toFixed(1)} kg
          </p>
          <p className="text-xs text-gray-400">
            还需减 {Math.max(0, (latestWeight ?? goal.currentWeight) - goal.targetWeight).toFixed(1)} kg
          </p>
        </div>
      </div>

      {/* 今日打卡状态 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">今日打卡</h2>
          <span className="text-xs text-gray-400">{checkedCount}/4 已完成</span>
        </div>
        <div className="space-y-2">
          <CheckItem label={`体重${todayRecord?.weight ? `  ${todayRecord.weight} kg` : ''}`} done={todayChecks.weight} emoji="⚖️" />
          <CheckItem label={`饮食${todayRecord?.diet ? `  ${todayRecord.diet === 'low' ? '低卡' : todayRecord.diet === 'normal' ? '正常' : '超标'}` : ''}`} done={todayChecks.diet} emoji="🥗" />
          <CheckItem label={`运动${todayRecord?.exercise ? `  ${todayRecord.exercise.duration}分钟` : ''}`} done={todayChecks.exercise} emoji="🏃" />
          <CheckItem label={`饮水${todayRecord?.water ? `  ${todayRecord.water}ml` : ''}`} done={todayChecks.water} emoji="💧" />
        </div>
      </div>

      {/* 快捷打卡按钮 */}
      {checkedCount < 4 && (
        <Link
          href="/checkin"
          className="block w-full bg-green-500 hover:bg-green-600 text-white text-center font-semibold py-3.5 rounded-xl text-base transition-colors"
        >
          去打卡 →
        </Link>
      )}
      {checkedCount === 4 && (
        <div className="text-center py-3 bg-green-50 rounded-xl text-green-700 font-medium text-sm">
          🎉 今日打卡全部完成！坚持就是胜利
        </div>
      )}
    </div>
  )
}
