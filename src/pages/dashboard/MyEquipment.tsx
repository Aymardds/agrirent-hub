
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MapPin, Tractor, Edit, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Equipment {
    id: string;
    name: string;
    category: string;
    price: number;
    location: string;
    available: boolean;
    image_url: string;
}

const MyEquipment = () => {
    const { user } = useAuth();
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        category: "Tracteurs",
        service_type: "location",
        price: "",
        price_unit: "Jour",
        location: "",
        description: "",
        image_url: "",
        gallery: [] as string[],
    });

    const uploadImage = async (file: File) => {
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('equipment-images')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('equipment-images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error: any) {
            toast.error('Erreur upload: ' + error.message);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const fetchEquipment = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from("equipment")
                .select("*")
                .eq("owner_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setEquipment(data || []);
        } catch (error: any) {
            toast.error("Erreur lors du chargement: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEquipment();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const { error } = await supabase.from("equipment").insert({
                owner_id: user.id,
                name: formData.name,
                category: formData.category,
                service_type: formData.service_type,
                price: parseFloat(formData.price),
                price_unit: formData.price_unit,
                location: formData.location,
                description: formData.description,
                available: true,
                image_url: formData.image_url || "tractor-default.png",
                gallery: formData.gallery,
                specs: ["Standard"],
            });

            if (error) throw error;

            toast.success("Matériel ajouté avec succès !");
            setIsDialogOpen(false);
            setFormData({
                name: "",
                category: "Tracteurs",
                service_type: "location",
                price: "",
                price_unit: "Jour",
                location: "",
                description: "",
                image_url: "",
                gallery: []
            });
            fetchEquipment();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) return;

        try {
            const { error } = await supabase.from("equipment").delete().eq("id", id);
            if (error) throw error;
            toast.success("Supprimé avec succès");
            fetchEquipment();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold font-display">Mes Matériels</h1>
                        <p className="text-muted-foreground">Gérez votre parc de machines</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="hero">
                                <Plus className="w-4 h-4 mr-2" />
                                Ajouter
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Ajouter un nouveau matériel</DialogTitle>
                                <div className="text-sm text-muted-foreground">
                                    Remplissez les informations ci-dessous pour ajouter votre matériel au catalogue.
                                </div>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nom du matériel</Label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Tracteur John Deere"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Photo principale</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const url = await uploadImage(file);
                                                if (url) setFormData({ ...formData, image_url: url });
                                            }
                                        }}
                                    />
                                    {formData.image_url && !formData.image_url.startsWith('tractor-default') && (
                                        <p className="text-xs text-green-600">Image chargée !</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Galerie (plusieurs photos)</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={async (e) => {
                                            const files = Array.from(e.target.files || []);
                                            if (files.length > 0) {
                                                const urls = [];
                                                for (const file of files) {
                                                    const url = await uploadImage(file);
                                                    if (url) urls.push(url);
                                                }
                                                setFormData({ ...formData, gallery: [...formData.gallery, ...urls] });
                                            }
                                        }}
                                    />
                                    {formData.gallery.length > 0 && (
                                        <p className="text-xs text-green-600">{formData.gallery.length} images dans la galerie</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Catégorie</Label>
                                        <select
                                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="Tracteurs">Tracteurs</option>
                                            <option value="Moissonneuses">Moissonneuses</option>
                                            <option value="Semoirs">Semoirs</option>
                                            <option value="Pulvérisateurs">Pulvérisateurs</option>
                                            <option value="Autre">Autre</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type de service</Label>
                                        <select
                                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                                            value={formData.service_type}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                service_type: e.target.value,
                                                price_unit: e.target.value === 'vente' ? 'Unité' : 'Jour' // Default reset
                                            })}
                                        >
                                            <option value="location">Location</option>
                                            <option value="vente">Vente</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Prix (FCFA)</Label>
                                        <Input
                                            type="number"
                                            required
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Unité de facturation</Label>
                                        {formData.service_type === 'vente' ? (
                                            <Input
                                                disabled
                                                value="Prix total"
                                                className="bg-muted"
                                            />
                                        ) : (
                                            <select
                                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                                                value={formData.price_unit}
                                                onChange={(e) => setFormData({ ...formData, price_unit: e.target.value })}
                                            >
                                                <option value="Jour">Par Jour</option>
                                                <option value="Heure">Par Heure</option>
                                                <option value="Hectare">Par Hectare</option>
                                                <option value="Padi">Par Padi (Riz)</option>
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Localisation</Label>
                                    <Input
                                        required
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
                                <Button type="submit" className="w-full" disabled={uploading}>
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    {uploading ? "Envoi des images..." : "Enregistrer"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div>Chargement...</div>
                ) : equipment.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                        <Tractor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">Aucun matériel</h3>
                        <p className="text-muted-foreground mb-4">Commencez par ajouter votre premier équipement</p>
                        <Button variant="outline" onClick={() => setIsDialogOpen(true)}>Ajouter maintenant</Button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {equipment.map((item) => (
                            <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all">
                                <div className="h-40 bg-muted flex items-center justify-center text-4xl">
                                    🚜
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold">{item.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${item.available ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                            {item.available ? 'Disponible' : 'Loué'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">{item.category}</p>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                        <MapPin className="w-4 h-4" />
                                        {item.location}
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                        <span className="font-bold">{item.price.toLocaleString()} FCFA/j</span>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MyEquipment;
