import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Package,
    Wrench,
    Calendar as CalendarIcon,
    AlertCircle,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Search
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

interface Equipment {
    id: string;
    name: string;
    category: string;
    service_type: string;
    price: number;
    price_unit: string;
    location: string;
    description: string;
    image_url: string;
    gallery: string[];
    status: "available" | "rented" | "maintenance";
    owner_id: string;
}

const Stock = () => {
    const { user } = useAuth();
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Form States
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const initialFormState = {
        name: "",
        category: "Tracteurs",
        service_type: "location",
        price: "",
        price_unit: "Jour",
        location: "",
        description: "",
        image_url: "",
        gallery: [] as string[],
    };
    const [formData, setFormData] = useState(initialFormState);

    // Permissions check
    const canManage = ['stock_manager', 'admin', 'super_admin'].includes(user?.user_metadata?.role || '');

    useEffect(() => {
        fetchEquipment();
    }, [user]);

    const fetchEquipment = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let query = supabase.from("equipment").select("*").order('created_at', { ascending: false });

            // RLS handles permission, but we apply filter logic for non-admins just in case
            if (!canManage) {
                query = query.eq('owner_id', user.id);
            }

            const { data, error } = await query;
            if (error) throw error;
            setEquipment(data || []);
        } catch (error) {
            console.error("Error fetching stock:", error);
            toast.error("Erreur chargement stock");
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async (file: File) => {
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;
            const { error: uploadError } = await supabase.storage.from('equipment-images').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('equipment-images').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error: any) {
            toast.error('Erreur upload: ' + error.message);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (!formData.name || !formData.price) {
                toast.error("Veuillez remplir les champs obligatoires");
                return;
            }

            const payload = {
                owner_id: user?.id, // Default owner is current user (manager)
                name: formData.name,
                category: formData.category,
                service_type: formData.service_type,
                price: parseFloat(formData.price),
                price_unit: formData.price_unit,
                location: formData.location,
                description: formData.description,
                image_url: formData.image_url || "tractor-default.png",
                gallery: formData.gallery,
                // Status defaults
                ...(isEditMode ? {} : { status: "available", available: true, specs: ["Standard"] })
            };

            let error;
            if (isEditMode && currentId) {
                const { error: updateError } = await supabase
                    .from("equipment")
                    .update(payload)
                    .eq('id', currentId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("equipment")
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(isEditMode ? "Matériel modifié !" : "Matériel ajouté !");
            setIsDialogOpen(false);
            resetForm();
            fetchEquipment();
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const { error } = await supabase.from("equipment").delete().eq('id', deleteId);
            if (error) throw error;
            toast.success("Matériel supprimé");
            setEquipment(equipment.filter(e => e.id !== deleteId));
        } catch (error: any) {
            toast.error("Erreur suppression: " + error.message);
        } finally {
            setDeleteId(null);
        }
    };

    const openEdit = (item: Equipment) => {
        setFormData({
            name: item.name,
            category: item.category || "Tracteurs",
            service_type: item.service_type || "location",
            price: item.price?.toString() || "",
            price_unit: item.price_unit || "Jour",
            location: item.location || "",
            description: item.description || "",
            image_url: item.image_url || "",
            gallery: item.gallery || [],
        });
        setCurrentId(item.id);
        setIsEditMode(true);
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setIsEditMode(false);
        setCurrentId(null);
    };

    const filteredEquipment = equipment.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusColors = {
        available: "bg-success/10 text-success border-success/20",
        rented: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        maintenance: "bg-destructive/10 text-destructive border-destructive/20",
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display">Gestion du Stock</h1>
                        <p className="text-muted-foreground">{equipment.length} équipements dans le parc</p>
                    </div>
                    {canManage && (
                        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2">
                            <Plus className="w-4 h-4" /> Ajouter Matériel
                        </Button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par nom, ville..."
                        className="pl-10 max-w-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEquipment.map((item) => (
                            <div key={item.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                <div className="aspect-video bg-muted relative overflow-hidden">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                            <Package className="w-12 h-12 text-muted-foreground/50" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <Badge variant="outline" className={`bg-white/90 backdrop-blur ${statusColors[item.status]}`}>
                                            {item.status === 'available' ? 'Disponible' : item.status === 'rented' ? 'Loué' : 'Maintenance'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg">{item.name}</h3>
                                            <p className="text-sm text-muted-foreground">{item.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary">{item.price} FCFA</p>
                                            <p className="text-xs text-muted-foreground">/{item.price_unit}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <AlertCircle className="w-4 h-4" />
                                        {item.location}
                                    </div>

                                    {canManage && (
                                        <div className="pt-2 flex gap-2 border-t mt-2">
                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(item)}>
                                                <Pencil className="w-3 h-3 mr-2" /> Modifier
                                            </Button>
                                            <Button variant="destructive" size="sm" className="w-10 px-0" onClick={() => setDeleteId(item.id)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ADD / EDIT DIALOG */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? "Modifier Matériel" : "Ajouter au Stock"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nom du matériel</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Tracteur John Deere"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Photo principale</Label>
                                    <Input type="file" accept="image/*" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) uploadImage(file).then(url => url && setFormData({ ...formData, image_url: url }));
                                    }} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Galerie</Label>
                                    <Input type="file" multiple accept="image/*" onChange={async (e) => {
                                        const files = Array.from(e.target.files || []);
                                        const urls = [];
                                        for (const f of files) {
                                            const u = await uploadImage(f);
                                            if (u) urls.push(u);
                                        }
                                        if (urls.length) setFormData({ ...formData, gallery: [...formData.gallery, ...urls] });
                                    }} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Catégorie</Label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-background px-3"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Tracteurs">Tracteurs</option>
                                        <option value="Moissonneuses">Moissonneuses</option>
                                        <option value="Semoirs">Semoirs</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-background px-3"
                                        value={formData.service_type}
                                        onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                                    >
                                        <option value="location">Location</option>
                                        <option value="vente">Vente</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Prix</Label>
                                    <Input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Unité</Label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-background px-3"
                                        value={formData.price_unit}
                                        onChange={(e) => setFormData({ ...formData, price_unit: e.target.value })}
                                    >
                                        <option value="Jour">Par Jour</option>
                                        <option value="Heure">Par Heure</option>
                                        <option value="Hectare">Par Hectare</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Localisation</Label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                            <Button onClick={handleSubmit} disabled={uploading}>
                                {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {isEditMode ? "Mettre à jour" : "Ajouter"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* DELETE CONFIRMATION */}
                <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible. Le matériel sera définitivement supprimé du stock.
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

export default Stock;
