interface Props {
  visited: number
  total: number
}

export default function HallProgress({ visited, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((visited / total) * 100)
  return (
    <div className="bg-primary/10 rounded-xl p-3">
      <div className="flex justify-between text-xs font-medium text-primary mb-1">
        <span>Halls visited</span>
        <span>{visited} / {total}</span>
      </div>
      <div className="bg-white rounded-full h-2">
        <div
          className="bg-primary rounded-full h-2 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
