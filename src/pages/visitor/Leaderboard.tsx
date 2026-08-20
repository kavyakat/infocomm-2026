import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { calculateScore, type VisitRecord } from '../../lib/scoring'

export function formatName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

type LeaderboardEntry = { id: string; name: string; score: number; visitCount: number }

type RawVisit = {
  visitor_id: string
  exhibitor_id: string
  hall: string
  day: 1 | 2 | 3
  rating: number | null
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

export default function Leaderboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const isOrganizer = profile?.role === 'organizer'

      if (!isOrganizer) {
        const { data: setting } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'leaderboard_visible')
          .single()
        if (setting?.value !== 'true') { setLoading(false); return }
      }
      setVisible(true)

      const [visitsRes, profilesRes] = await Promise.all([
        supabase.from('visits').select('visitor_id, day, exhibitor_id, rating, exhibitors(hall)'),
        supabase.from('profiles').select('id, name').eq('role', 'visitor'),
      ])

      if (visitsRes.error) { setError(visitsRes.error.message); setLoading(false); return }
      if (profilesRes.error) { setError(profilesRes.error.message); setLoading(false); return }

      const rawVisits = (visitsRes.data ?? []) as unknown as Array<{
        visitor_id: string
        day: 1 | 2 | 3
        exhibitor_id: string
        rating: number | null
        exhibitors: { hall: string } | null
      }>

      setEntries(buildLeaderboardEntries(
        profilesRes.data ?? [],
        rawVisits.map(v => ({
          visitor_id: v.visitor_id,
          exhibitor_id: v.exhibitor_id,
          hall: v.exhibitors?.hall ?? '',
          day: v.day,
          rating: v.rating,
        }))
      ))

      setLoading(false)
    }

    load().catch(err => { setError(String(err)); setLoading(false) })
  }, [profile])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="text-white opacity-80 hover:opacity-100 text-sm">← Back</button>
        <h1 className="text-xl font-bold">Leaderboard</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-3">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !visible ? (
          <p className="text-center text-gray-500 py-12">Leaderboard not available yet.</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No entries yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const isMe = entry.id === profile?.id
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    isMe ? 'bg-primary/10 border-primary' : 'bg-white border-gray-200'
                  }`}
                >
                  <span className="w-7 text-center text-sm font-bold text-gray-500">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${isMe ? 'text-primary' : 'text-gray-900'}`}>
                      {formatName(entry.name)}{isMe && ' (You)'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
