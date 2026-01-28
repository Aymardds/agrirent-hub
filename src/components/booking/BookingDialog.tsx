import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Loader2, ShoppingCart, Ruler, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface ServicePrice {
    amount: number;
    unit: string;
}

interface Service {
    id: string;
    name: string;
    description: string;
    prices: ServicePrice[];
}

interface BookingDialogProps {
    equipment: {
        id: string;
        name: string;
        price: number;
        price_unit: string;
        service_type: string;
        category: string;
        image_url?: string;
        gallery?: string[];
        equipment_services?: Service[];
    };
    trigger?: React.ReactNode;
}

export const BookingDialog = ({ equipment, trigger }: BookingDialogProps) => {
    // ... (state vars same as before)
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Rental fields
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [quantity, setQuantity] = useState(1);

    // Selected image from gallery (default to main image)
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Land Properties logic
    const [properties, setProperties] = useState<any[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

    useEffect(() => {
        if (user && isOpen) {
            fetchProperties();
        }
    }, [user, isOpen]);

    const fetchProperties = async () => {
        const { data } = await supabase.from("properties").select("*").eq("owner_id", user?.id);
        setProperties(data || []);
        if (data && data.length > 0) {
            setSelectedPropertyId(data[0].id);
        }
    };

    // Service Selection Logic
    const hasServices = equipment.equipment_services && equipment.equipment_services.length > 0;
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedPrice, setSelectedPrice] = useState<ServicePrice | null>(null);

    // Initialize default service if available (run once when open or equip changes)
    // We'll prioritize the base price if no service is explicitly forced, but here we let user choose.

    // Determine the active price settings
    const activePrice = hasServices && selectedPrice ? selectedPrice.amount : equipment.price;
    const activeUnit = hasServices && selectedPrice ? selectedPrice.unit : equipment.price_unit;

    const isSale = equipment.service_type === 'vente';
    const isDayRent = activeUnit === 'Jour' && !isSale;
    const isHourlyRent = activeUnit === 'Heure' && !isSale;
    const isAreaRent = (activeUnit === 'Hectare' || activeUnit === 'Casier') && !isSale; // Covers Hecare, Casier, etc.

    const calculateTotal = () => {
        if (isSale) return equipment.price;

        if (isDayRent) {
            if (!startDate || !endDate) return 0;
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = differenceInDays(end, start) + 1;
            return days > 0 ? days * activePrice : 0;
        }

        // For Hour, Hectare, Casier, Padi, Sac
        return quantity * activePrice;
    };

    const handleAction = async () => {
        if (!user) {
            toast.error("Veuillez vous connecter pour continuer");
            navigate("/login");
            return;
        }

        if (!selectedPropertyId && !isSale) {
            toast.error("Veuillez sélectionner une propriété");
            return;
        }

        if (isDayRent && (!startDate || !endDate)) {
            toast.error("Veuillez sélectionner les dates");
            return;
        }

        if (hasServices && !selectedService) {
            toast.error("Veuillez sélectionner un service");
            return;
        }

        if (hasServices && !selectedPrice) {
            toast.error("Veuillez sélectionner une option de tarif");
            return;
        }

        if (!isDayRent && !isSale && quantity <= 0) {
            toast.error("Veuillez entrer une quantité valide");
            return;
        }

        setLoading(true);
        try {
            const total = calculateTotal();
            if (total <= 0) throw new Error("Montant invalide");

            const payload: any = {
                equipment_id: equipment.id,
                renter_id: user.id,
                property_id: selectedPropertyId || null,
                total_price: total,
                status: "pending",
                prestation_type: hasServices && selectedService ? selectedService.name : equipment.category,
                planned_area: !isDayRent && !isSale ? quantity : 0
            };

            if (isDayRent) {
                payload.start_date = startDate;
                payload.end_date = endDate;
            } else if (!isSale) {
                payload.start_date = new Date().toISOString().split('T')[0];
                payload.end_date = new Date().toISOString().split('T')[0];
            } else {
                payload.start_date = new Date().toISOString().split('T')[0];
                payload.end_date = new Date().toISOString().split('T')[0];
            }

            const { error } = await supabase.from("rentals").insert(payload);

            if (error) throw error;

            toast.success(isSale ? "Demande d'achat envoyée !" : "Demande de réservation envoyée !");
            setIsOpen(false);
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getUnitLabel = (unit: string) => {
        switch (unit) {
            case 'Heure': return 'Nombre d\'heures';
            case 'Hectare': return 'Nombre d\'hectares';
            case 'Padi': return 'Nombre de Padis';
            case 'Casier': return 'Nombre de Casiers';
            case 'Sac': return 'Nombre de Sacs';
            default: return 'Quantité';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {/* ... trigger */}
                {trigger || (
                    <Button variant={isSale ? "default" : "hero"}>
                        {isSale ? <ShoppingCart className="w-4 h-4 mr-2" /> : <CalendarIcon className="w-4 h-4 mr-2" />}
                        {isSale ? "Acheter" : "Réserver"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{isSale ? "Acheter" : "Réserver"} {equipment.name}</DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        {isSale
                            ? "Vérifiez les détails et confirmez votre achat."
                            : "Vérifiez les disponibilités et confirmez votre réservation."}
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                            {selectedImage || equipment.image_url ? (
                                <img
                                    src={selectedImage || equipment.image_url}
                                    alt={equipment.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-6xl">🚜</span>
                            )}
                        </div>
                        {equipment.gallery && equipment.gallery.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {/* Thumbnail for main image */}
                                {equipment.image_url && (
                                    <button
                                        onClick={() => setSelectedImage(equipment.image_url!)}
                                        className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 ${selectedImage === equipment.image_url ? 'border-primary' : 'border-transparent'}`}
                                    >
                                        <img src={equipment.image_url} className="w-full h-full object-cover" />
                                    </button>
                                )}
                                {/* Gallery thumbnails */}
                                {equipment.gallery.map((url, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(url)}
                                        className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 ${selectedImage === url ? 'border-primary' : 'border-transparent'}`}
                                    >
                                        <img src={url} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* ... rest of the form */}
                        {/* Service Selection */}
                        {hasServices && (
                            <div className="space-y-3 p-4 bg-muted/20 border rounded-lg">
                                <Label className="text-base font-semibold">1. Choisissez un service</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {equipment.equipment_services?.map((service) => (
                                        <div
                                            key={service.id}
                                            onClick={() => {
                                                setSelectedService(service);
                                                setSelectedPrice(null); // Reset price when changing service
                                            }}
                                            className={`cursor-pointer p-3 rounded-md border-2 transition-all ${selectedService?.id === service.id
                                                ? "border-primary bg-primary/5"
                                                : "border-transparent bg-card hover:bg-muted"
                                                }`}
                                        >
                                            <div className="font-medium">{service.name}</div>
                                            {service.description && (
                                                <div className="text-sm text-muted-foreground line-clamp-2">{service.description}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Price Selection for Service */}
                        {hasServices && selectedService && (
                            <div className="space-y-3 p-4 bg-muted/20 border rounded-lg animate-in fade-in slide-in-from-top-2">
                                <Label className="text-base font-semibold">2. Choisissez une option tarifaire</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedService.prices.map((price, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedPrice(price)}
                                            className={`p-2 rounded-md border-2 text-sm transition-all ${selectedPrice === price
                                                ? "border-primary bg-primary/5 font-medium"
                                                : "border-border bg-card hover:border-primary/50"
                                                }`}
                                        >
                                            <div className="text-primary">{price.amount.toLocaleString()} FCFA</div>
                                            <div className="text-muted-foreground">/ {price.unit}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Date Selection for Daily Rental */}
                        {isDayRent && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date de début</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date de fin</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate || new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Quantity Input for Other Units (Hour, Hectare, Padi) */}
                        {!isDayRent && !isSale && (
                            <div className="space-y-2">
                                <Label>{getUnitLabel(activeUnit)}</Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                    />
                                    <span className="text-muted-foreground whitespace-nowrap">
                                        x {activePrice.toLocaleString()} FCFA
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Property Selection */}
                        {!isSale && (
                            <div className="space-y-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                <Label className="flex items-center gap-2">
                                    <Home className="w-4 h-4 text-primary" />
                                    Propriété concernée
                                </Label>
                                {properties.length > 0 ? (
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-background px-3"
                                        value={selectedPropertyId}
                                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                                    >
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.size} {p.unit} - {p.locality})</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-sm text-destructive flex flex-col gap-1">
                                        <span>Aucune propriété enregistrée.</span>
                                        <Link to="/dashboard/properties" className="text-primary hover:underline font-medium">
                                            Ajouter une propriété pour continuer
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Summary for all modes */}
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Prix unitaire</span>
                                <span>{activePrice.toLocaleString()} FCFA {(!isSale && activeUnit) ? `/ ${activeUnit}` : ''}</span>
                            </div>

                            {isDayRent && (
                                <div className="flex justify-between text-sm">
                                    <span>Durée</span>
                                    <span>{(startDate && endDate && calculateTotal() > 0) ? differenceInDays(new Date(endDate), new Date(startDate)) + 1 : 0} jours</span>
                                </div>
                            )}

                            <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                                <span>Total à payer</span>
                                <span className="text-primary">{calculateTotal().toLocaleString()} FCFA</span>
                            </div>
                        </div>

                        <Button onClick={handleAction} className="w-full" disabled={loading || calculateTotal() <= 0}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirmer {isSale ? "l'achat" : "la réservation"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
