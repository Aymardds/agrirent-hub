import { useEffect, useRef, useState } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useLeaflet } from "@/hooks/useLeaflet";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Tractor, 
  MapPin, 
  Search, 
  Wifi, 
  Navigation, 
  NavigationOff, 
  RotateCcw, 
  Play, 
  Square,
  Activity,
  Layers,
  Wrench,
  User,
  Calendar,
  Layers2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Dictionary of city coordinates in Côte d'Ivoire
const locationCoordinates: Record<string, { lat: number; lng: number }> = {
  "Abidjan": { lat: 5.3600, lng: -4.0083 },
  "Yamoussoukro": { lat: 6.8276, lng: -5.2893 },
  "Bouaké": { lat: 7.6939, lng: -5.0303 },
  "Korhogo": { lat: 9.4580, lng: -5.6290 },
  "San Pedro": { lat: 4.7485, lng: -6.6363 },
  "Daloa": { lat: 6.8773, lng: -6.4502 },
  "Man": { lat: 7.4125, lng: -7.5538 },
  "Gagnoa": { lat: 6.1319, lng: -5.9507 }
};

// Spread coordinates slightly for overlapping locations
const getCoordinates = (locationText: string, index = 0) => {
  const normalized = locationText.trim();
  for (const key in locationCoordinates) {
    if (normalized.toLowerCase().includes(key.toLowerCase())) {
      const coords = locationCoordinates[key];
      return {
        lat: coords.lat + (index % 5 - 2) * 0.006,
        lng: coords.lng + (Math.floor(index / 5) % 5 - 2) * 0.006
      };
    }
  }
  
  // Default centered around Yamoussoukro with some spread
  return {
    lat: 6.8276 + (index % 5 - 2) * 0.02,
    lng: -5.2893 + (Math.floor(index / 5) % 5 - 2) * 0.02
  };
};

interface Equipment {
  id: string;
  name: string;
  category: string;
  status: 'available' | 'rented' | 'maintenance';
  location: string;
  price: number;
  image_url?: string;
  owner?: {
    full_name: string;
  };
}

interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

const Fleet = () => {
  const { loaded: leafletReady, error: leafletError } = useLeaflet();
  const { profile } = useAuth();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  
  // Map References
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylinesRef = useRef<Record<string, any>>({});
  
  // Tablet GPS Tracking State
  const [tabletTracking, setTabletTracking] = useState(false);
  const [tabletPath, setTabletPath] = useState<GPSPoint[]>([]);
  const tabletWatchId = useRef<number | null>(null);
  const tabletMarkerRef = useRef<any>(null);
  const tabletCircleRef = useRef<any>(null);
  const tabletPolylineRef = useRef<any>(null);

  // Simulation Tracking State
  const [simulating, setSimulating] = useState(false);
  const [simulatedPath, setSimulatedPath] = useState<GPSPoint[]>([]);
  const simulationInterval = useRef<any>(null);
  const simMarkerRef = useRef<any>(null);
  const simPolylineRef = useRef<any>(null);

  // Fetch Fleet Equipment
  const fetchFleet = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("equipment")
        .select(`
          *,
          owner:owner_id (full_name)
        `)
        .order("name", { ascending: true });

      if (error) throw error;
      setEquipmentList(data as any[]);
    } catch (err: any) {
      toast.error("Erreur de chargement de la flotte : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstance.current) return;

    const L = window.L;
    // Set up map centered in Yamoussoukro
    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false // custom position later
    }).setView([6.8276, -5.2893], 8);

    // Modern light map tiles (CartoDB Positron) for premium aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CartoDB',
      maxZoom: 20
    }).addTo(mapInstance.current);

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [leafletReady]);

  // Update Markers on Map when Equipment List or Search Query changes
  useEffect(() => {
    if (!leafletReady || !mapInstance.current) return;

    const L = window.L;
    
    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    // Filter equipment
    const filtered = equipmentList.filter(eq => 
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.forEach((eq, index) => {
      const coords = getCoordinates(eq.location, index);

      // Pulse color based on status
      const statusColor = 
        eq.status === 'available' ? 'bg-success' : 
        eq.status === 'rented' ? 'bg-secondary' : 'bg-destructive';

      const pulseClass = 
        eq.status === 'available' ? 'bg-success/30' : 
        eq.status === 'rented' ? 'bg-secondary/30' : 'bg-destructive/30';

      const markerHtml = `
        <div class="relative flex items-center justify-center w-10 h-10">
          <div class="absolute inset-0 rounded-full animate-ping ${pulseClass}"></div>
          <div class="relative w-8 h-8 rounded-full ${statusColor} border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-semibold transition-transform hover:scale-110">
            ${eq.category.toLowerCase().includes('tract') ? '🚜' : '🌾'}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-fleet-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: customIcon })
        .addTo(mapInstance.current);

      // Bind dynamic HTML popup
      const statusText = 
        eq.status === 'available' ? 'Disponible' : 
        eq.status === 'rented' ? 'En location' : 'En maintenance';

      const statusBadgeColor = 
        eq.status === 'available' ? 'text-green-700 bg-green-50 border-green-200' : 
        eq.status === 'rented' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200';

      const popupHtml = `
        <div class="p-3 max-w-sm space-y-2 font-sans">
          <div class="flex items-center justify-between border-b pb-1 gap-4">
            <h4 class="font-bold text-foreground text-sm">${eq.name}</h4>
            <span class="text-xs px-2 py-0.5 rounded border font-medium ${statusBadgeColor}">${statusText}</span>
          </div>
          <div class="space-y-1 text-xs text-muted-foreground">
            <p><strong class="text-foreground">Catégorie:</strong> ${eq.category}</p>
            <p><strong class="text-foreground">Ville:</strong> ${eq.location}</p>
            <p><strong class="text-foreground">Prix:</strong> ${eq.price.toLocaleString()} FCFA/jour</p>
            ${eq.owner ? `<p><strong class="text-foreground">Propriétaire:</strong> ${eq.owner.full_name}</p>` : ''}
          </div>
          <div class="pt-2 text-center">
            <button 
              id="popup-select-btn-${eq.id}"
              class="w-full text-xs font-semibold bg-primary text-white py-1.5 px-3 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              Sélectionner la machine
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false });
      
      // Select equipment on marker click
      marker.on('click', () => {
        setSelectedEquip(eq);
      });

      // Handle button inside popup
      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-select-btn-${eq.id}`);
        if (btn) {
          btn.onclick = () => {
            setSelectedEquip(eq);
            mapInstance.current.closePopup();
          };
        }
      });

      markersRef.current[eq.id] = marker;
    });

    // Adjust map view to fit markers if they exist
    if (filtered.length > 0) {
      const points = filtered.map((eq, i) => {
        const coords = getCoordinates(eq.location, i);
        return [coords.lat, coords.lng];
      });
      mapInstance.current.fitBounds(points, { padding: [50, 50], maxZoom: 12 });
    }

  }, [equipmentList, searchQuery, leafletReady]);

  // Handle fly to selected equipment
  const selectEquipment = (eq: Equipment) => {
    setSelectedEquip(eq);
    const index = equipmentList.findIndex(item => item.id === eq.id);
    const coords = getCoordinates(eq.location, index);
    if (mapInstance.current) {
      mapInstance.current.flyTo([coords.lat, coords.lng], 13, {
        animate: true,
        duration: 1.5
      });
      
      // Open marker popup
      const marker = markersRef.current[eq.id];
      if (marker) {
        setTimeout(() => marker.openPopup(), 1500);
      }
    }
  };

  // 1. Tablet GPS Live Tracking
  const toggleTabletTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Votre appareil ne supporte pas la géolocalisation");
      return;
    }

    const L = window.L;

    if (tabletTracking) {
      // Turn OFF tracking
      if (tabletWatchId.current !== null) {
        navigator.geolocation.clearWatch(tabletWatchId.current);
        tabletWatchId.current = null;
      }
      setTabletTracking(false);
      
      // Clean up layers
      if (tabletMarkerRef.current) {
        tabletMarkerRef.current.remove();
        tabletMarkerRef.current = null;
      }
      if (tabletCircleRef.current) {
        tabletCircleRef.current.remove();
        tabletCircleRef.current = null;
      }
      if (tabletPolylineRef.current) {
        tabletPolylineRef.current.remove();
        tabletPolylineRef.current = null;
      }
      setTabletPath([]);
      toast.success("Suivi GPS de la tablette arrêté");
    } else {
      // Turn ON tracking
      setTabletTracking(true);
      toast.info("Initialisation du GPS de la tablette...");

      tabletWatchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng, accuracy } = pos.coords;
          const newPoint: GPSPoint = { lat, lng, timestamp: pos.timestamp };

          setTabletPath(prev => {
            const nextPath = [...prev, newPoint];

            // Draw/Update Polyline
            if (mapInstance.current) {
              if (tabletPolylineRef.current) {
                tabletPolylineRef.current.setLatLngs(nextPath.map(p => [p.lat, p.lng]));
              } else {
                tabletPolylineRef.current = L.polyline(nextPath.map(p => [p.lat, p.lng]), {
                  color: '#2563eb', // Blue line
                  weight: 4,
                  opacity: 0.8,
                  dashArray: '5, 10'
                }).addTo(mapInstance.current);
              }
            }
            return nextPath;
          });

          // Draw/Update Marker and accuracy circle
          if (mapInstance.current) {
            const tabletHtml = `
              <div class="relative flex items-center justify-center w-8 h-8">
                <div class="absolute inset-0 bg-blue-500/30 rounded-full animate-ping"></div>
                <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white">
                  📱
                </div>
              </div>
            `;
            const tabletIcon = L.divIcon({
              html: tabletHtml,
              className: 'tablet-gps-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });

            if (tabletMarkerRef.current) {
              tabletMarkerRef.current.setLatLng([lat, lng]);
            } else {
              tabletMarkerRef.current = L.marker([lat, lng], { icon: tabletIcon }).addTo(mapInstance.current);
            }

            if (tabletCircleRef.current) {
              tabletCircleRef.current.setLatLng([lat, lng]).setRadius(accuracy);
            } else {
              tabletCircleRef.current = L.circle([lat, lng], {
                radius: accuracy,
                color: '#3b82f6',
                fillColor: '#93c5fd',
                fillOpacity: 0.2,
                weight: 1
              }).addTo(mapInstance.current);
            }

            // Fly map to position on first point
            mapInstance.current.flyTo([lat, lng], 15);
          }
        },
        (err) => {
          console.error("GPS Error:", err);
          toast.error("Impossible de lire le GPS : " + err.message);
          setTabletTracking(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  // 2. Simulation Mode (Simulating Machine Work in Field)
  const toggleSimulation = () => {
    if (simulating) {
      // STOP Simulation
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
      setSimulating(false);
      
      if (simMarkerRef.current) {
        simMarkerRef.current.remove();
        simMarkerRef.current = null;
      }
      if (simPolylineRef.current) {
        simPolylineRef.current.remove();
        simPolylineRef.current = null;
      }
      setSimulatedPath([]);
      toast.success("Simulation terminée");
    } else {
      // START Simulation
      if (!selectedEquip) {
        toast.error("Veuillez d'abord sélectionner un matériel dans la liste");
        return;
      }
      
      const L = window.L;
      setSimulating(true);
      toast.info("Démarrage de la simulation de récolte...");

      // Get starting point based on selected equipment city
      const index = equipmentList.findIndex(e => e.id === selectedEquip.id);
      const startCoords = getCoordinates(selectedEquip.location, index);

      // Create a grid track around the starting coordinates
      let step = 0;
      const pathPoints: GPSPoint[] = [];

      // Grid coordinate simulation offsets (S-shape field path)
      const simulatedPoints = [
        { lat: startCoords.lat, lng: startCoords.lng },
        { lat: startCoords.lat + 0.002, lng: startCoords.lng },
        { lat: startCoords.lat + 0.002, lng: startCoords.lng + 0.001 },
        { lat: startCoords.lat, lng: startCoords.lng + 0.001 },
        { lat: startCoords.lat, lng: startCoords.lng + 0.002 },
        { lat: startCoords.lat + 0.002, lng: startCoords.lng + 0.002 },
        { lat: startCoords.lat + 0.002, lng: startCoords.lng + 0.003 },
        { lat: startCoords.lat, lng: startCoords.lng + 0.003 },
        { lat: startCoords.lat - 0.001, lng: startCoords.lng + 0.002 },
        { lat: startCoords.lat - 0.001, lng: startCoords.lng }
      ];

      // Draw initial state
      mapInstance.current.flyTo([startCoords.lat, startCoords.lng], 16);

      const simIconHtml = `
        <div class="relative flex items-center justify-center w-10 h-10">
          <div class="absolute inset-0 bg-green-500/40 rounded-full animate-ping"></div>
          <div class="relative w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold">
            🚜
          </div>
        </div>
      `;
      const simIcon = L.divIcon({
        html: simIconHtml,
        className: 'sim-gps-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      simulationInterval.current = setInterval(() => {
        if (step >= simulatedPoints.length) {
          clearInterval(simulationInterval.current);
          simulationInterval.current = null;
          setSimulating(false);
          toast.success("Simulation de récolte terminée ! Surface couverte : 2.45 ha");
          return;
        }

        const point = simulatedPoints[step];
        const newPoint: GPSPoint = { ...point, timestamp: Date.now() };
        pathPoints.push(newPoint);

        setSimulatedPath([...pathPoints]);

        // Draw/Update Polyline
        if (simPolylineRef.current) {
          simPolylineRef.current.setLatLngs(pathPoints.map(p => [p.lat, p.lng]));
        } else {
          simPolylineRef.current = L.polyline(pathPoints.map(p => [p.lat, p.lng]), {
            color: '#10b981', // Emerald green
            weight: 5,
            opacity: 0.9
          }).addTo(mapInstance.current);
        }

        // Draw/Update Marker
        if (simMarkerRef.current) {
          simMarkerRef.current.setLatLng([point.lat, point.lng]);
        } else {
          simMarkerRef.current = L.marker([point.lat, point.lng], { icon: simIcon }).addTo(mapInstance.current);
        }

        // Pan map
        mapInstance.current.panTo([point.lat, point.lng]);
        step++;
      }, 1500);
    }
  };

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval.current) clearInterval(simulationInterval.current);
      if (tabletWatchId.current !== null) navigator.geolocation.clearWatch(tabletWatchId.current);
    };
  }, []);

  const stats = {
    total: equipmentList.length,
    available: equipmentList.filter(eq => eq.status === 'available').length,
    rented: equipmentList.filter(eq => eq.status === 'rented').length,
    maintenance: equipmentList.filter(eq => eq.status === 'maintenance').length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">Gestion & Suivi de la Flotte</h1>
            <p className="text-muted-foreground">Localisation GPS et statut de vos engins agricoles en direct</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3 bg-muted/40 border-none flex flex-col justify-center text-center">
              <span className="text-xs text-muted-foreground">Total Flotte</span>
              <span className="text-lg font-bold text-foreground">{stats.total}</span>
            </Card>
            <Card className="p-3 bg-green-50/50 border-none flex flex-col justify-center text-center">
              <span className="text-xs text-green-700 font-medium">Disponibles</span>
              <span className="text-lg font-bold text-green-700">{stats.available}</span>
            </Card>
            <Card className="p-3 bg-amber-50/50 border-none flex flex-col justify-center text-center">
              <span className="text-xs text-amber-700 font-medium">En Mission</span>
              <span className="text-lg font-bold text-amber-700">{stats.rented}</span>
            </Card>
            <Card className="p-3 bg-red-50/50 border-none flex flex-col justify-center text-center">
              <span className="text-xs text-red-700 font-medium">Maintenance</span>
              <span className="text-lg font-bold text-red-700">{stats.maintenance}</span>
            </Card>
          </div>
        </div>

        {/* Diagnostic or Errors loading Leaflet */}
        {leafletError && (
          <Card className="p-4 bg-destructive/10 border-destructive border text-destructive">
            <h3 className="font-semibold mb-1">Erreur de chargement de la carte</h3>
            <p className="text-sm">{leafletError}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-190px)] min-h-[500px]">
          {/* Side Panel: Equipment list */}
          <Card className="lg:col-span-4 p-4 flex flex-col h-full bg-card/90 backdrop-blur-md shadow-lg border-border">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher un engin (ex: tracteur)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-muted/50 rounded-lg border-border focus:ring-primary/20"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {loading ? (
                <div className="text-center py-8 text-sm text-muted-foreground">Chargement des machines...</div>
              ) : equipmentList.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">Aucun matériel trouvé</div>
              ) : (
                equipmentList
                  .filter(eq => 
                    eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    eq.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    eq.location.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((eq) => {
                    const isSelected = selectedEquip?.id === eq.id;
                    const statusText = 
                      eq.status === 'available' ? 'Disponible' : 
                      eq.status === 'rented' ? 'En Mission' : 'Maintenance';

                    const badgeColor = 
                      eq.status === 'available' ? 'bg-success/10 text-success border-success/20' : 
                      eq.status === 'rented' ? 'bg-secondary/10 text-secondary border-secondary/20' : 
                      'bg-destructive/10 text-destructive border-destructive/20';

                    return (
                      <div
                        key={eq.id}
                        onClick={() => selectEquipment(eq)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected 
                            ? "bg-primary/5 border-primary shadow-sm" 
                            : "bg-muted/10 border-transparent hover:border-border hover:bg-muted/20"
                        }`}
                      >
                        <div className={`p-2.5 rounded-lg text-white ${
                          eq.status === 'available' ? 'bg-success' : 
                          eq.status === 'rented' ? 'bg-secondary' : 'bg-destructive'
                        }`}>
                          <Tractor className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-sm truncate text-foreground">{eq.name}</h4>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${badgeColor}`}>
                              {statusText}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{eq.category}</p>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span className="truncate">{eq.location}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Selected Equipment GPS & Tracking Controls */}
            {selectedEquip && (
              <div className="border-t pt-4 mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Panneau de Contrôle GPS</span>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border text-xs space-y-1.5">
                  <p><strong>Engin :</strong> {selectedEquip.name}</p>
                  <p><strong>Statut :</strong> {selectedEquip.status === 'available' ? 'Disponible' : selectedEquip.status === 'rented' ? 'En Mission' : 'En Maintenance'}</p>
                  <p><strong>Propriétaire :</strong> {selectedEquip.owner?.full_name || 'N/A'}</p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant={simulating ? "destructive" : "default"}
                    onClick={toggleSimulation}
                    className="flex-1 text-xs"
                    disabled={selectedEquip.status === 'maintenance'}
                  >
                    {simulating ? (
                      <>
                        <Square className="w-3.5 h-3.5 mr-1" />
                        Stop Sim
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1" />
                        Simuler Travail
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Map Container */}
          <div className="lg:col-span-8 relative rounded-2xl overflow-hidden border border-border shadow-inner bg-muted h-full flex items-center justify-center">
            {!leafletReady ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <p className="text-sm text-muted-foreground font-medium">Initialisation de la carte...</p>
              </div>
            ) : (
              <div ref={mapRef} className="absolute inset-0 z-10 w-full h-full" />
            )}

            {/* Float Menu Overlay */}
            {leafletReady && (
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
                <Button
                  size="sm"
                  variant={tabletTracking ? "destructive" : "secondary"}
                  onClick={toggleTabletTracking}
                  className="shadow-md h-9 px-3 gap-2 bg-white/95 backdrop-blur hover:bg-white text-foreground hover:text-foreground border"
                >
                  {tabletTracking ? (
                    <>
                      <NavigationOff className="w-4 h-4 text-red-500 animate-pulse" />
                      Couper GPS Tablette
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 text-primary" />
                      GPS Tablette (Live)
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Map Legends Overlay */}
            {leafletReady && (
              <div className="absolute bottom-4 right-4 z-20 bg-white/90 backdrop-blur-md p-3 rounded-xl border shadow-md text-xs space-y-1.5 pointer-events-none">
                <div className="flex items-center gap-2 font-bold mb-1 border-b pb-1 text-foreground">
                  <Layers2 className="w-3.5 h-3.5 text-primary" />
                  Légende
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                  <span>En mission</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive"></span>
                  <span>En maintenance</span>
                </div>
                {tabletTracking && (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>Position Tablette (Bleu)</span>
                  </div>
                )}
                {simulating && (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>Parcours Simulation (Vert)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Fleet;
