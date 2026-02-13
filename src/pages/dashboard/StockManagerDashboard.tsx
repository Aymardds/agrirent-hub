import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Package,
    Wrench,
    Calendar,
    TrendingUp,
    Plus,
    ArrowRightLeft,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Search,
    UserCircle,
    MapPin
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
    const [activeTab, setActiveTab] = useState("overview");

    // Form States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Add Equipment Form
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
        rental_id: "",
        equipment_id: "",
        technician_id: "",
        title: "Mission de prestation",
        priority: "high",
        scheduled_date: "",
    });

    // Data lists for forms
    const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
    const [allEquipment, setAllEquipment] = useState<any[]>([]); // For Inventory Tab
    const [technicians, setTechnicians] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Fetch Equipment
            const { data: equipment } = await supabase.from("equipment").select("*").order('created_at', { ascending: false });
            if (equipment) {
                setAllEquipment(equipment);
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
                .eq('status', 'completed');

            setPendingReturns(returns || []);

            // 3. Fetch Pending Rentals (New Requests)
            const { data: rentals, error: rentalsError } = await supabase
                .from("rentals")
                .select("*, equipment(name, id, location), renter:renter_id(full_name, phone)")
                .eq('status', 'pending');

            if (rentalsError) {
                console.error("Error fetching pending rentals:", rentalsError);
            } else {
                setPendingRentals(rentals || []);
            }

            // 4. Fetch Technicians
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

    const prepareAssignment = (rental: any) => {
        setAssignData({
            rental_id: rental.id,
            equipment_id: rental.equipment.id,
            technician_id: "",
            title: `Mission: ${rental.equipment.name} - ${rental.renter?.full_name}`,
            priority: "high",
            scheduled_date: new Date().toISOString().slice(0, 16) // Default to now for input type="datetime-local"
        });
        setIsAssignOpen(true);
    };

    const handleAssignIntervention = async () => {
        try {
            if (!assignData.technician_id || !assignData.scheduled_date) {
                toast.error("Veuillez sélectionner un technicien et une date");
                return;
            }

            // 1. Create Intervention linked to Rental
            const { error: intError } = await supabase.from("interventions").insert([{
                title: assignData.title,
                priority: assignData.priority,
                status: 'pending',
                equipment_id: assignData.equipment_id,
                technician_id: assignData.technician_id,
                rental_id: assignData.rental_id, // Link to rental
                scheduled_date: new Date(assignData.scheduled_date).toISOString(),
                created_at: new Date().toISOString()
            }]);

            if (intError) throw intError;

            // 2. Notify Technician
            const tech = technicians.find(t => t.id === assignData.technician_id);
            const { error: notifError } = await supabase.from("notifications").insert([{
                user_id: assignData.technician_id,
                title: "Nouvelle Mission Assignée",
                message: `Vous avez été assigné à la mission : ${assignData.title}. Date prévue : ${new Date(assignData.scheduled_date).toLocaleDateString()}`,
                type: "info",
                link: "/dashboard/interventions"
            }]);

            if (notifError) console.error("Notification error:", notifError);

            // 3. Activate Rental
            if (assignData.rental_id) {
                const { error: rentError } = await supabase
                    .from("rentals")
                    .update({
                        status: 'active',
                        payment_status: 'paid' // Assuming payment/validation overlap
                    })
                    .eq('id', assignData.rental_id);
                if (rentError) throw rentError;
            }

            // 4. Update Equipment Status
            const { error: eqError } = await supabase
                .from("equipment")
                .update({ status: 'rented', available: false })
                .eq('id', assignData.equipment_id);

            if (eqError) throw eqError;

            toast.success("Mission programmée et technicien notifié !");
            setIsAssignOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        }
    };

    const validateReturn = async (interventionId: string, equipmentId: string) => {
        try {
            const { error: intError } = await supabase
                .from("interventions")
                .update({ status: 'validated' })
                .eq('id', interventionId);
            if (intError) throw intError;

            const { error: eqError } = await supabase
                .from("equipment")
                .update({ status: 'available', available: true })
                .eq('id', equipmentId);
            if (eqError) throw eqError;

            toast.success("Retour validé !");
            fetchData();
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
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
            toast.success("Matériel ajouté !");
            setIsAddOpen(false);
            fetchData();
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
                        <p className="text-muted-foreground">Espace Gestionnaire</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-xl"><Package className="w-6 h-6" /></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total matériel</p>
                                <h3 className="text-2xl font-bold">{stats.totalEquipment}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-success/10 text-success rounded-xl"><TrendingUp className="w-6 h-6" /></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Disponible</p>
                                <h3 className="text-2xl font-bold">{stats.available}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Calendar className="w-6 h-6" /></div>
                            <div>
                                <p className="text-sm text-muted-foreground">En prestation</p>
                                <h3 className="text-2xl font-bold">{stats.rented}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl"><Wrench className="w-6 h-6" /></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Maintenance</p>
                                <h3 className="text-2xl font-bold">{stats.maintenance}</h3>
                            </div>
                        </div>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                        <TabsTrigger value="requests">Demandes ({pendingRentals.length})</TabsTrigger>
                        <TabsTrigger value="stock">Inventaire</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Pending Returns (Validation) */}
                        {pendingReturns.length > 0 ? (
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
                                                </div>
                                                <Button onClick={() => validateReturn(intervention.id, intervention.equipment?.id)} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                                    <CheckCircle2 className="w-4 h-4" /> Confirmer
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-6 flex items-center justify-center text-muted-foreground border-dashed">
                                <p>Aucun retour en attente de validation</p>
                            </Card>
                        )}

                        {/* Short Summary of Requests */}
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">Dernières demandes</h3>
                            {pendingRentals.length > 0 ? (
                                <div className="space-y-2">
                                    {pendingRentals.slice(0, 3).map((rental: any) => (
                                        <div key={rental.id} className="bg-card p-4 rounded-xl border flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{rental.equipment?.name}</p>
                                                <p className="text-sm text-muted-foreground">{rental.renter?.full_name}</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => { setActiveTab("requests"); }}>
                                                Voir
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Aucune nouvelle demande.</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="requests">
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Matériel</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Dates</TableHead>
                                        <TableHead>Lieu</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingRentals.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                Aucune demande en attente
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pendingRentals.map((rental: any) => (
                                            <TableRow key={rental.id}>
                                                <TableCell className="font-medium">{rental.equipment?.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                                                        {rental.renter?.full_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm">
                                                        <span>{new Date(rental.start_date).toLocaleDateString()}</span>
                                                        <span className="text-muted-foreground text-xs">au {new Date(rental.end_date).toLocaleDateString()}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <MapPin className="w-3 h-3" />
                                                        {rental.equipment?.location}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button onClick={() => prepareAssignment(rental)} className="gap-2">
                                                        <CheckCircle2 className="w-4 h-4" /> Programmer
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    <TabsContent value="stock">
                        <div className="flex justify-end mb-4">
                            <Button onClick={() => setIsAddOpen(true)} className="gap-2">
                                <Plus className="w-4 h-4" /> Ajouter Matériel
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allEquipment.map((item: any) => (
                                <div key={item.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="aspect-video bg-muted relative overflow-hidden">
                                        <img src={item.image_url || "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d9?w=800&auto=format&fit=crop&q=60"} alt={item.name} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2">
                                            <Badge variant="secondary" className="bg-white/90">{item.status}</Badge>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg">{item.name}</h3>
                                        <p className="text-sm text-muted-foreground">{item.category}</p>
                                        <div className="mt-2 flex justify-between items-center">
                                            <span className="font-bold text-primary">{item.price} FCFA</span>
                                            <span className="text-xs text-muted-foreground">/{item.price_unit}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Assignment Dialog */}
                <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Programmer la Mission</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Titre de la mission</Label>
                                <Input value={assignData.title} onChange={(e) => setAssignData({ ...assignData, title: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Technicien à assigner</Label>
                                <Select onValueChange={(v) => setAssignData({ ...assignData, technician_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir un technicien" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {technicians.map((t: any) => (
                                            <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Date de la mission *</Label>
                                <Input
                                    type="datetime-local"
                                    value={assignData.scheduled_date || ""}
                                    onChange={(e) => setAssignData({ ...assignData, scheduled_date: e.target.value })}
                                    required
                                    className="w-full"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Choisissez la date et l'heure prévues pour cette mission
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAssignIntervention}>Confirmer l'assignation</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Equipment Dialog (Simplified reuse) */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Ajouter Matériel</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nom</Label>
                                <Input value={newEquipment.name} onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })} placeholder="Ex: Tracteur" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Prix</Label>
                                    <Input type="number" value={newEquipment.price} onChange={(e) => setNewEquipment({ ...newEquipment, price: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Location</Label>
                                    <Input value={newEquipment.location} onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })} />
                                </div>
                            </div>
                            <Button className="w-full mt-4" onClick={handleAddEquipment}>Ajouter</Button>
                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        </DashboardLayout>
    );
};

export default StockManagerDashboard;
