import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Search,
    MapPin,
    Navigation,
    Home,
    Flag
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Property {
    id: string;
    name: string;
    size: number;
    unit: 'hectares' | 'casiers';
    department: string;
    locality: string;
    village: string;
    owner_id: string;
}

const Properties = () => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Form States
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const initialFormState = {
        name: "",
        size: "",
        unit: "hectares" as 'hectares' | 'casiers',
        department: "",
        locality: "",
        village: "",
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchProperties();
    }, [user]);

    const fetchProperties = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("properties")
                .select("*")
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProperties(data || []);
        } catch (error: any) {
            toast.error("Erreur chargement: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (!formData.name || !formData.size) {
                toast.error("Nom et superficie requis");
                return;
            }

            setSaving(true);
            const payload = {
                owner_id: user?.id,
                name: formData.name,
                size: parseFloat(formData.size as string),
                unit: formData.unit,
                department: formData.department,
                locality: formData.locality,
                village: formData.village,
            };

            if (isEditMode && currentId) {
                const { error } = await supabase
                    .from("properties")
                    .update(payload)
                    .eq('id', currentId);
                if (error) throw error;
                toast.success("Propriété modifiée");
            } else {
                const { error } = await supabase
                    .from("properties")
                    .insert([payload]);
                if (error) throw error;
                toast.success("Propriété ajoutée");
            }

            setIsDialogOpen(false);
            resetForm();
            fetchProperties();
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const { error } = await supabase.from("properties").delete().eq('id', deleteId);
            if (error) throw error;
            toast.success("Propriété supprimée");
            setProperties(properties.filter(p => p.id !== deleteId));
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        } finally {
            setDeleteId(null);
        }
    };

    const openEdit = (prop: Property) => {
        setFormData({
            name: prop.name || "",
            size: prop.size.toString(),
            unit: prop.unit,
            department: prop.department || "",
            locality: prop.locality || "",
            village: prop.village || "",
        });
        setCurrentId(prop.id);
        setIsEditMode(true);
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setIsEditMode(false);
        setCurrentId(null);
    };

    const filteredProperties = properties.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.locality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.village?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display">Mes Propriétés</h1>
                        <p className="text-muted-foreground">Gérez vos parcelles et casiers agricoles</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2">
                        <Plus className="w-4 h-4" /> Ajouter une propriété
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par nom, village ou localité..."
                        className="pl-10 max-w-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProperties.map((prop) => (
                            <div key={prop.id} className="bg-card border border-border rounded-xl p-6 space-y-4 hover:shadow-md transition-shadow relative group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{prop.name}</h3>
                                        <Badge variant="secondary" className="mt-1">
                                            {prop.size} {prop.unit}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(prop)}>
                                            <Pencil className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setDeleteId(prop.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Navigation className="w-4 h-4" />
                                        <span>Département: <span className="text-foreground">{prop.department || '-'}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        <span>Localité: <span className="text-foreground">{prop.locality || '-'}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Home className="w-4 h-4" />
                                        <span>Village: <span className="text-foreground">{prop.village || '-'}</span></span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredProperties.length === 0 && !loading && (
                            <div className="col-span-full py-12 text-center bg-muted/20 rounded-xl border border-dashed">
                                <Flag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-muted-foreground">Aucune propriété trouvée</p>
                                <Button variant="link" onClick={() => setIsDialogOpen(true)}>Ajouter votre première parcelle</Button>
                            </div>
                        )}
                    </div>
                )}

                {/* ADD / EDIT DIALOG */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? "Modifier la propriété" : "Ajouter une propriété"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nom de la parcelle / casier</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Champ Nord"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Superficie</Label>
                                    <Input
                                        type="number"
                                        value={formData.size}
                                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                        placeholder="10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Unité</Label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-background px-3"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'hectares' | 'casiers' })}
                                    >
                                        <option value="hectares">Hectares</option>
                                        <option value="casiers">Casiers</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <Label>Localisation</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 text-xs text-muted-foreground">Département</div>
                                        <Input
                                            size={30}
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            placeholder="Ex: Tivaouane"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 text-xs text-muted-foreground">Localité</div>
                                        <Input
                                            value={formData.locality}
                                            onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                                            placeholder="Ex: Thiès"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 text-xs text-muted-foreground">Village</div>
                                        <Input
                                            value={formData.village}
                                            onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                                            placeholder="Ex: Taïba Ndiaye"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                            <Button onClick={handleSubmit} disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {isEditMode ? "Mettre à jour" : "Enregistrer"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* DELETE CONFIRMATION */}
                <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette propriété ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible. Toutes les données associées à cette parcelle seront perdues.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
}

export default Properties;
