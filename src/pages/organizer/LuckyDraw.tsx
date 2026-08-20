import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { isEligible, calculateScore, weightedDraw, type VisitRecord } from '../../lib/scoring'

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

const RANK_BADGE: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
const RANK_LABEL: Record<number, string> = { 1: '1st Prize', 2: '2nd Prize', 3: '3rd Prize' }

export default function LuckyDraw() {
  const { signOut } = useAuth()
  const [eligibleCount, setEligibleCount] = useState(0)
  const [winners, setWinners] = useState<Winner[]>([])
  const [pool, setPool] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    load().catch(err => { setError(String(err)); setLoading(false) })
  }, [])

  async function load() {
    const [visitsRes, profilesRes, winnersRes] = await Promise.all([
      supabase.from('visits').select('visitor_id, day, exhibitor_id, rating, exhibitors(hall)'),
      supabase.from('profiles').select('id, name, email'),
      supabase.from('lucky_draw_winners').select('prize_rank, visitor_id, profiles(name, email)').order('prize_rank'),
    ])

    if (visitsRes.error) { setError(visitsRes.error.message); setLoading(false); return }
    if (profilesRes.error) { setError(profilesRes.error.message); setLoading(false); return }
    if (winnersRes.error) { setError(winnersRes.error.message); setLoading(false); return }

    const rawVisits = (visitsRes.data ?? []) as unknown as Array<{
      visitor_id: string
      day: 1 | 2 | 3
      exhibitor_id: string
      rating: number | null
      exhibitors: { hall: string } | null
    }>

    const flatVisits = rawVisits.map(v => ({
      visitor_id: v.visitor_id,
      day: v.day,
      hall: v.exhibitors?.hall ?? '',
      rating: v.rating,
    }))

    const profileMap = new Map<string, { name: string; email: string }>()
    for (const p of profilesRes.data ?? []) {
      profileMap.set(p.id, { name: p.name, email: p.email })
    }

    const allCandidates = buildCandidates(flatVisits, profileMap)
    setEligibleCount(allCandidates.length)

    const previousWinners = (winnersRes.data ?? []).map(w => {
      const pr = w as unknown as {
        prize_rank: number
        visitor_id: string
        profiles: { name: string; email: string } | null
      }
      const score = allCandidates.find(c => c.id === pr.visitor_id)?.score ?? 0
      return {
        prize_rank: pr.prize_rank as 1 | 2 | 3,
        visitor_id: pr.visitor_id,
        name: pr.profiles?.name ?? 'Unknown',
        email: pr.profiles?.email ?? '',
        score,
      }
    })
    setWinners(previousWinners.map(({ visitor_id: _vid, ...rest }) => rest as Winner))

    const drawnIds = new Set(previousWinners.map(w => w.visitor_id))
    setPool(allCandidates.filter(c => !drawnIds.has(c.id)))
    setLoading(false)
  }

  async function runDraw() {
    const next = nextPrizeRank(winners.map(w => w.prize_rank))
    if (next === null || pool.length === 0) return

    setDrawing(true)
    setRevealing(true)

    const winnerId = weightedDraw(pool.map(c => ({ id: c.id, score: c.score })))
    const winnerCandidate = pool.find(c => c.id === winnerId)!

    const { error: insertError } = await supabase
      .from('lucky_draw_winners')
      .insert({ visitor_id: winnerId, prize_rank: next })

    if (insertError) {
      setError(insertError.message)
      setDrawing(false)
      setRevealing(false)
      return
    }

    const newWinner: Winner = {
      prize_rank: next,
      name: winnerCandidate.name,
      email: winnerCandidate.email,
      score: winnerCandidate.score,
    }

    setWinners(prev => [...prev, newWinner].sort((a, b) => a.prize_rank - b.prize_rank))
    setPool(prev => prev.filter(c => c.id !== winnerId))

    setTimeout(() => {
      setRevealing(false)
      setDrawing(false)
    }, 800)
  }

  const nextRank = nextPrizeRank(winners.map(w => w.prize_rank))
  const canDraw = nextRank !== null && pool.length > 0 && !drawing

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary text-white px-6 py-3 flex items-center justify-between">
        <span className="font-bold">InfoComm India 2026 — Organizer</span>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/organizer" className="hover:underline">Exhibitors</Link>
          <Link to="/organizer/feed" className="hover:underline">Feed</Link>
          <Link to="/organizer/analytics" className="hover:underline">Analytics</Link>
          <Link to="/organizer/draw" className="underline">Lucky Draw</Link>
          <button onClick={signOut} className="bg-white text-primary font-semibold px-3 py-1 rounded">Sign Out</button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Lucky Draw</h1>
          {!loading && (
            <span className="text-sm text-gray-500">{eligibleCount} eligible visitor{eligibleCount !== 1 ? 's' : ''}</span>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <button
                onClick={runDraw}
                disabled={!canDraw}
                className="px-8 py-3 bg-primary text-white font-bold rounded-xl text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {drawing ? 'Drawing…' : nextRank === null ? 'All prizes drawn' : `Run Draw — ${RANK_LABEL[nextRank]}`}
              </button>
            </div>

            {winners.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Winners</h2>
                {winners.map((w, i) => {
                  const isNew = i === winners.length - 1 && drawing
                  return (
                    <div
                      key={w.prize_rank}
                      className={`transition-opacity duration-500 ${isNew && revealing ? 'opacity-0' : 'opacity-100'}`}
                    >
                      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                        <span className="text-3xl">{RANK_BADGE[w.prize_rank]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">{w.name}</div>
                          <div className="text-sm text-gray-500 truncate">{w.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-primary">{w.score.toFixed(1)} pts</div>
                          <div className="text-xs text-gray-400">{RANK_LABEL[w.prize_rank]}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {nextRank === null && (
              <p className="text-center text-gray-500 text-sm">All 3 prizes have been awarded.</p>
            )}

            {nextRank !== null && pool.length === 0 && eligibleCount > 0 && (
              <p className="text-center text-gray-500 text-sm">No eligible visitors remaining in the pool.</p>
            )}

            {eligibleCount === 0 && (
              <p className="text-center text-gray-500 text-sm">No eligible visitors yet. Visitors need ≥10 check-ins on Day 1 and Day 2.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
