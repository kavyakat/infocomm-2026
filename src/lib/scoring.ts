export interface VisitRecord {
  exhibitor_id: string
  hall: string
  day: 1 | 2 | 3
  rating: number | null
}

export function calculateScore(visits: VisitRecord[]): number {
  const uniqueVisits = visits.length
  const uniqueHalls = new Set(visits.map(v => v.hall)).size
  const daysActive = new Set(visits.map(v => v.day)).size
  const ratingsSum = visits.reduce((sum, v) => sum + (v.rating ?? 2.5), 0)
  return uniqueVisits * 1 + uniqueHalls * 5 + daysActive * 3 + ratingsSum
}

export function isEligible(visits: VisitRecord[]): boolean {
  const day1 = visits.filter(v => v.day === 1).length
  const day2 = visits.filter(v => v.day === 2).length
  return day1 >= 10 && day2 >= 10
}

export function weightedDraw(candidates: Array<{ id: string; score: number }>): string {
  if (candidates.length === 0) throw new Error('weightedDraw: candidates array is empty')
  const total = candidates.reduce((sum, c) => sum + c.score, 0)
  let r = Math.random() * total
  for (const c of candidates) {
    r -= c.score
    if (r <= 0) return c.id
  }
  return candidates[candidates.length - 1].id
}
