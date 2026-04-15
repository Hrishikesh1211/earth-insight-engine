type LiveDataPulseProps = {
  label?: string
}

export function LiveDataPulse({
  label = 'Live NASA EONET feed online',
}: LiveDataPulseProps) {
  return (
    <p className="live-data-pulse" aria-label={label}>
      <span className="live-data-pulse__indicator" aria-hidden="true">
        <span className="live-data-pulse__ring" />
        <span className="live-data-pulse__ring live-data-pulse__ring--delay" />
        <span className="live-data-pulse__dot" />
      </span>
      <span>{label}</span>
    </p>
  )
}
