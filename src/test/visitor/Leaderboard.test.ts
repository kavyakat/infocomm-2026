import { describe, it, expect } from 'vitest'
import { buildLeaderboardEntries, formatName } from '../../lib/leaderboard'

const visit = (visitor_id: string, hall = 'H1') => ({
  visitor_id,
  exhibitor_id: Math.random().toString(),
  hall,
  day: 1 as const,
  rating: null,
})

describe('buildLeaderboardEntries', () => {
  it('includes all profiles, even those with zero visits', () => {
    const profiles = [
      { id: 'u1', name: 'Alice Smith' },
      { id: 'u2', name: 'Bob Jones' }, // no visits
    ]
    const visits = [visit('u1'), visit('u1')]

    const entries = buildLeaderboardEntries(profiles, visits)

    expect(entries).toHaveLength(2)
    expect(entries.map(e => e.id)).toContain('u2')
    expect(entries.find(e => e.id === 'u2')?.visitCount).toBe(0)
  })

  it('sorts by score descending', () => {
    const profiles = [
      { id: 'u1', name: 'Alice' },
      { id: 'u2', name: 'Bob' },
    ]
    // u2 gets more visits → higher score
    const visits = [...Array(5).fill(null).map(() => visit('u2')), visit('u1')]

    const entries = buildLeaderboardEntries(profiles, visits)

    expect(entries[0].id).toBe('u2')
    expect(entries[1].id).toBe('u1')
  })

  it('excludes profiles not in the profiles list', () => {
    // A visit from a visitor whose profile was deleted / not returned
    const profiles = [{ id: 'u1', name: 'Alice' }]
    const visits = [visit('u1'), visit('u_orphan')]

    const entries = buildLeaderboardEntries(profiles, visits)

    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe('u1')
  })

  it('returns empty array when there are no profiles', () => {
    expect(buildLeaderboardEntries([], [visit('u1')])).toHaveLength(0)
  })
})

describe('formatName', () => {
  it('returns full name when single word', () => {
    expect(formatName('Madonna')).toBe('Madonna')
  })

  it('returns first name + last initial', () => {
    expect(formatName('Alice Smith')).toBe('Alice S.')
  })

  it('uses last word for initial when multiple names', () => {
    expect(formatName('Mary Jane Watson')).toBe('Mary W.')
  })

  it('trims extra whitespace', () => {
    expect(formatName('  Bob   Jones  ')).toBe('Bob J.')
  })
})
