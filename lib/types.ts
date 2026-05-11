// 用户目标
export interface UserGoal {
  currentWeight: number   // kg
  targetWeight: number    // kg
  startDate: string       // YYYY-MM-DD
  targetDate: string      // YYYY-MM-DD
}

// 每日打卡记录
export interface DailyRecord {
  date: string            // YYYY-MM-DD (主键)
  weight?: number         // kg，精确到0.1
  diet?: 'low' | 'normal' | 'over'   // 低卡/正常/超标
  exercise?: {
    duration: number      // 分钟
    type: string          // 类型描述
  }
  water?: number          // ml
  updatedAt: string       // ISO timestamp
}

// 提醒设置
export interface ReminderSettings {
  checkinEnabled: boolean
  checkinTime: string     // HH:mm
  exerciseEnabled: boolean
  exerciseTime: string    // HH:mm
  waterEnabled: boolean
  waterTimes: string[]    // HH:mm x4，固定4次
}

export type DietLabel = 'low' | 'normal' | 'over'
export const DIET_LABELS: Record<DietLabel, string> = {
  low: '低卡',
  normal: '正常',
  over: '超标',
}
