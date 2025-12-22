import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Package,
    Wrench,
    Calendar,
    TrendingUp,
    Plus,
    ArrowRightLeft,
    CheckCircle2,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const StockManagerDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEquipment: 0,
        available: 0,
        rented: 0,
        maintenance: 0,
    });
    const [pendingReturns, setPendingReturns] = useState<any[]>([]);
    const [pendingRentals, setPendingRentals] = useState<any[]>([]);

    // Form States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Add Equipment Form (Full Standard)
    const [newEquipment, setNewEquipment] = useState({
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

    // Assign Intervention Form
    const [assignData, setAssignData] = useState({
        equipment_id: "",
        technician_id: "",
        title: "Maintenance standard",
        priority: "medium"
    });

    // Data lists for forms
    const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Fetch Stats
            const { data: equipment } = await supabase.from("equipment").select("*");
            if (equipment) {
                setStats({
                    totalEquipment: equipment.length,
                    available: equipment.filter((e: any) => e.status === 'available').length,
                    rented: equipment.filter((e: any) => e.status === 'rented').length,
                    maintenance: equipment.filter((e: any) => e.status === 'maintenance').length,
                });
                setAvailableEquipment(equipment.filter((e: any) => e.status === 'available'));
            }

            // 2. Fetch Pending Returns (Completed Interventions)
            const { data: returns } = await supabase
                .from("interventions")
                .select("*, equipment(name, id), technician:technician_id(full_name)")
                .eq('status', 'completed'); // Completed by tech, waiting for validation

            setPendingReturns(returns || []);

            // 3. Fetch Pending Rentals (New Requests)
            const { data: rentals } = await supabase
                .from("rentals")
                .select("*, equipment(name, id, location), renter:renter_id(full_name, phone)")
                .eq('status', 'pending');

            setPendingRentals(rentals || []);

            // 4. Fetch Technicians for assignment
            const { data: techs } = await supabase
                .from("profiles")
                .select("*")
                .eq('role', 'technician');
            setTechnicians(techs || []);

        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRental = async (rental: any, technicianId: string) => {
        try {
            if (!technicianId) {
                toast.error("Veuillez choisir un technicien");
                return;
            }

            // 1. Create Intervention for the Technician
            const { error: intError } = await supabase.from("interventions").insert([{
                title: `Mission: ${rental.equipment.name} (${rental.renter.full_name})`,
                description: `Client: ${rental.renter.full_name}\nLieu: ${rental.equipment.location}\nDates: ${rental.start_date} au ${rental.end_date}\nMontant: ${rental.total_price}`,
                priority: 'high',
                status: 'pending',
                equipment_id: rental.equipment.id,
                technician_id: technicianId,
                created_at: new Date().toISOString()
            }]);

            if (intError) throw intError;

            // 2. Update Rental Status to Active & Payment to Paid (Simplification for workflow)
            const { error: rentError } = await supabase
                .from("rentals")
                .update({
                    status: 'active',
                    payment_status: 'paid' // Assuming payment is handled or confirmed here
                })
                .eq('id', rental.id);

            if (rentError) throw rentError;

            // 3. Update Equipment Status to Rented
            const { error: eqError } = await supabase
                .from("equipment")
                .update({ status: 'rented', available: false })
                .eq('id', rental.equipment.id);

            if (eqError) throw eqError;

            toast.success("Demande approuvée et technicien assigné !");
            fetchData();
        } catch (error: any) {
            toast.error("Erreur approbation: " + error.message);
        }
    };

    const uploadImage = async (file: File) => {
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('equipment-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

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

    const handleAddEquipment = async () => {
        try {
            const { error } = await supabase.from("equipment").insert([{
                owner_id: user?.id,
                name: newEquipment.name,
                category: newEquipment.category,
                service_type: newEquipment.service_type,
                price: parseFloat(newEquipment.price),
                price_unit: newEquipment.price_unit,
                location: newEquipment.location,
                description: newEquipment.description,
                image_url: newEquipment.image_url || "tractor-default.png",
                gallery: newEquipment.gallery,
                status: "available",
                available: true,
                specs: ["Standard"]
            }]);

            if (error) throw error;
            toast.success("Matériel ajouté avec succès !");
            setIsAddOpen(false);
            // Reset form
            setNewEquipment({
                name: "",
                category: "Tracteurs",
                service_type: "location",
                price: "",
                price_unit: "Jour",
                location: "",
                description: "",
                image_url: "",
                gallery: [],
            });
            fetchData();
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        }
    };

    const handleAssignIntervention = async () => {
        try {
            if (!assignData.equipment_id || !assignData.technician_id) {
                toast.error("Veuillez sélectionner un matériel et un technicien");
                return;
            }

            // 1. Create Intervention
            const { error: intError } = await supabase.from("interventions").insert([{
                title: assignData.title,
                priority: assignData.priority,
                status: 'pending',
                equipment_id: assignData.equipment_id,
                technician_id: assignData.technician_id,
                created_at: new Date().toISOString()
            }]);

            if (intError) throw intError;

            // 2. Update Equipment Status to 'maintenance'
            const { error: eqError } = await supabase
                .from("equipment")
                .update({ status: 'maintenance', available: false })
                .eq('id', assignData.equipment_id);

            if (eqError) throw eqError;

            toast.success("Mission assignée au technicien !");
            setIsAssignOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        }
    };

    const validateReturn = async (interventionId: string, equipmentId: string) => {
        try {
            // 1. Mark intervention as closed/validated
            const { error: intError } = await supabase
                .from("interventions")
                .update({ status: 'validated_return' })
                .eq('id', interventionId);

            if (intError) throw intError;

            // 2. Mark equipment as available
            const { error: eqError } = await supabase
                .from("equipment")
                .update({ status: 'available', available: true })
                .eq('id', equipmentId);

            if (eqError) throw eqError;

            toast.success("Retour validé, matériel disponible !");
            fetchData(); // Refresh list
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display">Gestion de Stock</h1>
                        <p className="text-muted-foreground">Bienvenue {user?.user_metadata?.full_name || 'Gestionnaire'}</p>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <ArrowRightLeft className="w-4 h-4" />
                                    Sortie / Prestation
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Créer une Sortie de Stock</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Matériel (Disponible)</Label>
                                        <Select
                                            onValueChange={(v) => setAssignData({ ...assignData, equipment_id: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choisir un matériel" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableEquipment.map((e: any) => (
                                                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.location})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Technicien Assigné</Label>
                                        <Select
                                            onValueChange={(v) => setAssignData({ ...assignData, technician_id: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choisir un technicien" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {technicians.map((t: any) => (
                                                    <SelectItem key={t.id} value={t.id}>{t.full_name || t.email}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Titre de la mission</Label>
                                        <Input
                                            value={assignData.title}
                                            onChange={(e) => setAssignData({ ...assignData, title: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAssignIntervention}>Valider la sortie</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Ajouter Matériel
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Ajouter au Stock (Complet)</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Nom du matériel</Label>
                                        <Input
                                            placeholder="Ex: Tracteur John Deere"
                                            value={newEquipment.name}
                                            onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
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
                                                    if (url) setNewEquipment({ ...newEquipment, image_url: url });
                                                }
                                            }}
                                        />
                                        {newEquipment.image_url && (
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
                                                    setNewEquipment({ ...newEquipment, gallery: [...newEquipment.gallery, ...urls] });
                                                }
                                            }}
                                        />
                                        {newEquipment.gallery.length > 0 && (
                                            <p className="text-xs text-green-600">{newEquipment.gallery.length} images ajoutées à la galerie</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Catégorie</Label>
                                            <select
                                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                                                value={newEquipment.category}
                                                onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })}
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
                                                value={newEquipment.service_type}
                                                onChange={(e) => setNewEquipment({ ...newEquipment, service_type: e.target.value })}
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
                                                placeholder="5000"
                                                value={newEquipment.price}
                                                onChange={(e) => setNewEquipment({ ...newEquipment, price: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Unité</Label>
                                            <select
                                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                                                value={newEquipment.price_unit}
                                                onChange={(e) => setNewEquipment({ ...newEquipment, price_unit: e.target.value })}
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
                                            placeholder="Ex: Dakar"
                                            value={newEquipment.location}
                                            onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={newEquipment.description}
                                            onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddEquipment} disabled={uploading}>
                                        {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Enregistrer
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Pending Rentals / Requests Section */}
                {pendingRentals.length > 0 && (
                    <Card className="border-blue-200 bg-blue-50 mb-6">
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-semibold text-blue-900">Demandes en Attente ({pendingRentals.length})</h2>
                            </div>
                            <div className="space-y-3">
                                {pendingRentals.map((rental: any) => (
                                    <div key={rental.id} className="bg-white p-4 rounded-lg border border-blue-100 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-blue-600">Nouvelle Demande</Badge>
                                                <span className="font-bold text-foreground">{rental.equipment?.name}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Client: <span className="font-medium">{rental.renter?.full_name}</span> •
                                                Dates: {rental.start_date} / {rental.end_date}
                                            </p>
                                            <p className="text-sm font-bold text-primary mt-1">
                                                {rental.total_price.toLocaleString()} FCFA
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Select onValueChange={(tId) => handleApproveRental(rental, tId)}>
                                                <SelectTrigger className="w-[200px] border-blue-200">
                                                    <SelectValue placeholder="Assigner Technicien" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {technicians.map((t: any) => (
                                                        <SelectItem key={t.id} value={t.id}>{t.full_name || t.email}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total matériel</p>
                                <h3 className="text-2xl font-bold">{stats.totalEquipment}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-success/10 text-success rounded-xl">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Disponible</p>
                                <h3 className="text-2xl font-bold">{stats.available}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">En location</p>
                                <h3 className="text-2xl font-bold">{stats.rented}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                                <Wrench className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Maintenance</p>
                                <h3 className="text-2xl font-bold">{stats.maintenance}</h3>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Validation Section - CRITICAL WORKFLOW */}
                {pendingReturns.length > 0 && (
                    <Card className="border-orange-200 bg-orange-50">
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                                <h2 className="text-lg font-semibold text-orange-900">Retours à Valider ({pendingReturns.length})</h2>
                            </div>
                            <div className="space-y-3">
                                {pendingReturns.map((intervention: any) => (
                                    <div key={intervention.id} className="bg-white p-4 rounded-lg border border-orange-100 flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="font-semibold text-foreground">{intervention.equipment?.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Tech: {intervention.technician?.full_name || 'Inconnu'} • Mission: {intervention.title}
                                            </p>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                    Terminé par technicien
                                                </Badge>
                                                {intervention.area_covered && (
                                                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                                        Superficie: {intervention.area_covered.toFixed(4)} ha
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => validateReturn(intervention.id, intervention.equipment?.id)}
                                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Confirmer le retour
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Empty State Helper */}
                {stats.totalEquipment === 0 && (
                    <div className="text-center py-12 bg-muted/30 rounded-lg">
                        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">Stock vide</h3>
                        <p className="text-muted-foreground mb-4">Commencez par ajouter du matériel à votre inventaire.</p>
                        <Button variant="outline" onClick={() => setIsAddOpen(true)}>Ajouter un premier matériel</Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StockManagerDashboard;
