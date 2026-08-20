import { useEffect, useState } from 'react'
import { db, type LocalVisit } from '../lib/db'

export function useVisits(visitorId: string) {
  const [visits, setVisits] = useState<LocalVisit[]>([])

  useEffect(() => {
    if (!visitorId) return
    db.visits.where('visitor_id').equals(visitorId).toArray().then(setVisits)
  }, [visitorId])

  function hasVisited(exhibitorId: string): boolean {
    return visits.some(v => v.exhibitor_id === exhibitorId)
  }

  function getVisitedHalls(allExhibitors: { id: string; hall: string }[]): { visited: number; total: number } {
    const visitedExhibitorIds = new Set(visits.map(v => v.exhibitor_id))
    const visitedHalls = new Set(
      allExhibitors.filter(e => visitedExhibitorIds.has(e.id)).map(e => e.hall)
    )
    const totalHalls = new Set(allExhibitors.map(e => e.hall)).size
    return { visited: visitedHalls.size, total: totalHalls }
  }

  async function refreshVisits() {
    if (!visitorId) return
    const updated = await db.visits.where('visitor_id').equals(visitorId).toArray()
    setVisits(updated)
  }

  return { visits, hasVisited, getVisitedHalls, refreshVisits }
}
