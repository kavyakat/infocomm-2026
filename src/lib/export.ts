export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  if (rows.length === 0) return ''

  function cell(value: unknown): string {
    const str = String(value ?? '')
    if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
      return '"' + str.replaceAll('"', '""') + '"'
    }
    return str
  }

  const lines = [
    columns.join(','),
    ...rows.map(row => columns.map(col => cell(row[col])).join(',')),
  ]

  return lines.join('\r\n')
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
