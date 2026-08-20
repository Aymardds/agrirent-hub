import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Play, Pause, Square, MapPin, RefreshCw, Save, AlertTriangle,
  PenLine, Navigation, Ruler, Crop, Timer, Signal, RotateCcw,
  History, X,
} from "lucide-react";
import { toast } from "sonner";
import { usePhoneGPS, type GPSPoint } from "@/hooks/usePhoneGPS";
import { useLeaflet } from "@/hooks/useLeaflet";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface GPSTrackerProps {
  isActive: boolean;
  onSave: (path: GPSPoint[], area: number) => void;
  initialPath?: GPSPoint[];
  /** Unique key to persist this session in localStorage (e.g. intervention id) */
  sessionKey?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

function formatDistance(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(2)} km`;
  return `${metres} m`;
}

function getAccuracyColor(acc: number | null): string {
  if (acc === null) return 'text-muted-foreground';
  if (acc <= 10) return 'text-emerald-600';
  if (acc <= 25) return 'text-amber-500';
  return 'text-red-500';
}

// ─── Map sub-component ────────────────────────────────────────────────────────

interface LiveMapProps {
  path: GPSPoint[];
  isTracking: boolean;
}

const LiveMap = ({ path, isTracking }: LiveMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const { loaded } = useLeaflet();

  // Initialise map once Leaflet is loaded
  useEffect(() => {
    if (!loaded || !mapContainerRef.current || mapRef.current) return;
    const L = window.L;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Polyline for the GPS path
    const polyline = L.polyline([], {
      color: '#16a34a',
      weight: 4,
      opacity: 0.85,
    }).addTo(map);

    // Pulsing marker for current position
    const pulseIcon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:20px;height:20px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:#16a34a;opacity:0.3;animation:pulse 1.5s infinite;"></div>
          <div style="position:absolute;inset:4px;border-radius:50%;background:#16a34a;border:2px solid white;"></div>
        </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker([0, 0], { icon: pulseIcon }).addTo(map);

    mapRef.current = map;
    polylineRef.current = polyline;
    markerRef.current = marker;

    // Default view if no path yet
    if (path.length > 0) {
      const last = path[path.length - 1];
      map.setView([last.lat, last.lng], 17);
    } else {
      map.setView([6.8, -5.3], 7); // Default: Côte d'Ivoire
    }

    return () => {
      map.remove();
      mapRef.current = null;
      polylineRef.current = null;
      markerRef.current = null;
    };
  }, [loaded]);

  // Update polyline & marker whenever path changes
  useEffect(() => {
    if (!mapRef.current || path.length === 0) return;
    const L = window.L;
    const latLngs = path.map(p => [p.lat, p.lng] as [number, number]);

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latLngs);
    }

    const last = path[path.length - 1];
    if (markerRef.current) {
      markerRef.current.setLatLng([last.lat, last.lng]);
    }

    if (isTracking) {
      mapRef.current.panTo([last.lat, last.lng], { animate: true, duration: 0.5 });
    } else if (path.length > 1 && polylineRef.current) {
      mapRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [20, 20] });
    }
  }, [path, isTracking]);

  // Invalidate size when map becomes visible
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 100);
    return () => clearTimeout(timeout);
  }, [loaded]);

  if (!loaded) {
    return (
      <div className="w-full h-[200px] rounded-xl bg-muted/40 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
        Chargement de la carte…
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[200px] rounded-xl overflow-hidden border border-border"
      style={{ zIndex: 0 }}
    />
  );
};

// ─── Main GPSTracker component ────────────────────────────────────────────────

export const GPSTracker = ({ isActive, onSave, initialPath = [], sessionKey }: GPSTrackerProps) => {
  const persistKey = sessionKey ? `phone_gps_${sessionKey}` : 'phone_gps';

  const gps = usePhoneGPS({ persistKey });

  // Load initialPath once on mount
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!loadedRef.current && initialPath.length > 0) {
      loadedRef.current = true;
      // If there's an initial path from DB, show it in a stopped state
    }
  }, [initialPath]);

  // ── Manual mode ──────────────────────────────────────────────────────────────
  const [manualMode, setManualMode] = useState(false);
  const [manualArea, setManualArea] = useState('');

  const handleSave = () => {
    onSave(gps.path, gps.metrics.areaHectares);
    toast.success('Données GPS enregistrées !');
  };

  const handleManualSave = () => {
    const parsed = parseFloat(manualArea);
    if (!parsed || parsed <= 0) {
      toast.error('Veuillez entrer une superficie valide');
      return;
    }
    onSave([], parsed);
    toast.success('Superficie enregistrée manuellement !');
  };

  const handleStart = () => {
    setManualMode(false);
    gps.start();
  };

  const handleReset = () => {
    gps.reset();
    setManualMode(false);
    setManualArea('');
    toast.info('Tracking GPS réinitialisé');
  };

  if (!isActive) return null;

  const showMap = (gps.hasPath || gps.isTracking) && !gps.errorCode && !manualMode;

  return (
    <Card className="p-4 mt-4 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-50/30">
      <style>{`
        @keyframes pulse {
          0%,100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      <div className="flex flex-col gap-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-primary" />
            Suivi GPS — Téléphone du Technicien
            {gps.isTracking && (
              <span className="flex items-center gap-1 text-xs font-normal text-emerald-600 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Actif
              </span>
            )}
          </h3>

          {gps.metrics.areaHectares > 0 && (
            <span className="text-sm font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
              {gps.metrics.areaHectares.toFixed(4)} ha
            </span>
          )}
        </div>

        {/* ── Restore banner ── */}
        {gps.hasRestorable && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <History className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">Une session GPS non sauvegardée a été retrouvée.</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100" onClick={gps.restore}>
                Restaurer
              </Button>
              <button onClick={gps.dismissRestore} className="text-amber-600 hover:text-amber-800">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Metrics grid ── */}
        {(gps.hasPath || gps.isTracking) && !manualMode && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Points */}
            <div className="flex items-center gap-2 bg-white/70 rounded-lg p-2 border border-border/50">
              <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Points GPS</p>
                <p className="text-xs font-bold">{gps.metrics.pointCount}</p>
              </div>
            </div>

            {/* Distance */}
            <div className="flex items-center gap-2 bg-white/70 rounded-lg p-2 border border-border/50">
              <Ruler className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Distance</p>
                <p className="text-xs font-bold">{formatDistance(gps.metrics.distanceMetres)}</p>
              </div>
            </div>

            {/* Area */}
            <div className="flex items-center gap-2 bg-white/70 rounded-lg p-2 border border-border/50">
              <Crop className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Superficie</p>
                <p className="text-xs font-bold">
                  {gps.metrics.pointCount >= 3 ? `${gps.metrics.areaHectares.toFixed(4)} ha` : '—'}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2 bg-white/70 rounded-lg p-2 border border-border/50">
              <Timer className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Durée</p>
                <p className="text-xs font-bold">{formatDuration(gps.metrics.durationSeconds)}</p>
              </div>
            </div>

            {/* Accuracy */}
            <div className="flex items-center gap-2 bg-white/70 rounded-lg p-2 border border-border/50">
              <Signal className={cn("w-3.5 h-3.5 flex-shrink-0", getAccuracyColor(gps.metrics.currentAccuracy))} />
              <div>
                <p className="text-[10px] text-muted-foreground">Précision</p>
                <p className={cn("text-xs font-bold", getAccuracyColor(gps.metrics.currentAccuracy))}>
                  {gps.metrics.currentAccuracy !== null ? `±${Math.round(gps.metrics.currentAccuracy)}m` : '—'}
                </p>
              </div>
            </div>

            {/* Coordinates */}
            {gps.metrics.currentLat !== null && (
              <div className="flex items-center gap-2 bg-white/70 rounded-lg p-2 border border-border/50">
                <Navigation className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Position</p>
                  <p className="text-[10px] font-bold font-mono leading-tight">
                    {gps.metrics.currentLat.toFixed(5)}<br />
                    {gps.metrics.currentLng?.toFixed(5)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Accuracy warning ── */}
        {gps.isTracking && gps.metrics.currentAccuracy !== null && gps.metrics.currentAccuracy > 20 && (
          <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Précision GPS faible (±{Math.round(gps.metrics.currentAccuracy)}m). Déplacez-vous à l'extérieur pour améliorer le signal.
          </div>
        )}

        {/* ── GPS Error state ── */}
        {gps.errorCode && !manualMode && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
            <div className="flex items-start gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                {gps.errorCode === 'unsupported' && (
                  <>
                    <p className="font-semibold">GPS non supporté</p>
                    <p className="text-red-700 mt-0.5 text-xs">
                      Votre navigateur ne supporte pas la géolocalisation. Utilisez Chrome ou Safari mobile.
                    </p>
                  </>
                )}
                {gps.errorCode === 'denied' && (
                  <>
                    <p className="font-semibold">Accès GPS refusé</p>
                    <p className="text-red-700 mt-0.5 text-xs">
                      Activez la localisation dans les paramètres de votre navigateur et rechargez la page.
                    </p>
                  </>
                )}
                {gps.errorCode === 'unavailable' && (
                  <>
                    <p className="font-semibold">Signal GPS indisponible</p>
                    <p className="text-red-700 mt-0.5 text-xs">
                      Vérifiez que le GPS est activé sur votre téléphone et que vous êtes à l'extérieur.
                    </p>
                  </>
                )}
                {gps.errorCode === 'timeout' && (
                  <>
                    <p className="font-semibold">Délai GPS expiré</p>
                    <p className="text-red-700 mt-0.5 text-xs">
                      Impossible d'obtenir une position dans le délai imparti. Réessayez à l'extérieur.
                    </p>
                  </>
                )}
                {gps.errorCode === 'unknown' && (
                  <>
                    <p className="font-semibold">Erreur GPS</p>
                    <p className="text-red-700 mt-0.5 text-xs">
                      Une erreur inconnue est survenue. Réessayez ou utilisez la saisie manuelle.
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => { gps.reset(); handleStart(); }}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Réessayer GPS
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 text-xs"
                onClick={() => setManualMode(true)}
              >
                <PenLine className="w-3 h-3 mr-1" />
                Saisie manuelle
              </Button>
            </div>
          </div>
        )}

        {/* ── Manual mode ── */}
        {manualMode && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
            <div className="text-sm text-blue-800 font-medium flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              Saisie manuelle de la superficie
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 2.5"
                value={manualArea}
                onChange={(e) => setManualArea(e.target.value)}
                className="flex-1 bg-white"
              />
              <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">hectares</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => { setManualMode(false); setManualArea(''); }}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleManualSave}
                disabled={!manualArea || parseFloat(manualArea) <= 0}
              >
                <Save className="w-4 h-4 mr-1" />
                Enregistrer
              </Button>
            </div>
          </div>
        )}

        {/* ── Live map ── */}
        {showMap && <LiveMap path={gps.path} isTracking={gps.isTracking} />}

        {/* ── Control buttons ── */}
        {!gps.errorCode && !manualMode && (
          <div className="flex gap-2 flex-wrap">
            {/* Start / Pause / Resume */}
            {gps.isIdle && (
              <Button
                size="sm"
                onClick={handleStart}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <Play className="w-4 h-4 mr-2" />
                {gps.isPaused ? 'Reprendre' : 'Démarrer le tracking'}
              </Button>
            )}

            {gps.isTracking && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={gps.pause}
                  className="flex-1"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={gps.stop}
                  className="flex-1"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Arrêter
                </Button>
              </>
            )}

            {gps.isPaused && (
              <>
                <Button size="sm" onClick={gps.resume} className="flex-1 bg-primary hover:bg-primary/90">
                  <Play className="w-4 h-4 mr-2" />
                  Reprendre
                </Button>
                <Button size="sm" variant="destructive" onClick={gps.stop} className="flex-1">
                  <Square className="w-4 h-4 mr-2" />
                  Terminer
                </Button>
              </>
            )}

            {/* Reset & Save (only when stopped or paused with data) */}
            {gps.canSave && (
              <>
                <Button size="sm" variant="outline" onClick={handleReset} title="Réinitialiser">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSave}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder dans la mission
                </Button>
              </>
            )}

            {/* Manual fallback link */}
            {gps.isIdle && !gps.hasPath && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground"
                onClick={() => setManualMode(true)}
              >
                <PenLine className="w-3 h-3 mr-1" />
                Saisie manuelle
              </Button>
            )}
          </div>
        )}

        {/* ── Status hint ── */}
        {gps.isTracking && (
          <p className="text-xs text-center text-muted-foreground">
            📱 GPS actif — Gardez l'application ouverte et déplacez-vous pour tracer votre parcours.
          </p>
        )}

        {gps.state === 'requesting' && (
          <p className="text-xs text-center text-muted-foreground animate-pulse">
            ⏳ En attente d'autorisation GPS…
          </p>
        )}
      </div>
    </Card>
  );
};
