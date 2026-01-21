
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface InterventionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedDate?: Date;
    intervention?: any;
}

export const InterventionDialog = ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    selectedDate,
    intervention 
}: InterventionDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [equipment, setEquipment] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        equipment_id: "",
        technician_id: "",
        priority: "medium",
        status: "pending",
        scheduled_date: "",
    });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            if (intervention) {
                setFormData({
                    title: intervention.title || "",
                    description: intervention.description || "",
                    equipment_id: intervention.equipment_id || "",
                    technician_id: intervention.technician_id || "",
                    priority: intervention.priority || "medium",
                    status: intervention.status || "pending",
                    scheduled_date: intervention.scheduled_date ? format(new Date(intervention.scheduled_date), "yyyy-MM-dd'T'HH:mm") : "",
                });
            } else if (selectedDate) {
                setFormData(prev => ({
                    ...prev,
                    scheduled_date: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
                }));
            }
        }
    }, [isOpen, intervention, selectedDate]);

    const fetchInitialData = async () => {
        try {
            // Fetch technicians
            const { data: techData, error: techError } = await supabase
                .from("profiles")
                .select("id, full_name")
                .eq("role", "technician");
            
            if (techError) throw techError;
            setTechnicians(techData || []);

            // Fetch equipment
            const { data: equipData, error: equipError } = await supabase
                .from("equipment")
                .select("id, name");
            
            if (equipError) throw equipError;
            setEquipment(equipData || []);
        } catch (error: any) {
            console.error("Error fetching dialog data:", error);
            toast.error("Erreur de chargement des données");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.equipment_id || !formData.scheduled_date) {
            toast.error("Veuillez remplir les champs obligatoires");
            return;
        }

        setLoading(true);
        try {
            const dataToSave = {
                ...formData,
                technician_id: formData.technician_id || null, // Allow unassigned
            };

            if (intervention?.id) {
                const { error } = await supabase
                    .from("interventions")
                    .update(dataToSave)
                    .eq("id", intervention.id);
                if (error) throw error;
                toast.success("Intervention mise à jour");
            } else {
                const { error } = await supabase
                    .from("interventions")
                    .insert([dataToSave]);
                if (error) throw error;
                toast.success("Intervention programmée");
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error("Erreur lors de l'enregistrement: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {intervention ? "Modifier l'intervention" : "Programmer une intervention"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre de la mission *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Révision annuelle, Réparation moteur..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Matériel affecté *</Label>
                            <Select
                                value={formData.equipment_id}
                                onValueChange={(val) => setFormData({ ...formData, equipment_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un matériel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {equipment.map((e) => (
                                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Technicien affecté</Label>
                            <Select
                                value={formData.technician_id}
                                onValueChange={(val) => setFormData({ ...formData, technician_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Non assigné" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Non assigné</SelectItem>
                                    {technicians.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date et heure *</Label>
                            <Input
                                type="datetime-local"
                                value={formData.scheduled_date}
                                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Priorité</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(val) => setFormData({ ...formData, priority: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Basse</SelectItem>
                                    <SelectItem value="medium">Moyenne</SelectItem>
                                    <SelectItem value="high">Haute</SelectItem>
                                    <SelectItem value="critical">Critique</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description / Notes</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Détails sur l'intervention à réaliser..."
                            className="min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {intervention ? "Enregistrer" : "Programmer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
