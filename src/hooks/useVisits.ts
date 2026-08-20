import { useEffect, useState } from 'react'
import { db, type LocalVisit } from '../lib/db'
import { supabase } from '../lib/supabase'

export function useVisits(visitorId: string) {
  const [visits, setVisits] = useState<LocalVisit[]>([])

  useEffect(() => {
    if (!visitorId) return

    // Load from Dexie immediately for instant display
    db.visits.where('visitor_id').equals(visitorId).toArray().then(setVisits)

    // Fetch from Supabase and upsert into Dexie so checkmarks sync across devices
    supabase
      .from('visits')
      .select('id, visitor_id, exhibitor_id, visited_at, day, rating')
      .eq('visitor_id', visitorId)
      .then(async ({ data }) => {
        if (!data || data.length === 0) return
        const remote: LocalVisit[] = data.map(v => ({ ...v, synced: true }))
        await db.visits.bulkPut(remote)
        const updated = await db.visits.where('visitor_id').equals(visitorId).toArray()
        setVisits(updated)
      })
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
