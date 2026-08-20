import { describe, it, expect } from 'vitest'
import { generatePin, hashPin, verifyPin } from './pins'

describe('generatePin', () => {
  it('returns a 4-character string padded with zeros', () => {
    const pin = generatePin(new Set())
    expect(pin).toMatch(/^\d{4}$/)
  })

  it('never returns a pin already in the set', () => {
    const existing = new Set(Array.from({ length: 9999 }, (_, i) =>
      String(i).padStart(4, '0')
    ))
    const pin = generatePin(existing)
    expect(pin).toBe('9999')
  })

  it('generates unique pins across multiple calls', () => {
    const used = new Set<string>()
    for (let i = 0; i < 200; i++) {
      const pin = generatePin(used)
      expect(used.has(pin)).toBe(false)
      used.add(pin)
    }
  })
})

describe('hashPin / verifyPin', () => {
  it('verifies a correct pin', async () => {
    const hash = await hashPin('1234')
    expect(await verifyPin('1234', hash)).toBe(true)
  })

  it('rejects an incorrect pin', async () => {
    const hash = await hashPin('1234')
    expect(await verifyPin('9999', hash)).toBe(false)
  })
})
