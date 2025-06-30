declare global {
  interface Window {
    initMap: () => void;
  }
}

let googleMapsPromise: Promise<void>;

export const loadGoogleMapsApi = () => {
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve) => {
      window.initMap = () => {
        resolve();
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    });
  }
  return googleMapsPromise;
};
