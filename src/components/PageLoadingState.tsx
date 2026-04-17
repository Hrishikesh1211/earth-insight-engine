import { LoadingScreen } from './LoadingScreen'

export function PageLoadingState({ className = '' }: { className?: string }) {
  return <LoadingScreen className={className} />
}
