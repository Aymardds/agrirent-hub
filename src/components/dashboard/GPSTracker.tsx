import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Square, MapPin, RefreshCw, Save } from "lucide-react";
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
            toast.error("La géolocalisation n'est pas supportée par votre navigateur");
            return;
        }

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
                toast.error("Erreur de géolocalisation: " + error.message);
                setIsTracking(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
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
        if (isTracking) stopTracking();
    };

    const handleSave = () => {
        const finalArea = area || calculateArea(path);
        onSave(path, finalArea);
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
                    {path.length > 0 && (
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

                {isTracking && (
                    <div className="p-2 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200">
                        GPS Actif - Déplacez-vous pour tracer le contour de votre intervention.
                    </div>
                )}
            </div>
        </Card>
    );
};
