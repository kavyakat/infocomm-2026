import { describe, it, expect } from 'vitest'
import { eligibleCount, buildHallDistribution } from '../../lib/analytics'

describe('eligibleCount', () => {
  it('counts only visitors with ≥10 visits on day 1 AND ≥10 on day 2', () => {
    const day1 = (n: number) => Array.from({ length: n }, () => ({ day: 1 as const }))
    const day2 = (n: number) => Array.from({ length: n }, () => ({ day: 2 as const }))

    const map = new Map<string, Array<{ day: 1 | 2 | 3 }>>()
    // Visitor A: 10 day1 + 10 day2 → eligible
    map.set('A', [...day1(10), ...day2(10)])
    // Visitor B: 9 day1 + 10 day2 → not eligible
    map.set('B', [...day1(9), ...day2(10)])
    // Visitor C: 10 day1 + 9 day2 → not eligible
    map.set('C', [...day1(10), ...day2(9)])
    // Visitor D: 0 visits → not eligible
    map.set('D', [])

    expect(eligibleCount(map)).toBe(1)
  })
})

describe('buildHallDistribution', () => {
  it('produces correct per-hall counts sorted by visit count descending', () => {
    const exhibitors = [
      { id: 'e1', hall: 'Hall 1' },
      { id: 'e2', hall: 'Hall 1' },
      { id: 'e3', hall: 'Hall 2' },
    ]
    const visits = [
      { exhibitor_id: 'e1' },
      { exhibitor_id: 'e1' },
      { exhibitor_id: 'e3' },
      { exhibitor_id: 'e3' },
      { exhibitor_id: 'e3' },
    ]

    const result = buildHallDistribution(exhibitors, visits)

    expect(result).toHaveLength(2)
    // Hall 2 has 3 visits so comes first
    expect(result[0].hall).toBe('Hall 2')
    expect(result[0].exhibitorCount).toBe(1)
    expect(result[0].visitCount).toBe(3)

    expect(result[1].hall).toBe('Hall 1')
    expect(result[1].exhibitorCount).toBe(2)
    expect(result[1].visitCount).toBe(2)
  })

  it('returns zero visitCount for halls with no visits', () => {
    const exhibitors = [{ id: 'e1', hall: 'Hall A' }]
    const visits: Array<{ exhibitor_id: string }> = []

    const result = buildHallDistribution(exhibitors, visits)
    expect(result).toHaveLength(1)
    expect(result[0].visitCount).toBe(0)
  })
})
