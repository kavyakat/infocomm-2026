import { describe, it, expect } from 'vitest'
import { buildHourlyDist, buildTopExhibitors, buildEngagementDist } from '../../lib/analytics'

describe('buildHourlyDist', () => {
  it('returns exactly 24 entries', () => {
    const result = buildHourlyDist([])
    expect(result).toHaveLength(24)
  })

  it('zero-fills hours with no visits', () => {
    const result = buildHourlyDist([])
    for (const { count } of result) {
      expect(count).toBe(0)
    }
    expect(result.map(r => r.hour)).toEqual(Array.from({ length: 24 }, (_, i) => i))
  })

  it('counts visits by hour correctly', () => {
    // Use local-time constructor so getHours() matches regardless of timezone
    const at9am = new Date(2026, 0, 1, 9, 0, 0).toISOString()
    const at9_30am = new Date(2026, 0, 1, 9, 30, 0).toISOString()
    const at2pm = new Date(2026, 0, 1, 14, 0, 0).toISOString()
    const visits = [
      { visited_at: at9am },
      { visited_at: at9_30am },
      { visited_at: at2pm },
    ]
    const result = buildHourlyDist(visits)
    expect(result[9].count).toBe(2)
    expect(result[14].count).toBe(1)
    const otherHours = result.filter(r => r.hour !== 9 && r.hour !== 14)
    for (const { count } of otherHours) {
      expect(count).toBe(0)
    }
  })

  it('skips entries with empty visited_at', () => {
    const visits = [
      { visited_at: '' },
      { visited_at: '2026-01-01T08:00:00Z' },
    ]
    const result = buildHourlyDist(visits)
    const total = result.reduce((sum, r) => sum + r.count, 0)
    expect(total).toBe(1)
  })
})

describe('buildTopExhibitors', () => {
  const exhibitors = [
    { id: 'e1', name: 'Alpha Corp', booth_number: 'A1' },
    { id: 'e2', name: 'Beta Inc', booth_number: 'B2' },
    { id: 'e3', name: 'Gamma Ltd', booth_number: 'C3' },
  ]

  it('sorts descending by visit count', () => {
    const visits = [
      { exhibitor_id: 'e2' },
      { exhibitor_id: 'e2' },
      { exhibitor_id: 'e2' },
      { exhibitor_id: 'e1' },
      { exhibitor_id: 'e1' },
      { exhibitor_id: 'e3' },
    ]
    const result = buildTopExhibitors(visits, exhibitors)
    expect(result[0].name).toBe('Beta Inc')
    expect(result[0].count).toBe(3)
    expect(result[1].name).toBe('Alpha Corp')
    expect(result[1].count).toBe(2)
    expect(result[2].name).toBe('Gamma Ltd')
    expect(result[2].count).toBe(1)
  })

  it('limits to n results', () => {
    const visits = [
      { exhibitor_id: 'e1' },
      { exhibitor_id: 'e2' },
      { exhibitor_id: 'e3' },
    ]
    const result = buildTopExhibitors(visits, exhibitors, 2)
    expect(result).toHaveLength(2)
  })

  it('handles missing exhibitor gracefully (skips unknown ids)', () => {
    const visits = [
      { exhibitor_id: 'e1' },
      { exhibitor_id: 'unknown-id' },
    ]
    const result = buildTopExhibitors(visits, exhibitors)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alpha Corp')
  })

  it('returns empty array when visits is empty', () => {
    const result = buildTopExhibitors([], exhibitors)
    expect(result).toHaveLength(0)
  })
})

describe('buildEngagementDist', () => {
  it('assigns boundary value 1 to bucket "1"', () => {
    const map = new Map([['v1', 1]])
    const result = buildEngagementDist(map)
    expect(result.find(r => r.bucket === '1')?.count).toBe(1)
  })

  it('assigns boundary value 2 to bucket "2–5"', () => {
    const map = new Map([['v1', 2]])
    const result = buildEngagementDist(map)
    expect(result.find(r => r.bucket === '2–5')?.count).toBe(1)
  })

  it('assigns boundary value 5 to bucket "2–5"', () => {
    const map = new Map([['v1', 5]])
    const result = buildEngagementDist(map)
    expect(result.find(r => r.bucket === '2–5')?.count).toBe(1)
  })

  it('assigns boundary value 6 to bucket "6–10"', () => {
    const map = new Map([['v1', 6]])
    const result = buildEngagementDist(map)
    expect(result.find(r => r.bucket === '6–10')?.count).toBe(1)
  })

  it('assigns boundary value 10 to bucket "6–10"', () => {
    const map = new Map([['v1', 10]])
    const result = buildEngagementDist(map)
    expect(result.find(r => r.bucket === '6–10')?.count).toBe(1)
  })

  it('assigns boundary value 11 to bucket "11–15"', () => {
    const map = new Map([['v1', 11]])
    const result = buildEngagementDist(map)
    expect(result.find(r => r.bucket === '11–15')?.count).toBe(1)
  })

  it('assigns boundary value 15 to bucket "11–15"', () => {
    const map = new Map([['v1', 15]])
    const result = buildEngagementDist(map)
    expect(result.find(r => r.bucket === '11–15')?.count).toBe(1)
  })

  it('assigns boundary value 16 to bucket "16+"', () => {
    const map = new Map([['v1', 16]])
    const result = buildEngagementDist(map)
    expect(result.find(r => r.bucket === '16+')?.count).toBe(1)
  })

  it('assigns large values to bucket "16+"', () => {
    const map = new Map([['v1', 100]])
    const result = buildEngagementDist(map)
    expect(result.find(r => r.bucket === '16+')?.count).toBe(1)
  })

  it('returns all 5 buckets', () => {
    const result = buildEngagementDist(new Map())
    expect(result).toHaveLength(5)
    expect(result.map(r => r.bucket)).toEqual(['1', '2–5', '6–10', '11–15', '16+'])
  })

  it('counts multiple visitors across buckets', () => {
    const map = new Map([
      ['a', 1],
      ['b', 3],
      ['c', 5],
      ['d', 7],
      ['e', 12],
      ['f', 20],
    ])
    const result = buildEngagementDist(map)
    expect(result.find(r => r.bucket === '1')?.count).toBe(1)
    expect(result.find(r => r.bucket === '2–5')?.count).toBe(2)
    expect(result.find(r => r.bucket === '6–10')?.count).toBe(1)
    expect(result.find(r => r.bucket === '11–15')?.count).toBe(1)
    expect(result.find(r => r.bucket === '16+')?.count).toBe(1)
  })
})
