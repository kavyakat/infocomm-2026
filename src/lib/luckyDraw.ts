import { isEligible, calculateScore, weightedDraw, type VisitRecord } from './scoring'

export type Candidate = { id: string; name: string; email: string; score: number }
export type Winner = { prize_rank: 1 | 2 | 3; name: string; email: string; score: number }

export function buildCandidates(
  allVisits: Array<{ visitor_id: string; day: 1 | 2 | 3; hall: string; rating: number | null }>,
  profiles: Map<string, { name: string; email: string }>
): Candidate[] {
  const byVisitor = new Map<string, VisitRecord[]>()
  for (const v of allVisits) {
    if (!byVisitor.has(v.visitor_id)) byVisitor.set(v.visitor_id, [])
    byVisitor.get(v.visitor_id)!.push({
      exhibitor_id: '',
      hall: v.hall,
      day: v.day,
      rating: v.rating,
    })
  }

  const candidates: Candidate[] = []
  for (const [visitorId, visits] of byVisitor.entries()) {
    if (!isEligible(visits)) continue
    const profile = profiles.get(visitorId)
    if (!profile) continue
    candidates.push({
      id: visitorId,
      name: profile.name,
      email: profile.email,
      score: calculateScore(visits),
    })
  }
  return candidates
}

export function nextPrizeRank(existingWinners: number[]): 1 | 2 | 3 | null {
  for (const rank of [1, 2, 3] as const) {
    if (!existingWinners.includes(rank)) return rank
  }
  return null
}

export { weightedDraw }
