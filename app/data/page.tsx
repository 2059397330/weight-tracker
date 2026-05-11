'use client'

import { useState, useEffect } from 'react'
import { getRecentRecords, getAllRecords } from '@/lib/storage'
import { DailyRecord, DIET_LABELS } from '@/lib/types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { getGoal } from '@/lib/storage'

type Range = 7 | 30

function formatDate(date: string, range: Range) {
  const parts = date.split('-')
  return range === 7 ? `${parts[1]}/${parts[2]}` : parts[2] + '日'
}

export default function DataPage() {
  const [range, setRange] = useState<Range>(7)
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [targetWeight, setTargetWeight] = useState<number | null>(null)

  useEffect(() => {
    setRecords(getRecentRecords(range))
    const g = getGoal()
    if (g) setTargetWeight(g.targetWeight)
  }, [range])

  // 折线图数据（只含有体重的点）
  const chartData = records
    .filter(r => r.weight !== undefined)
    .map(r => ({ date: formatDate(r.date, range), weight: r.weight, full: r.date }))

  // 所有记录倒序（列表）
  const allRecords = Object.values(getAllRecords())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 60)

  const dietColor = (d?: string) =>
    d === 'low' ? 'text-green-600 bg-green-50' :
    d === 'normal' ? 'text-blue-600 bg-blue-50' :
    d === 'over' ? 'text-red-500 bg-red-50' : ''

  const weightRange = chartData.length > 0 ? {
    min: Math.floor(Math.min(...chartData.map(d => d.weight!)) - 1),
    max: Math.ceil(Math.max(...chartData.map(d => d.weight!)) + 1),
  } : { min: 'auto', max: 'auto' }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-xl font-bold text-gray-800">数据记录</h1>

      {/* 体重折线图 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-600">⚖️ 体重变化</h2>
          <div className="flex gap-1">
            {([7, 30] as Range[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${range === r ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {r}天
              </button>
            ))}
          </div>
        </div>

        {chartData.length < 2 ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
            记录至少2天体重后显示折线图
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis
                domain={[weightRange.min, weightRange.max]}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={v => `${v}`}
              />
              <Tooltip
                formatter={(v) => [`${v} kg`, '体重']}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              {targetWeight && (
                <ReferenceLine y={targetWeight} stroke="#f97316" strokeDasharray="4 4"
                  label={{ value: '目标', position: 'right', fontSize: 10, fill: '#f97316' }} />
              )}
              <Line
                type="monotone" dataKey="weight"
                stroke="#22c55e" strokeWidth={2.5}
                dot={{ fill: '#22c55e', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 记录列表 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 mb-3">📋 历史记录</h2>
        {allRecords.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">暂无记录</p>
        ) : (
          <div className="space-y-2">
            {allRecords.map(r => {
              const hasAny = r.weight || r.diet || r.exercise || r.water
              if (!hasAny) return null
              return (
                <div key={r.date} className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 mb-2">{r.date}</p>
                  <div className="flex flex-wrap gap-2">
                    {r.weight !== undefined && (
                      <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                        ⚖️ {r.weight} kg
                      </span>
                    )}
                    {r.diet && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${dietColor(r.diet)}`}>
                        🥗 {DIET_LABELS[r.diet]}
                      </span>
                    )}
                    {r.exercise && (
                      <span className="text-xs px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full font-medium">
                        🏃 {r.exercise.type || '运动'} {r.exercise.duration}min
                      </span>
                    )}
                    {r.water !== undefined && (
                      <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                        💧 {r.water}ml
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
