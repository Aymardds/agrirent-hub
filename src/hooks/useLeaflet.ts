import { useEffect, useState } from 'react';

declare global {
  interface Window {
    L: any;
  }
}

export function useLeaflet() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If L is already defined globally, map is ready to go
    if (window.L) {
      setLoaded(true);
      return;
    }

    // Check if the stylesheet is already present
    let cssLink = document.querySelector('link[href*="leaflet.css"]');
    if (!cssLink) {
      cssLink = document.createElement('link');
      (cssLink as HTMLLinkElement).rel = 'stylesheet';
      (cssLink as HTMLLinkElement).href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      (cssLink as HTMLLinkElement).integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      (cssLink as HTMLLinkElement).crossOrigin = '';
      document.head.appendChild(cssLink);
    }

    // Check if script is already present or loading
    let jsScript = document.querySelector('script[src*="leaflet.js"]') as HTMLScriptElement | null;
    if (!jsScript) {
      jsScript = document.createElement('script');
      jsScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      jsScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      jsScript.crossOrigin = '';
      jsScript.async = true;
      
      jsScript.onload = () => {
        if (window.L) {
          setLoaded(true);
        } else {
          setError("Leaflet loaded but global object 'L' was not found");
        }
      };

      jsScript.onerror = () => {
        setError("Failed to load Leaflet script from CDN");
      };

      document.head.appendChild(jsScript);
    } else {
      // Script exists but maybe not loaded yet. Let's poll or wait
      const interval = setInterval(() => {
        if (window.L) {
          setLoaded(true);
          clearInterval(interval);
        }
      }, 100);

      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (!window.L) {
          setError("Timeout loading Leaflet from existing script tag");
        }
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, []);

  return { loaded, error };
}
