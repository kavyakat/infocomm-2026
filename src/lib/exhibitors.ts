export function parseExhibitorCsv(csv: string): Array<{ name: string; booth_number: string; hall: string }> {
  const lines = csv.trim().split('\n')
  return lines.slice(1).flatMap(line => {
    const cols = line.split(',').map(c => c.trim())
    const [name, booth_number, hall] = cols
    if (!name || !booth_number || !hall) return []
    return [{ name, booth_number, hall }]
  })
}
