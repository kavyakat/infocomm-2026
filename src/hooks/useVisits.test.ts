import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { db } from '../lib/db'

// Mock Supabase before importing the hook
const mockSupabaseVisits: Array<{
  id: string; visitor_id: string; exhibitor_id: string
  visited_at: string; day: 1|2|3; rating: null
}> = []

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: mockSupabaseVisits, error: null }),
      }),
    }),
  },
}))

// Import after mock is set up
const { useVisits } = await import('../hooks/useVisits')

beforeEach(async () => {
  await db.visits.clear()
  mockSupabaseVisits.length = 0
})

describe('useVisits', () => {
  it('returns empty when Dexie and Supabase are both empty', async () => {
    const { result } = renderHook(() => useVisits('u1'))
    await waitFor(() => {
      expect(result.current.visits).toHaveLength(0)
    })
  })

  it('reads visits already in Dexie', async () => {
    await db.visits.put({
      id: 'v1', visitor_id: 'u1', exhibitor_id: 'e1',
      visited_at: new Date().toISOString(), day: 1, rating: null, synced: true,
    })

    const { result } = renderHook(() => useVisits('u1'))
    await waitFor(() => {
      expect(result.current.hasVisited('e1')).toBe(true)
    })
  })

  it('seeds from Supabase when Dexie is empty — cross-device sync', async () => {
    mockSupabaseVisits.push({
      id: 'v-remote', visitor_id: 'u1', exhibitor_id: 'e-remote',
      visited_at: new Date().toISOString(), day: 1, rating: null,
    })

    const { result } = renderHook(() => useVisits('u1'))

    await waitFor(() => {
      expect(result.current.hasVisited('e-remote')).toBe(true)
    })

    // Also persisted to Dexie so it survives a reload
    const inDexie = await db.visits.get('v-remote')
    expect(inDexie).toBeDefined()
    expect(inDexie?.synced).toBe(true)
  })

  it('merges Supabase visits with existing Dexie visits', async () => {
    await db.visits.put({
      id: 'v-local', visitor_id: 'u1', exhibitor_id: 'e-local',
      visited_at: new Date().toISOString(), day: 1, rating: null, synced: false,
    })
    mockSupabaseVisits.push({
      id: 'v-remote', visitor_id: 'u1', exhibitor_id: 'e-remote',
      visited_at: new Date().toISOString(), day: 2, rating: null,
    })

    const { result } = renderHook(() => useVisits('u1'))

    await waitFor(() => {
      expect(result.current.hasVisited('e-local')).toBe(true)
      expect(result.current.hasVisited('e-remote')).toBe(true)
    })
  })

  it('does nothing when visitorId is empty', async () => {
    const { result } = renderHook(() => useVisits(''))
    await waitFor(() => {
      expect(result.current.visits).toHaveLength(0)
    })
  })
})
