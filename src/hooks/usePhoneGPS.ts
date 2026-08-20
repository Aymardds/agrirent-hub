import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy: number; // metres
}

export type GPSTrackingState = 'idle' | 'requesting' | 'tracking' | 'paused' | 'stopped';

export type GPSErrorCode = 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'unknown';

export interface GPSMetrics {
  pointCount: number;
  distanceMetres: number;
  areaHectares: number;
  durationSeconds: number;
  currentAccuracy: number | null;
  currentLat: number | null;
  currentLng: number | null;
}

export interface UsePhoneGPSOptions {
  /** Maximum accuracy (metres) — points less accurate than this are ignored. Default 50 */
  maxAccuracy?: number;
  /** Interval in ms between each watchPosition update. Default 2000 */
  interval?: number;
  /** localStorage key prefix for auto-restore. Pass null to disable. Default 'phone_gps' */
  persistKey?: string | null;
}

// ─── Haversine distance between two lat/lng points ────────────────────────────
function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371007.2;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Shoelace formula for area in hectares ────────────────────────────────────
function shoelaceHectares(points: GPSPoint[]): number {
  if (points.length < 3) return 0;
  const R = 6371007.2;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const lat1 = (points[i].lat * Math.PI) / 180;
    const lat2 = (points[j].lat * Math.PI) / 180;
    const lng1 = (points[i].lng * Math.PI) / 180;
    const lng2 = (points[j].lng * Math.PI) / 180;
    const x1 = R * lng1 * Math.cos(lat1);
    const y1 = R * lat1;
    const x2 = R * lng2 * Math.cos(lat2);
    const y2 = R * lat2;
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2) / 10000; // m² → hectares
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const STORAGE_VERSION = 1;

export function usePhoneGPS(options: UsePhoneGPSOptions = {}) {
  const { maxAccuracy = 50, interval = 2000, persistKey = 'phone_gps' } = options;

  const [state, setState] = useState<GPSTrackingState>('idle');
  const [path, setPath] = useState<GPSPoint[]>([]);
  const [errorCode, setErrorCode] = useState<GPSErrorCode | null>(null);
  const [metrics, setMetrics] = useState<GPSMetrics>({
    pointCount: 0,
    distanceMetres: 0,
    areaHectares: 0,
    durationSeconds: 0,
    currentAccuracy: null,
    currentLat: null,
    currentLng: null,
  });
  const [hasRestorable, setHasRestorable] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathRef = useRef<GPSPoint[]>([]); // shadow for callbacks without stale closure

  // ── Sync pathRef whenever path changes ──────────────────────────────────────
  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  // ── Recompute metrics whenever path changes ──────────────────────────────────
  useEffect(() => {
    const pts = path;
    if (pts.length === 0) return;

    const last = pts[pts.length - 1];
    let dist = 0;
    for (let i = 1; i < pts.length; i++) {
      dist += haversineMetres(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
    }
    const area = shoelaceHectares(pts);
    const elapsed = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;

    setMetrics(prev => ({
      pointCount: pts.length,
      distanceMetres: Math.round(dist),
      areaHectares: area,
      durationSeconds: elapsed,
      currentAccuracy: last.accuracy,
      currentLat: last.lat,
      currentLng: last.lng,
    }));
  }, [path]);

  // ── Check localStorage for a restorable session ──────────────────────────────
  useEffect(() => {
    if (!persistKey) return;
    try {
      const raw = localStorage.getItem(`${persistKey}_session`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.v === STORAGE_VERSION && Array.isArray(parsed.path) && parsed.path.length > 0) {
          setHasRestorable(true);
        }
      }
    } catch (_) {}
  }, [persistKey]);

  // ── Persist path to localStorage whenever it changes ─────────────────────────
  useEffect(() => {
    if (!persistKey || path.length === 0) return;
    try {
      localStorage.setItem(
        `${persistKey}_session`,
        JSON.stringify({ v: STORAGE_VERSION, path, savedAt: Date.now() })
      );
    } catch (_) {}
  }, [path, persistKey]);

  // ── Elapsed timer ─────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setMetrics(prev => ({ ...prev, durationSeconds: elapsed }));
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Core watch logic ──────────────────────────────────────────────────────────
  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorCode('unsupported');
      setState('idle');
      return;
    }

    setState('requesting');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Filter out low-accuracy points
        if (accuracy > maxAccuracy) return;

        const newPoint: GPSPoint = {
          lat: latitude,
          lng: longitude,
          timestamp: position.timestamp,
          accuracy,
        };

        setPath(prev => [...prev, newPoint]);
        setState('tracking');
        setErrorCode(null);
      },
      (error) => {
        stopWatch();
        setState(prev => (prev === 'requesting' ? 'idle' : 'stopped'));

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorCode('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorCode('unavailable');
            break;
          case error.TIMEOUT:
            setErrorCode('timeout');
            break;
          default:
            setErrorCode('unknown');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  }, [maxAccuracy]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // ── Public actions ────────────────────────────────────────────────────────────

  const start = useCallback(() => {
    setErrorCode(null);
    startTimeRef.current = Date.now();
    startWatch();
    startTimer();
  }, [startWatch, startTimer]);

  const pause = useCallback(() => {
    stopWatch();
    stopTimer();
    setState('paused');
  }, [stopWatch, stopTimer]);

  const resume = useCallback(() => {
    startWatch();
    startTimer();
  }, [startWatch, startTimer]);

  const stop = useCallback(() => {
    stopWatch();
    stopTimer();
    setState('stopped');
  }, [stopWatch, stopTimer]);

  const reset = useCallback(() => {
    stopWatch();
    stopTimer();
    setState('idle');
    setPath([]);
    setErrorCode(null);
    startTimeRef.current = null;
    setMetrics({
      pointCount: 0,
      distanceMetres: 0,
      areaHectares: 0,
      durationSeconds: 0,
      currentAccuracy: null,
      currentLat: null,
      currentLng: null,
    });
    if (persistKey) {
      try { localStorage.removeItem(`${persistKey}_session`); } catch (_) {}
    }
  }, [stopWatch, stopTimer, persistKey]);

  const restore = useCallback(() => {
    if (!persistKey) return;
    try {
      const raw = localStorage.getItem(`${persistKey}_session`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.v === STORAGE_VERSION && Array.isArray(parsed.path)) {
        setPath(parsed.path);
        setHasRestorable(false);
        setState('paused');
      }
    } catch (_) {}
  }, [persistKey]);

  const dismissRestore = useCallback(() => {
    setHasRestorable(false);
    if (persistKey) {
      try { localStorage.removeItem(`${persistKey}_session`); } catch (_) {}
    }
  }, [persistKey]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopWatch();
      stopTimer();
    };
  }, [stopWatch, stopTimer]);

  // ── Derived helpers ───────────────────────────────────────────────────────────
  const isTracking = state === 'tracking';
  const isPaused = state === 'paused';
  const isStopped = state === 'stopped';
  const isIdle = state === 'idle' || state === 'requesting';
  const hasPath = path.length > 0;
  const canSave = (isStopped || isPaused) && hasPath;

  return {
    // State
    state,
    path,
    errorCode,
    metrics,
    hasRestorable,

    // Derived booleans
    isTracking,
    isPaused,
    isStopped,
    isIdle,
    hasPath,
    canSave,

    // Actions
    start,
    pause,
    resume,
    stop,
    reset,
    restore,
    dismissRestore,
  };
}
