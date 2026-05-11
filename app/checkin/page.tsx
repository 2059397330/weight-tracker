'use client'

import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { getRecord, upsertRecord, canMakeup } from '@/lib/storage'
import { DailyRecord, DietLabel, DIET_LABELS } from '@/lib/types'

const TODAY = format(new Date(), 'yyyy-MM-dd')

// 生成最近4天（含今天）供补卡选择
function getAvailableDates() {
  const dates = []
  for (let i = 0; i <= 3; i++) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
    if (i === 0 || canMakeup(d)) dates.push(d)
  }
  return dates
}

function InputCard({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
        <span className="text-xl">{emoji}</span>{title}
      </h3>
      {children}
    </div>
  )
}

export default function CheckinPage() {
  const dates = getAvailableDates()
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [record, setRecord] = useState<Partial<DailyRecord>>({})
  const [saved, setSaved] = useState(false)

  // 加载已有记录
  useEffect(() => {
    const r = getRecord(selectedDate)
    setRecord(r ?? {})
    setSaved(false)
  }, [selectedDate])

  function handleSave() {
    const patch: Partial<DailyRecord> = {}
    if (record.weight !== undefined) patch.weight = record.weight
    if (record.diet !== undefined) patch.diet = record.diet
    if (record.exercise !== undefined) patch.exercise = record.exercise
    if (record.water !== undefined) patch.water = record.water
    upsertRecord(selectedDate, patch)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const isToday = selectedDate === TODAY

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">打卡记录</h1>
        {!isToday && (
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">补卡模式</span>
        )}
      </div>

      {/* 日期选择（今天 + 补卡） */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {dates.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${selectedDate === d
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {d === TODAY ? '今天' : d.slice(5).replace('-', '/')}
          </button>
        ))}
      </div>

      {/* 体重 */}
      <InputCard title="体重" emoji="⚖️">
        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.1"
            min="20"
            max="300"
            placeholder="输入体重"
            value={record.weight ?? ''}
            onChange={e => setRecord(r => ({ ...r, weight: e.target.value ? parseFloat(e.target.value) : undefined }))}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-green-300"
          />
          <span className="text-gray-400 font-medium">kg</span>
        </div>
      </InputCard>

      {/* 饮食 */}
      <InputCard title="饮食" emoji="🥗">
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(DIET_LABELS) as [DietLabel, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRecord(r => ({ ...r, diet: r.diet === key ? undefined : key }))}
              className={`py-2.5 rounded-xl text-sm font-medium transition-colors border
                ${record.diet === key
                  ? key === 'low' ? 'bg-green-500 text-white border-green-500'
                    : key === 'normal' ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-red-400 text-white border-red-400'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
            >
              {key === 'low' ? '😊' : key === 'normal' ? '😐' : '😅'} {label}
            </button>
          ))}
        </div>
      </InputCard>

      {/* 运动 */}
      <InputCard title="运动" emoji="🏃">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="600"
              placeholder="时长"
              value={record.exercise?.duration ?? ''}
              onChange={e => setRecord(r => ({
                ...r,
                exercise: {
                  duration: e.target.value ? parseInt(e.target.value) : 0,
                  type: r.exercise?.type ?? ''
                }
              }))}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-green-300"
            />
            <span className="text-gray-400 font-medium">分钟</span>
          </div>
          <input
            type="text"
            placeholder="运动类型（如：跑步、骑行）"
            value={record.exercise?.type ?? ''}
            onChange={e => setRecord(r => ({
              ...r,
              exercise: {
                duration: r.exercise?.duration ?? 0,
                type: e.target.value
              }
            }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-green-300"
          />
          {/* 快捷类型 */}
          <div className="flex gap-2 flex-wrap">
            {['跑步', '骑行', '游泳', '健身', '走路', '跳绳'].map(t => (
              <button
                key={t}
                onClick={() => setRecord(r => ({ ...r, exercise: { duration: r.exercise?.duration ?? 30, type: t } }))}
                className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-700 rounded-full transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </InputCard>

      {/* 饮水 */}
      <InputCard title="饮水" emoji="💧">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="10000"
              step="100"
              placeholder="饮水量"
              value={record.water ?? ''}
              onChange={e => setRecord(r => ({ ...r, water: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-green-300"
            />
            <span className="text-gray-400 font-medium">ml</span>
          </div>
          {/* 快捷加量 */}
          <div className="flex gap-2">
            {[200, 300, 500].map(ml => (
              <button
                key={ml}
                onClick={() => setRecord(r => ({ ...r, water: (r.water ?? 0) + ml }))}
                className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full transition-colors font-medium"
              >
                +{ml}ml
              </button>
            ))}
            <button
              onClick={() => setRecord(r => ({ ...r, water: 0 }))}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors"
            >
              清零
            </button>
          </div>
        </div>
      </InputCard>

      {/* 提交 */}
      <button
        onClick={handleSave}
        className={`w-full font-semibold py-3.5 rounded-xl text-base transition-all
          ${saved
            ? 'bg-green-100 text-green-700'
            : 'bg-green-500 hover:bg-green-600 text-white'}`}
      >
        {saved ? '✅ 已保存！' : '保存打卡'}
      </button>
    </div>
  )
}
