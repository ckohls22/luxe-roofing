// src/components/ui/Alert.tsx
// Alert component for displaying important messages

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  className?: string
}

/**
 * Alert component for displaying contextual messages
 * Supports different variants with appropriate styling
 */
export const Alert: React.FC<AlertProps> = ({ 
  variant = 'info', 
  title, 
  children, 
  className = '' 
}) => {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  }
  
  return (
    <div className={`border-l-4 p-4 ${variantClasses[variant]} ${className}`} role="alert">
      {title && <h4 className="font-medium mb-2">{title}</h4>}
      <div>{children}</div>
    </div>
  )
}