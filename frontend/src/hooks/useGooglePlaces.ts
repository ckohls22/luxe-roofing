'use client'

import { useState, useEffect } from 'react'
import { UseGooglePlacesReturn } from '@/types'

export const useGooglePlaces = (): UseGooglePlacesReturn => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsLoaded(true)
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
    if (!apiKey) {
      setError('Google API key is missing')
      setLoadError(true)
      return
    }

    const src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    const existingScript = document.querySelector(`script[src^="${src}"]`) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true))
      existingScript.addEventListener('error', () => {
        setError('Failed to load Google Places API')
        setLoadError(true)
      })
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.src = src

    script.onload = () => {
      if (window.google?.maps?.places) {
        setIsLoaded(true)
        setError(null)
      } else {
        setError('Google Places API failed to initialize')
        setLoadError(true)
      }
    }

    script.onerror = (e) => {
      console.error('Google Places API load failed:', e)
      setError('Failed to load Google Places API')
      setLoadError(true)
    }

    document.head.appendChild(script)

    // Optional cleanup
    return () => {
      // comment this out if script should persist across the app
      // if (script.parentNode) {
      //   script.parentNode.removeChild(script)
      // }
    }
  }, [])

  return { isLoaded, error, loadError }
}
