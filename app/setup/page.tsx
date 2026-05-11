'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveGoal } from '@/lib/storage'
import { format, addDays } from 'date-fns'

export default function SetupPage() {
  const router = useRouter()
  const today = format(new Date(), 'yyyy-MM-dd')
  const defaultTarget = format(addDays(new Date(), 90), 'yyyy-MM-dd')

  const [form, setForm] = useState({
    currentWeight: '',
    targetWeight: '',
    targetDate: defaultTarget,
  })
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cw = parseFloat(form.currentWeight)
    const tw = parseFloat(form.targetWeight)
    if (isNaN(cw) || cw <= 0 || cw > 300) { setError('请输入有效的当前体重（kg）'); return }
    if (isNaN(tw) || tw <= 0 || tw > 300) { setError('请输入有效的目标体重（kg）'); return }
    if (tw >= cw) { setError('目标体重应小于当前体重'); return }
    if (form.targetDate <= today) { setError('目标日期应在今天之后'); return }

    saveGoal({
      currentWeight: cw,
      targetWeight: tw,
      startDate: today,
      targetDate: form.targetDate,
    })
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-green-50 to-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-2xl font-bold text-gray-800">设定你的目标</h1>
          <p className="text-gray-500 mt-1 text-sm">填写核心信息，开始减肥计划</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              当前体重 <span className="text-gray-400">(kg)</span>
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="例如 75.5"
              value={form.currentWeight}
              onChange={e => setForm(f => ({ ...f, currentWeight: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              目标体重 <span className="text-gray-400">(kg)</span>
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="例如 65.0"
              value={form.targetWeight}
              onChange={e => setForm(f => ({ ...f, targetWeight: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目标日期</label>
            <input
              type="date"
              value={form.targetDate}
              min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
              onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 rounded-xl text-lg transition-colors"
          >
            开始计划 →
          </button>
        </form>
      </div>
    </div>
  )
}
