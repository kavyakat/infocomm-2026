import { describe, it, expect } from 'vitest'
import { buildCandidates, nextPrizeRank } from '../../pages/organizer/LuckyDraw'

const day1Visits = (n: number, hall = 'H1') =>
  Array.from({ length: n }, () => ({ visitor_id: 'v1', day: 1 as const, hall, rating: null }))

const day2Visits = (n: number, hall = 'H1') =>
  Array.from({ length: n }, () => ({ visitor_id: 'v1', day: 2 as const, hall, rating: null }))

describe('buildCandidates', () => {
  it('includes eligible visitor with correct score', () => {
    const visits = [
      ...day1Visits(10, 'H1'),
      ...day2Visits(10, 'H2'),
    ]
    const profiles = new Map([['v1', { name: 'Alice', email: 'alice@example.com' }]])

    const result = buildCandidates(visits, profiles)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('v1')
    expect(result[0].name).toBe('Alice')
    expect(result[0].email).toBe('alice@example.com')
    // 20 visits×1 + 2 halls×5 + 2 days×3 + 20×2.5 = 20 + 10 + 6 + 50 = 86
    expect(result[0].score).toBe(86)
  })

  it('excludes visitor with fewer than 10 visits on day 1', () => {
    const visits = [
      ...Array.from({ length: 9 }, () => ({ visitor_id: 'v2', day: 1 as const, hall: 'H1', rating: null })),
      ...Array.from({ length: 10 }, () => ({ visitor_id: 'v2', day: 2 as const, hall: 'H1', rating: null })),
    ]
    const profiles = new Map([['v2', { name: 'Bob', email: 'bob@example.com' }]])

    const result = buildCandidates(visits, profiles)
    expect(result).toHaveLength(0)
  })

  it('excludes visitor with fewer than 10 visits on day 2', () => {
    const visits = [
      ...Array.from({ length: 10 }, () => ({ visitor_id: 'v3', day: 1 as const, hall: 'H1', rating: null })),
      ...Array.from({ length: 9 }, () => ({ visitor_id: 'v3', day: 2 as const, hall: 'H1', rating: null })),
    ]
    const profiles = new Map([['v3', { name: 'Carol', email: 'carol@example.com' }]])

    const result = buildCandidates(visits, profiles)
    expect(result).toHaveLength(0)
  })

  it('includes eligible and excludes ineligible from mixed input', () => {
    const visits = [
      ...Array.from({ length: 10 }, () => ({ visitor_id: 'eligible', day: 1 as const, hall: 'H1', rating: 4 })),
      ...Array.from({ length: 10 }, () => ({ visitor_id: 'eligible', day: 2 as const, hall: 'H1', rating: 4 })),
      ...Array.from({ length: 5 }, () => ({ visitor_id: 'ineligible', day: 1 as const, hall: 'H1', rating: null })),
      ...Array.from({ length: 10 }, () => ({ visitor_id: 'ineligible', day: 2 as const, hall: 'H1', rating: null })),
    ]
    const profiles = new Map([
      ['eligible', { name: 'Eligible User', email: 'e@example.com' }],
      ['ineligible', { name: 'Ineligible User', email: 'i@example.com' }],
    ])

    const result = buildCandidates(visits, profiles)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('eligible')
    // 20 visits×1 + 1 hall×5 + 2 days×3 + 20×4 rating = 20 + 5 + 6 + 80 = 111
    expect(result[0].score).toBe(111)
  })

  it('excludes visitors with no profile entry', () => {
    const visits = [
      ...day1Visits(10),
      ...day2Visits(10),
    ]
    const profiles = new Map<string, { name: string; email: string }>()

    const result = buildCandidates(visits, profiles)
    expect(result).toHaveLength(0)
  })
})

describe('nextPrizeRank', () => {
  it('returns 1 when no winners drawn', () => {
    expect(nextPrizeRank([])).toBe(1)
  })

  it('returns 2 when rank 1 is drawn', () => {
    expect(nextPrizeRank([1])).toBe(2)
  })

  it('returns 3 when ranks 1 and 2 are drawn', () => {
    expect(nextPrizeRank([1, 2])).toBe(3)
  })

  it('returns null when all 3 ranks are drawn', () => {
    expect(nextPrizeRank([1, 2, 3])).toBeNull()
  })
})
