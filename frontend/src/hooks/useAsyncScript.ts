// src/hooks/useAsyncScript.ts
// Generic hook for loading external scripts asynchronously

import { useState, useEffect } from 'react'

interface UseAsyncScriptOptions {
  removeOnUnmount?: boolean
  onLoad?: () => void
  onError?: (error: Event) => void
}

interface UseAsyncScriptReturn {
  loading: boolean
  error: boolean
  loaded: boolean
}

/**
 * Custom hook for loading external scripts asynchronously
 * Provides loading states and error handling
 */
export const useAsyncScript = (
  src: string, 
  options: UseAsyncScriptOptions = {}
): UseAsyncScriptReturn => {
  const { removeOnUnmount = true, onLoad, onError } = options
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`)
    if (existingScript) {
      setLoading(false)
      setLoaded(true)
      return
    }

    // Create and configure script element
    const script = document.createElement('script')
    script.src = src
    script.async = true

    const handleLoad = () => {
      setLoading(false)
      setLoaded(true)
      setError(false)
      onLoad?.()
    }

    const handleError = (event: Event) => {
      setLoading(false)
      setError(true)
      setLoaded(false)
      onError?.(event)
    }

    script.addEventListener('load', handleLoad)
    script.addEventListener('error', handleError)

    // Add script to document
    document.head.appendChild(script)

    // Cleanup function
    return () => {
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
      
      if (removeOnUnmount && script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [src, removeOnUnmount, onLoad, onError])

  return { loading, error, loaded }
}