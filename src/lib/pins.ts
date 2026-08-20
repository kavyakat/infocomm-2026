export function generatePin(existingPins: Set<string>): string {
  let pin: string
  do {
    pin = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  } while (existingPins.has(pin))
  return pin
}

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return (await hashPin(pin)) === hash
}
