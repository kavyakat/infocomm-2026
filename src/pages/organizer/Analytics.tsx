import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { isEligible } from '../../lib/scoring'

export function eligibleCount(
  visitsByVisitor: Map<string, Array<{ day: 1 | 2 | 3 }>>
): number {
  let count = 0
  for (const visits of visitsByVisitor.values()) {
    if (isEligible(visits.map(v => ({ exhibitor_id: '', hall: '', day: v.day, rating: null })))) {
      count++
    }
  }
  return count
}

export function buildHallDistribution(
  exhibitors: Array<{ id: string; hall: string }>,
  visits: Array<{ exhibitor_id: string }>
): Array<{ hall: string; exhibitorCount: number; visitCount: number }> {
  const hallExhibitors = new Map<string, Set<string>>()
  for (const ex of exhibitors) {
    if (!hallExhibitors.has(ex.hall)) hallExhibitors.set(ex.hall, new Set())
    hallExhibitors.get(ex.hall)!.add(ex.id)
  }

  const exhibitorToHall = new Map<string, string>()
  for (const ex of exhibitors) exhibitorToHall.set(ex.id, ex.hall)

  const hallVisits = new Map<string, number>()
  for (const v of visits) {
    const hall = exhibitorToHall.get(v.exhibitor_id)
    if (hall) hallVisits.set(hall, (hallVisits.get(hall) ?? 0) + 1)
  }

  return Array.from(hallExhibitors.entries())
    .map(([hall, exSet]) => ({
      hall,
      exhibitorCount: exSet.size,
      visitCount: hallVisits.get(hall) ?? 0,
    }))
    .sort((a, b) => b.visitCount - a.visitCount)
}

type Stats = {
  totalVisits: number
  uniqueVisitors: number
  totalExhibitors: number
  eligible: number
  hallDist: Array<{ hall: string; exhibitorCount: number; visitCount: number }>
}

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
      <div className="text-3xl font-bold text-primary">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}

export default function Analytics() {
  const { signOut } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [visitsRes, exhibitorsRes] = await Promise.all([
        supabase.from('visits').select('visitor_id, day, exhibitor_id'),
        supabase.from('exhibitors').select('id, hall'),
      ])

      if (visitsRes.error) { setError(visitsRes.error.message); setLoading(false); return }
      if (exhibitorsRes.error) { setError(exhibitorsRes.error.message); setLoading(false); return }

      const allVisits = (visitsRes.data ?? []) as Array<{ visitor_id: string; day: 1 | 2 | 3; exhibitor_id: string }>
      const allExhibitors = (exhibitorsRes.data ?? []) as Array<{ id: string; hall: string }>

      const totalVisits = allVisits.length
      const uniqueVisitors = new Set(allVisits.map(v => v.visitor_id)).size
      const totalExhibitors = allExhibitors.length

      const visitsByVisitor = new Map<string, Array<{ day: 1 | 2 | 3 }>>()
      for (const v of allVisits) {
        if (!visitsByVisitor.has(v.visitor_id)) visitsByVisitor.set(v.visitor_id, [])
        visitsByVisitor.get(v.visitor_id)!.push({ day: v.day })
      }

      const eligible = eligibleCount(visitsByVisitor)
      const hallDist = buildHallDistribution(allExhibitors, allVisits)

      setStats({ totalVisits, uniqueVisitors, totalExhibitors, eligible, hallDist })
      setLoading(false)
    }

    load().catch(err => { setError(String(err)); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary text-white px-6 py-3 flex items-center justify-between">
        <span className="font-bold">InfoComm India 2026 — Organizer</span>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/organizer" className="hover:underline">Exhibitors</Link>
          <Link to="/organizer/feed" className="hover:underline">Feed</Link>
          <Link to="/organizer/analytics" className="underline">Analytics</Link>
          <Link to="/organizer/draw" className="hover:underline">Lucky Draw</Link>
          <button onClick={signOut} className="bg-white text-primary font-semibold px-3 py-1 rounded">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard value={stats.totalVisits} label="Total Visits" />
              <StatCard value={stats.uniqueVisitors} label="Unique Visitors" />
              <StatCard value={stats.totalExhibitors} label="Total Exhibitors" />
              <StatCard value={stats.eligible} label="Eligible Visitors" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Hall Distribution</h2>
              {stats.hallDist.length === 0 ? (
                <p className="text-gray-500 text-sm">No hall data available.</p>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-5 py-3 font-semibold text-gray-700">Hall</th>
                        <th className="text-right px-5 py-3 font-semibold text-gray-700">Exhibitors</th>
                        <th className="text-right px-5 py-3 font-semibold text-gray-700">Visits</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.hallDist.map(row => {
                        const maxVisits = stats.hallDist[0].visitCount
                        const pct = maxVisits > 0 ? Math.round((row.visitCount / maxVisits) * 100) : 0
                        return (
                          <tr key={row.hall}>
                            <td className="px-5 py-3 font-medium text-gray-900">{row.hall}</td>
                            <td className="px-5 py-3 text-right text-gray-700">{row.exhibitorCount}</td>
                            <td className="px-5 py-3 text-right text-gray-700">{row.visitCount}</td>
                            <td className="px-5 py-3 w-32">
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
