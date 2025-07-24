// googleMapsLoader.ts - Global script loader
let isLoaded = false;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    google: typeof google;
  }
}

export const loadGoogleMaps = (apiKey: string): Promise<void> => {
  if (isLoaded && window.google?.maps) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    if (isLoaded && window.google?.maps) {
      resolve();
      return;
    }

    // Check if script already exists
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      // Wait for existing script to load
      const checkLoaded = () => {
        if (window.google?.maps) {
          isLoaded = true;
          isLoading = false;
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    isLoading = true;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
    script.async = true;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      loadPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

export const isGoogleMapsLoaded = () => isLoaded && !!window.google?.maps;