export function getCurrentEventDay(): 1 | 2 | 3 {
  const start = new Date(import.meta.env.VITE_EVENT_START_DATE)
  const now = new Date()
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const day = diff + 1
  if (day <= 1) return 1
  if (day >= 3) return 3
  return day as 2
}
