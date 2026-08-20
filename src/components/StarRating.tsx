interface Props {
  onRate: (stars: number) => void
  onSkip: () => void
}

export default function StarRating({ onRate, onSkip }: Props) {
  return (
    <div className="text-center space-y-6">
      <div>
        <p className="font-semibold text-gray-800 text-lg">Rate this visitor</p>
        <p className="text-sm text-gray-500 mt-1">How engaged were they?</p>
      </div>
      <div className="flex justify-center gap-4">
        {[1,2,3,4,5].map(star => (
          <button
            key={star}
            onClick={() => onRate(star)}
            className="text-5xl active:scale-110 transition-transform"
          >
            ★
          </button>
        ))}
      </div>
      <button
        onClick={onSkip}
        className="text-sm text-gray-400 underline"
      >
        Skip
      </button>
    </div>
  )
}
