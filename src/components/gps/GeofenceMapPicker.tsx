import { useEffect, useRef, useState } from "react";
import { useLeaflet } from "@/hooks/useLeaflet";
import { MapPin, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GeofenceMapPickerProps {
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  onChange?: (lat: number, lng: number, radiusKm: number) => void;
}

export const GeofenceMapPicker = ({
  centerLat = 6.8276,
  centerLng = -5.2893,
  radiusKm = 5,
  onChange,
}: GeofenceMapPickerProps) => {
  const { loaded } = useLeaflet();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const [lat, setLat] = useState(centerLat);
  const [lng, setLng] = useState(centerLng);
  const [radius, setRadius] = useState(radiusKm);

  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstance.current) return;

    const L = window.L;
    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([lat, lng], 10);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(mapInstance.current);

    // Custom pin icon
    const pinIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg text-white text-xs">📍</div>`,
      className: "geofence-pin",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    markerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(mapInstance.current);
    circleRef.current = L.circle([lat, lng], {
      radius: radius * 1000,
      color: "#2563eb",
      fillColor: "#93c5fd",
      fillOpacity: 0.2,
      weight: 2,
      dashArray: "6 4",
    }).addTo(mapInstance.current);

    // Click on map to move pin
    mapInstance.current.on("click", (e: any) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      setLat(parseFloat(newLat.toFixed(6)));
      setLng(parseFloat(newLng.toFixed(6)));
      markerRef.current.setLatLng([newLat, newLng]);
      circleRef.current.setLatLng([newLat, newLng]);
      onChange?.(newLat, newLng, radius);
    });

    // Drag marker
    markerRef.current.on("dragend", (e: any) => {
      const pos = e.target.getLatLng();
      setLat(parseFloat(pos.lat.toFixed(6)));
      setLng(parseFloat(pos.lng.toFixed(6)));
      circleRef.current.setLatLng([pos.lat, pos.lng]);
      onChange?.(pos.lat, pos.lng, radius);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [loaded]);

  // Update circle radius when slider changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius * 1000);
    }
    onChange?.(lat, lng, radius);
  }, [radius]);

  const handleZoom = (dir: "in" | "out") => {
    if (!mapInstance.current) return;
    dir === "in" ? mapInstance.current.zoomIn() : mapInstance.current.zoomOut();
  };

  return (
    <div className="space-y-3">
      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-border h-52">
        {!loaded ? (
          <div className="flex items-center justify-center h-full bg-muted text-sm text-muted-foreground">
            Chargement de la carte...
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full z-0" />
        )}

        {/* Zoom controls */}
        {loaded && (
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
            <Button size="icon" variant="secondary" className="w-7 h-7 shadow" onClick={() => handleZoom("in")}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="secondary" className="w-7 h-7 shadow" onClick={() => handleZoom("out")}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Hint */}
        <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur text-[10px] text-muted-foreground px-2 py-1 rounded-md border shadow-sm flex items-center gap-1">
          <MapPin className="w-3 h-3 text-primary" />
          Cliquez sur la carte ou faites glisser l'épingle
        </div>
      </div>

      {/* Coordinates + radius */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Latitude</Label>
          <Input
            value={lat}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                setLat(val);
                markerRef.current?.setLatLng([val, lng]);
                circleRef.current?.setLatLng([val, lng]);
                mapInstance.current?.setView([val, lng]);
                onChange?.(val, lng, radius);
              }
            }}
            className="h-8 text-xs font-mono"
            placeholder="6.8276"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Longitude</Label>
          <Input
            value={lng}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                setLng(val);
                markerRef.current?.setLatLng([lat, val]);
                circleRef.current?.setLatLng([lat, val]);
                mapInstance.current?.setView([lat, val]);
                onChange?.(lat, val, radius);
              }
            }}
            className="h-8 text-xs font-mono"
            placeholder="-5.2893"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Rayon (km)</Label>
          <Input
            type="number"
            min={0.1}
            max={50}
            step={0.5}
            value={radius}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) setRadius(val);
            }}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Slider for radius */}
      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>0.1 km</span>
          <span className="font-medium text-foreground">Zone : {radius} km</span>
          <span>50 km</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={50}
          step={0.5}
          value={radius}
          onChange={(e) => setRadius(parseFloat(e.target.value))}
          className="w-full accent-primary h-1.5 rounded"
        />
      </div>
    </div>
  );
};
