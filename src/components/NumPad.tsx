import { useEffect } from 'react'

interface Props {
  value: string
  onChange: (val: string) => void
  onConfirm: () => void
  error?: string
  disabled?: boolean
}

export default function NumPad({ value, onChange, onConfirm, error, disabled }: Props) {
  function press(digit: string) {
    if (value.length < 4) onChange(value + digit)
  }

  function backspace() {
    onChange(value.slice(0, -1))
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (disabled) return
      if (e.key >= '0' && e.key <= '9') {
        if (value.length < 4) onChange(value + e.key)
      } else if (e.key === 'Backspace') {
        onChange(value.slice(0, -1))
      } else if (e.key === 'Enter' && value.length === 4) {
        onConfirm()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [value, disabled, onChange, onConfirm])

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="space-y-4">
      {/* Display */}
      <div className="flex justify-center gap-3">
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold
              ${value[i] ? 'border-primary text-primary' : 'border-gray-300 text-gray-200'}`}
          >
            {value[i] ? '●' : '○'}
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {digits.map((d, i) => (
          d === '' ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => d === '⌫' ? backspace() : press(d)}
              className="h-16 rounded-2xl text-xl font-semibold bg-gray-100 active:bg-gray-200"
            >
              {d}
            </button>
          )
        ))}
      </div>

      <button
        onClick={onConfirm}
        disabled={value.length < 4 || disabled}
        className="w-full bg-primary text-white rounded-xl py-4 font-semibold text-lg disabled:opacity-40"
      >
        Confirm
      </button>
    </div>
  )
}
