import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, Square, MapPin, RefreshCw, Save, AlertTriangle, PenLine } from "lucide-react";
import { toast } from "sonner";

interface GPSPoint {
    lat: number;
    lng: number;
    timestamp: number;
}

interface GPSTrackerProps {
    isActive: boolean;
    onSave: (path: GPSPoint[], area: number) => void;
    initialPath?: GPSPoint[];
}

export const GPSTracker = ({ isActive, onSave, initialPath = [] }: GPSTrackerProps) => {
    const [isTracking, setIsTracking] = useState(false);
    const [path, setPath] = useState<GPSPoint[]>(initialPath || []);
    const [area, setArea] = useState<number>(0);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [manualMode, setManualMode] = useState(false);
    const [manualArea, setManualArea] = useState('');
    const watchId = useRef<number | null>(null);

    // Calculate area in hectares using Shoelace formula
    const calculateArea = (points: GPSPoint[]) => {
        if (points.length < 3) return 0;

        let area = 0;
        const R = 6371007.2; // Radius of earth in meters

        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;

            const p1 = points[i];
            const p2 = points[j];

            // Convert to radians
            const lat1 = p1.lat * (Math.PI / 180);
            const lat2 = p2.lat * (Math.PI / 180);
            const lng1 = p1.lng * (Math.PI / 180);
            const lng2 = p2.lng * (Math.PI / 180);

            // Spherical excess formula (simplified for small areas) or local projection
            // Using simple local Cartesian approximation which is good enough for fields
            const x1 = R * lng1 * Math.cos(lat1);
            const y1 = R * lat1;
            const x2 = R * lng2 * Math.cos(lat2);
            const y2 = R * lat2;

            area += (x1 * y2) - (x2 * y1);
        }

        return Math.abs(area / 2) / 10000; // Convert m² to hectares
    };

    const startTracking = () => {
        if (!navigator.geolocation) {
            setGpsError("not_supported");
            toast.error("La géolocalisation n'est pas supportée par votre navigateur");
            return;
        }

        setGpsError(null);
        setIsTracking(true);
        watchId.current = navigator.geolocation.watchPosition(
            (position) => {
                const newPoint = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    timestamp: position.timestamp
                };

                setPath(prev => {
                    const newPath = [...prev, newPoint];
                    return newPath;
                });
            },
            (error) => {
                console.error(error);
                setIsTracking(false);

                if (error.code === error.PERMISSION_DENIED) {
                    setGpsError("denied");
                    toast.error("Accès GPS refusé. Vous pouvez saisir la superficie manuellement.");
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    setGpsError("unavailable");
                    toast.error("Position GPS indisponible. Vous pouvez saisir la superficie manuellement.");
                } else if (error.code === error.TIMEOUT) {
                    setGpsError("timeout");
                    toast.error("Délai GPS expiré. Réessayez ou saisissez la superficie manuellement.");
                } else {
                    setGpsError("unknown");
                    toast.error("Erreur GPS. Vous pouvez saisir la superficie manuellement.");
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const stopTracking = () => {
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        setIsTracking(false);
        const calculatedArea = calculateArea(path);
        setArea(calculatedArea);
    };

    const resetTracking = () => {
        setPath([]);
        setArea(0);
        setGpsError(null);
        setManualMode(false);
        setManualArea('');
        if (isTracking) stopTracking();
    };

    const handleSave = () => {
        const finalArea = area || calculateArea(path);
        onSave(path, finalArea);
    };

    const handleManualSave = () => {
        const parsed = parseFloat(manualArea);
        if (!parsed || parsed <= 0) {
            toast.error("Veuillez entrer une superficie valide");
            return;
        }
        setArea(parsed);
        onSave([], parsed);
    };

    // Calculate area periodically or when stopped
    useEffect(() => {
        if (path.length > 2) {
            setArea(calculateArea(path));
        }
    }, [path.length]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
            }
        };
    }, []);

    if (!isActive) return null;

    return (
        <Card className="p-4 mt-4 bg-muted/30 border-dashed">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        Suivi GPS de la Mission
                    </h3>
                    {(path.length > 0 || area > 0) && (
                        <span className="text-sm font-bold bg-primary/10 px-2 py-1 rounded text-primary">
                            {area.toFixed(4)} ha
                        </span>
                    )}
                </div>

                {path.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                        {path.length} points enregistrés
                    </div>
                )}

                {/* GPS Error / Permission Denied State */}
                {gpsError && !manualMode && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                        <div className="flex items-start gap-2 text-amber-800">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                {gpsError === 'denied' ? (
                                    <>
                                        <p className="font-medium">Accès GPS refusé</p>
                                        <p className="text-amber-700 mt-1">
                                            Activez la localisation dans les paramètres de votre navigateur, puis réessayez.
                                        </p>
                                    </>
                                ) : gpsError === 'unavailable' ? (
                                    <>
                                        <p className="font-medium">Signal GPS indisponible</p>
                                        <p className="text-amber-700 mt-1">
                                            Vérifiez que le GPS est activé sur votre appareil et réessayez.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-medium">Erreur GPS</p>
                                        <p className="text-amber-700 mt-1">
                                            Impossible d'obtenir votre position. Réessayez ou saisissez la superficie manuellement.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline" onClick={() => { setGpsError(null); startTracking(); }} className="flex-1 text-xs">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Réessayer GPS
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setManualMode(true)} className="flex-1 text-xs">
                                <PenLine className="w-3 h-3 mr-1" />
                                Saisie manuelle
                            </Button>
                        </div>
                    </div>
                )}

                {/* Manual Area Input Mode */}
                {manualMode && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
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
                            <Button size="sm" variant="outline" onClick={() => { setManualMode(false); setManualArea(''); }} className="flex-1">
                                Annuler
                            </Button>
                            <Button size="sm" onClick={handleManualSave} className="flex-1 bg-success hover:bg-success/90" disabled={!manualArea || parseFloat(manualArea) <= 0}>
                                <Save className="w-4 h-4 mr-1" />
                                Enregistrer
                            </Button>
                        </div>
                    </div>
                )}

                {/* Normal GPS Controls (hidden when in error or manual mode) */}
                {!gpsError && !manualMode && (
                    <div className="flex gap-2">
                        {!isTracking ? (
                            <Button size="sm" onClick={startTracking} className="flex-1" variant={path.length > 0 ? "secondary" : "default"}>
                                <Play className="w-4 h-4 mr-2" />
                                {path.length > 0 ? "Reprendre" : "Démarrer"}
                            </Button>
                        ) : (
                            <Button size="sm" onClick={stopTracking} variant="destructive" className="flex-1 animate-pulse">
                                <Pause className="w-4 h-4 mr-2" />
                                Arrêter
                            </Button>
                        )}

                        {path.length > 0 && !isTracking && (
                            <>
                                <Button size="sm" onClick={resetTracking} variant="outline">
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                                <Button size="sm" onClick={handleSave} className="bg-success hover:bg-success/90">
                                    <Save className="w-4 h-4 mr-2" />
                                    Enregistrer
                                </Button>
                            </>
                        )}
                    </div>
                )}

                {isTracking && (
                    <div className="p-2 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200">
                        GPS Actif - Déplacez-vous pour tracer le contour de votre intervention.
                    </div>
                )}
            </div>
        </Card>
    );
};
