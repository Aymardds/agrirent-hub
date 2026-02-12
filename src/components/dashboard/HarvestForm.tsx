import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useCreateHarvest, useUpdateHarvest } from "@/hooks/useHarvests";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Property {
    id: string;
    name: string;
    size: number;
    unit: string;
}

interface HarvestFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    harvest?: any; // For editing existing harvest
    onSuccess?: () => void;
}

const HarvestForm = ({ open, onOpenChange, harvest, onSuccess }: HarvestFormProps) => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingProperties, setLoadingProperties] = useState(true);

    const [formData, setFormData] = useState({
        property_id: '',
        harvest_date: new Date(),
        crop_type: '',
        quantity_bags: '',
        weight_kg: '',
        notes: '',
    });

    const createHarvest = useCreateHarvest();
    const updateHarvest = useUpdateHarvest();

    useEffect(() => {
        if (user) {
            fetchProperties();
        }
    }, [user]);

    useEffect(() => {
        if (harvest) {
            setFormData({
                property_id: harvest.property_id,
                harvest_date: new Date(harvest.harvest_date),
                crop_type: harvest.crop_type,
                quantity_bags: harvest.quantity_bags.toString(),
                weight_kg: harvest.weight_kg.toString(),
                notes: harvest.notes || '',
            });
        } else {
            resetForm();
        }
    }, [harvest, open]);

    const fetchProperties = async () => {
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('id, name, size, unit')
                .eq('owner_id', user!.id)
                .order('name');

            if (error) throw error;
            setProperties(data || []);
        } catch (error: any) {
            toast.error('Erreur de chargement des propriétés: ' + error.message);
        } finally {
            setLoadingProperties(false);
        }
    };

    const resetForm = () => {
        setFormData({
            property_id: '',
            harvest_date: new Date(),
            crop_type: '',
            quantity_bags: '',
            weight_kg: '',
            notes: '',
        });
    };

    const calculateKgPerBag = () => {
        const bags = parseFloat(formData.quantity_bags);
        const kg = parseFloat(formData.weight_kg);
        if (bags > 0 && kg > 0) {
            return (kg / bags).toFixed(2);
        }
        return '0';
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.property_id) {
            toast.error('Veuillez sélectionner une propriété');
            return;
        }
        if (!formData.crop_type) {
            toast.error('Veuillez indiquer le type de culture');
            return;
        }
        if (!formData.quantity_bags || parseFloat(formData.quantity_bags) <= 0) {
            toast.error('Veuillez indiquer le nombre de sacs');
            return;
        }
        if (!formData.weight_kg || parseFloat(formData.weight_kg) <= 0) {
            toast.error('Veuillez indiquer le poids en kilogrammes');
            return;
        }

        setLoading(true);
        try {
            const harvestData = {
                property_id: formData.property_id,
                farmer_id: user!.id,
                harvest_date: format(formData.harvest_date, 'yyyy-MM-dd'),
                crop_type: formData.crop_type,
                quantity_bags: parseInt(formData.quantity_bags),
                weight_kg: parseFloat(formData.weight_kg),
                notes: formData.notes || undefined,
            };

            if (harvest) {
                // Update existing harvest
                await updateHarvest.mutateAsync({
                    id: harvest.id,
                    updates: harvestData,
                });
            } else {
                // Create new harvest
                await createHarvest.mutateAsync(harvestData);
            }

            onOpenChange(false);
            resetForm();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error('Erreur: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {harvest ? 'Modifier la récolte' : 'Enregistrer une récolte'}
                    </DialogTitle>
                    <DialogDescription>
                        Enregistrez les détails de votre récolte par propriété
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Property Selection */}
                    <div className="space-y-2">
                        <Label>Propriété *</Label>
                        {loadingProperties ? (
                            <div className="text-sm text-muted-foreground">Chargement...</div>
                        ) : properties.length === 0 ? (
                            <div className="text-sm text-muted-foreground">
                                Aucune propriété trouvée. Veuillez d'abord créer une propriété.
                            </div>
                        ) : (
                            <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3"
                                value={formData.property_id}
                                onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                            >
                                <option value="">Sélectionner une propriété</option>
                                {properties.map((property) => (
                                    <option key={property.id} value={property.id}>
                                        {property.name} ({property.size} {property.unit})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Harvest Date */}
                    <div className="space-y-2">
                        <Label>Date de récolte *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(formData.harvest_date, 'PPP', { locale: fr })}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.harvest_date}
                                    onSelect={(date) => date && setFormData({ ...formData, harvest_date: date })}
                                    initialFocus
                                    disabled={(date) => date > new Date()}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Crop Type */}
                    <div className="space-y-2">
                        <Label>Type de culture *</Label>
                        <Input
                            placeholder="Ex: Riz, Maïs, Arachide..."
                            value={formData.crop_type}
                            onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                        />
                    </div>

                    {/* Quantity in Bags */}
                    <div className="space-y-2">
                        <Label>Nombre de sacs *</Label>
                        <Input
                            type="number"
                            min="1"
                            placeholder="Ex: 50"
                            value={formData.quantity_bags}
                            onChange={(e) => {
                                const bags = e.target.value;
                                const weight = bags ? (parseFloat(bags) * 100).toString() : '';
                                setFormData({
                                    ...formData,
                                    quantity_bags: bags,
                                    weight_kg: weight
                                });
                            }}
                        />
                        <p className="text-xs text-muted-foreground">
                            Standard: 1 sac = 100 kg
                        </p>
                    </div>

                    {/* Weight in KG - Auto-calculated */}
                    <div className="space-y-2">
                        <Label>Poids total (kg) *</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={formData.weight_kg}
                                readOnly
                                disabled
                                className="bg-muted cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Calculé automatiquement : {formData.quantity_bags || '0'} sacs × 100 kg
                        </p>
                    </div>

                    {/* Calculated KG per Bag */}
                    {formData.quantity_bags && formData.weight_kg && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Poids moyen par sac</p>
                            <p className="text-lg font-bold text-primary">{calculateKgPerBag()} kg/sac</p>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Notes (optionnel)</Label>
                        <Textarea
                            placeholder="Observations, qualité, conditions..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || loadingProperties || properties.length === 0}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {harvest ? 'Mettre à jour' : 'Enregistrer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default HarvestForm;
