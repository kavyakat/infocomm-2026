import { calculateScore, type VisitRecord } from './scoring'

export type RawVisit = {
  visitor_id: string
  exhibitor_id: string
  hall: string
  day: 1 | 2 | 3
  rating: number | null
}

type LeaderboardEntry = { id: string; name: string; score: number; visitCount: number }

export function formatName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export function buildLeaderboardEntries(
  profiles: Array<{ id: string; name: string }>,
  rawVisits: RawVisit[]
): LeaderboardEntry[] {
  const byVisitor = new Map<string, VisitRecord[]>()
  for (const v of rawVisits) {
    if (!byVisitor.has(v.visitor_id)) byVisitor.set(v.visitor_id, [])
    byVisitor.get(v.visitor_id)!.push({ exhibitor_id: v.exhibitor_id, hall: v.hall, day: v.day, rating: v.rating })
  }

  const entries: LeaderboardEntry[] = profiles.map(p => {
    const visits = byVisitor.get(p.id) ?? []
    return { id: p.id, name: p.name, score: calculateScore(visits), visitCount: visits.length }
  })

  return entries.sort((a, b) => b.score - a.score)
}
