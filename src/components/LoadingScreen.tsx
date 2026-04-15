export function LoadingScreen({ className = '' }: { className?: string }) {
  return (
    <div className={`loading-screen ${className}`} role="status" aria-live="polite">
      <span className="loading-screen__pulse" aria-hidden="true" />
      <p>Analyzing Global Events...</p>
    </div>
  )
}
