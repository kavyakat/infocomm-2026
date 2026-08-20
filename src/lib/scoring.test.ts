import { describe, it, expect } from 'vitest'
import { calculateScore, isEligible, weightedDraw } from './scoring'

const makeVisit = (hall: string, day: 1 | 2 | 3, rating: number | null) => ({
  exhibitor_id: Math.random().toString(),
  hall,
  day,
  rating,
})

describe('calculateScore', () => {
  it('scores unique visits × 1', () => {
    const visits = [makeVisit('H1', 1, null), makeVisit('H1', 1, null)]
    // 2 visits, 1 hall, 1 day, 2 × 2.5 ratings = 2 + 5 + 3 + 5 = 15
    expect(calculateScore(visits)).toBe(15)
  })

  it('uses given rating for rated visits', () => {
    const visits = [makeVisit('H1', 1, 5)]
    // 1 visit + 5 halls×0 + 1 day + 5 rating = 1 + 5 + 3 + 5 = 14
    expect(calculateScore(visits)).toBe(14)
  })

  it('uses 2.5 for unrated visits', () => {
    const visits = [makeVisit('H1', 1, null)]
    // 1 + 5 + 3 + 2.5 = 11.5
    expect(calculateScore(visits)).toBe(11.5)
  })

  it('matches the spec example: 25 visits, 4 halls, 2 days, 10 rated@4, 15 unrated', () => {
    const rated = Array.from({ length: 10 }, (_, i) =>
      makeVisit(`H${(i % 4) + 1}`, i < 13 ? 1 : 2, 4)
    )
    const unrated = Array.from({ length: 15 }, (_, i) =>
      makeVisit(`H${(i % 4) + 1}`, i < 13 ? 1 : 2, null)
    )
    const visits = [...rated, ...unrated]
    expect(calculateScore(visits)).toBe(128.5)
  })
})

describe('isEligible', () => {
  it('returns true when ≥10 visits on day1 AND day2', () => {
    const visits = [
      ...Array.from({ length: 10 }, () => makeVisit('H1', 1, null)),
      ...Array.from({ length: 10 }, () => makeVisit('H1', 2, null)),
    ]
    expect(isEligible(visits)).toBe(true)
  })

  it('returns false when day1 < 10', () => {
    const visits = [
      ...Array.from({ length: 9 }, () => makeVisit('H1', 1, null)),
      ...Array.from({ length: 10 }, () => makeVisit('H1', 2, null)),
    ]
    expect(isEligible(visits)).toBe(false)
  })

  it('returns false when day2 < 10', () => {
    const visits = [
      ...Array.from({ length: 10 }, () => makeVisit('H1', 1, null)),
      ...Array.from({ length: 9 }, () => makeVisit('H1', 2, null)),
    ]
    expect(isEligible(visits)).toBe(false)
  })
})

describe('weightedDraw', () => {
  it('always picks from the candidates', () => {
    const candidates = [{ id: 'a', score: 10 }, { id: 'b', score: 90 }]
    for (let i = 0; i < 50; i++) {
      const winner = weightedDraw(candidates)
      expect(['a', 'b']).toContain(winner)
    }
  })

  it('picks the only candidate when pool has one entry', () => {
    expect(weightedDraw([{ id: 'solo', score: 100 }])).toBe('solo')
  })
})
