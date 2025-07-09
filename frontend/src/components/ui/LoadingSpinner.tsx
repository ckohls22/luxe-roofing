/**
 * Simple loading spinner component
 */
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses =
    size === 'sm'
      ? 'w-4 h-4 border-2'
      : size === 'lg'
      ? 'w-10 h-10 border-4'
      : 'w-6 h-6 border-2'

  return (
    <span
      className={`inline-block animate-spin rounded-full border-gray-300 border-t-amber-500 ${sizeClasses}`}
      role="status"
      aria-label="Loading"
    />
  )
}