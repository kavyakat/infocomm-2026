import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type Exhibitor } from '../../lib/supabase'
import { generatePin } from '../../lib/pins'
import { useAuth } from '../../hooks/useAuth'

export function parseExhibitorCsv(csv: string): Array<{ name: string; booth_number: string; hall: string }> {
  const lines = csv.trim().split('\n')
  // skip header row
  return lines.slice(1).flatMap(line => {
    const cols = line.split(',').map(c => c.trim())
    const [name, booth_number, hall] = cols
    if (!name || !booth_number || !hall) return []
    return [{ name, booth_number, hall }]
  })
}

export default function Exhibitors() {
  const { signOut } = useAuth()
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadExhibitors() {
    setLoading(true)
    const { data } = await supabase.from('exhibitors').select('*').order('name')
    setExhibitors(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadExhibitors() }, [])

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportError('')
    try {
      const text = await file.text()
      const rows = parseExhibitorCsv(text)
      if (rows.length === 0) { setImportError('No valid rows found in CSV'); setImporting(false); return }

      const existingPins = new Set(exhibitors.map(ex => ex.pin))
      const inserts = rows.map(row => {
        const pin = generatePin(existingPins)
        existingPins.add(pin)
        return { ...row, pin }
      })

      const { error } = await supabase.from('exhibitors').insert(inserts)
      if (error) { setImportError(error.message); setImporting(false); return }
      await loadExhibitors()
    } catch {
      setImportError('Failed to parse CSV')
    }
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function regenPin(exhibitor: Exhibitor) {
    const otherPins = new Set(exhibitors.filter(ex => ex.id !== exhibitor.id).map(ex => ex.pin))
    const newPin = generatePin(otherPins)
    const { error } = await supabase.from('exhibitors').update({ pin: newPin }).eq('id', exhibitor.id)
    if (!error) await loadExhibitors()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            padding: 1rem;
          }
          .pin-card {
            border: 2px solid #000;
            padding: 1rem;
            text-align: center;
            page-break-inside: avoid;
          }
          .pin-card .pin { font-size: 2.5rem; font-weight: 700; letter-spacing: 0.25rem; }
        }
        @media not print {
          .print-grid { display: none; }
        }
      `}</style>

      <nav className="no-print bg-primary text-white px-6 py-3 flex items-center justify-between">
        <span className="font-bold">InfoComm India 2026 — Organizer</span>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/organizer" className="underline">Exhibitors</Link>
          <Link to="/organizer/feed" className="hover:underline">Feed</Link>
          <Link to="/organizer/analytics" className="hover:underline">Analytics</Link>
          <Link to="/organizer/draw" className="hover:underline">Lucky Draw</Link>
          <button onClick={signOut} className="bg-white text-primary font-semibold px-3 py-1 rounded">Sign Out</button>
        </div>
      </nav>

      <div className="no-print max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Exhibitors</h1>
          <div className="flex gap-3">
            <label className="cursor-pointer bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
              {importing ? 'Importing…' : 'Import CSV'}
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvImport}
                disabled={importing}
              />
            </label>
            <button
              onClick={() => window.print()}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Print PIN Sheet
            </button>
          </div>
        </div>

        {importError && <p className="text-red-500 text-sm">{importError}</p>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exhibitors.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No exhibitors yet. Import a CSV to get started.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Booth</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Hall</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">PIN</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exhibitors.map(ex => (
                  <tr key={ex.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{ex.name}</td>
                    <td className="px-4 py-3 text-gray-600">{ex.booth_number}</td>
                    <td className="px-4 py-3 text-gray-600">{ex.hall}</td>
                    <td className="px-4 py-3 font-mono font-bold text-primary">{ex.pin}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => regenPin(ex)}
                        className="text-xs text-gray-500 hover:text-primary border border-gray-200 rounded px-2 py-1"
                      >
                        Regen PIN
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="print-grid">
        {exhibitors.map(ex => (
          <div key={ex.id} className="pin-card">
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{ex.name}</div>
            <div style={{ fontSize: '0.85rem', color: '#555' }}>{ex.booth_number} · {ex.hall}</div>
            <div className="pin">{ex.pin}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
