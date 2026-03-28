function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function SegmentedBar({
  value,
  max,
  segments = 10,
  className,
}: {
  value: number
  max: number
  segments?: number
  className?: string
}) {
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max))
  const filled = Math.floor(ratio * segments)
  const partial = ratio * segments - filled

  return (
    <div className={cx('flex gap-1', className)} aria-hidden>
      {Array.from({ length: segments }).map((_, idx) => {
        const isFilled = idx < filled
        const isPartial = idx === filled && partial > 0 && filled < segments
        return (
          <div
            key={`seg-${idx}`}
            className={cx(
              'h-3 flex-1 rounded-sm bg-zinc-200/70 dark:bg-zinc-800/70',
              isFilled && 'bg-gradient-to-r from-indigo-500 to-fuchsia-500',
              isPartial && 'bg-gradient-to-r from-indigo-500/70 to-zinc-200/60 dark:to-zinc-800/70'
            )}
          />
        )
      })}
    </div>
  )
}
