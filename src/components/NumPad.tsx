interface Props {
  value: string
  onChange: (val: string) => void
  onConfirm: () => void
  error?: string
}

export default function NumPad({ value, onChange, onConfirm, error }: Props) {
  function press(digit: string) {
    if (value.length < 4) onChange(value + digit)
  }

  function backspace() {
    onChange(value.slice(0, -1))
  }

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
          <button
            key={i}
            onClick={() => d === '⌫' ? backspace() : d ? press(d) : undefined}
            className={`h-16 rounded-2xl text-xl font-semibold
              ${d === '' ? 'invisible' : 'bg-gray-100 active:bg-gray-200'}`}
          >
            {d}
          </button>
        ))}
      </div>

      <button
        onClick={onConfirm}
        disabled={value.length < 4}
        className="w-full bg-primary text-white rounded-xl py-4 font-semibold text-lg disabled:opacity-40"
      >
        Confirm
      </button>
    </div>
  )
}
