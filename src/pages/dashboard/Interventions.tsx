import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Wrench, CheckCircle2, Clock, AlertTriangle, Play, Calendar as CalendarIcon, UserPlus, MapPin, User, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import InterventionCalendar from "@/components/dashboard/InterventionCalendar";
import { GPSTracker } from "@/components/dashboard/GPSTracker";

interface Intervention {
    id: string;
    equipment_id: string;
    title: string;
    description: string;
    status: "pending" | "in_progress" | "completed" | "cancelled";
    priority: "low" | "medium" | "high" | "critical";
    created_at: string;
    scheduled_date?: string;
    technician_id?: string;
    gps_path?: any[];
    area_covered?: number;
    equipment: {
        name: string;
        image_url?: string;
        location: string;
        rentals: {
            start_date: string;
            end_date: string;
            status: string;
            renter: {
                full_name: string;
            }
        }[];
    };
}

const Interventions = () => {
    const { user } = useAuth();
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInterventions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("interventions")
                .select(`
                    *,
                    equipment (
                        name, 
                        image_url, 
                        location,
                        rentals (
                            start_date,
                            end_date,
                            status,
                            renter:renter_id (full_name)
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInterventions(data as any);
        } catch (error) {
            console.error("Error fetching interventions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterventions();
    }, []);

    const updateInterventionStatus = async (id: string, newStatus: string, equipmentId: string) => {
        try {
            // Update intervention
            const updates: any = { status: newStatus };
            // Auto-assign if starting
            if (newStatus === 'in_progress') {
                updates.technician_id = user?.id;
            }
            if (newStatus === 'completed') {
                updates.completed_at = new Date().toISOString();
            }

            const { error: iError } = await supabase
                .from("interventions")
                .update(updates)
                .eq("id", id);

            if (iError) throw iError;

            // Update Equipment Status sync
            let equipStatus = 'maintenance';
            if (newStatus === 'completed' || newStatus === 'cancelled') {
                equipStatus = 'available';
            }

            await supabase.from("equipment").update({ status: equipStatus }).eq("id", equipmentId);

            toast.success("Intervention mise à jour");
            fetchInterventions();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const saveGPSData = async (id: string, path: any[], area: number) => {
        try {
            const { error } = await supabase
                .from("interventions")
                .update({
                    gps_path: path,
                    area_covered: area
                })
                .eq("id", id);

            if (error) throw error;
            toast.success("Données GPS enregistrées !");
            fetchInterventions();
        } catch (error: any) {
            toast.error("Erreur sauvegarde GPS: " + error.message);
        }
    };

    // Logic for filtering based on role
    const isManager = ['super_admin', 'admin', 'stock_manager'].includes(user?.user_metadata?.role);

    const myActiveInterventions = interventions.filter(i => {
        // Status filter
        const isActive = ['pending', 'in_progress'].includes(i.status);
        if (!isActive) return false;

        // Role filter
        if (isManager) return true; // Managers see all active disputes/tasks
        return i.technician_id === user?.id || !i.technician_id;
    });

    const historyInterventions = interventions.filter(i => ['completed', 'cancelled'].includes(i.status)); // History could be global or personal

    // Stats
    const stats = {
        total: interventions.length,
        pending: interventions.filter(i => i.status === 'pending').length,
        inProgress: interventions.filter(i => i.status === 'in_progress').length,
        completed: interventions.filter(i => i.status === 'completed').length,
    };

    const priorityColors = {
        low: "bg-blue-500/10 text-blue-500",
        medium: "bg-yellow-500/10 text-yellow-500",
        high: "bg-orange-500/10 text-orange-500",
        critical: "bg-red-500/10 text-red-500",
    };

    const statusColors = {
        pending: "bg-secondary/50 text-secondary-foreground",
        in_progress: "bg-primary/10 text-primary",
        completed: "bg-success/10 text-success",
        cancelled: "bg-destructive/10 text-destructive",
    };

    // Helper to get active rental context
    const getActiveRental = (task: Intervention) => {
        // Find a rental that is active or pending around the created_at time?
        // Simpler: find the 'active' rental associated with the equipment.
        return task.equipment.rentals?.find(r => r.status === 'active' || r.status === 'pending');
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-display">Espace Technicien</h1>
                        <p className="text-muted-foreground">Gérez vos missions de maintenance</p>
                    </div>
                    <div className="flex gap-4">
                        <Card className="p-3 flex items-center gap-3 bg-muted/50 border-none">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">À faire</p>
                                <p className="font-bold">{stats.pending}</p>
                            </div>
                        </Card>
                        <Card className="p-3 flex items-center gap-3 bg-muted/50 border-none">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Play className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">En cours</p>
                                <p className="font-bold">{stats.inProgress}</p>
                            </div>
                        </Card>
                        <Card className="p-3 flex items-center gap-3 bg-muted/50 border-none">
                            <div className="p-2 bg-success/10 rounded-lg text-success">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Terminés</p>
                                <p className="font-bold">{stats.completed}</p>
                            </div>
                        </Card>
                    </div>
                </div>

                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="active">Missions</TabsTrigger>
                        <TabsTrigger value="planning">Planning</TabsTrigger>
                        <TabsTrigger value="history">Historique</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="mt-6 space-y-4">
                        {/* Pool of unassigned tasks */}
                        {interventions.filter(i => !i.technician_id && i.status === 'pending').length > 0 && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-4">
                                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    Missions disponibles (Assignation)
                                </h3>
                                <div className="grid gap-3">
                                    {interventions.filter(i => !i.technician_id && i.status === 'pending').map(task => (
                                        <div key={task.id} className="bg-white p-3 rounded-lg border border-blue-100 flex justify-between items-center shadow-sm">
                                            <div>
                                                <span className="font-medium">{task.title}</span>
                                                <span className="text-sm text-muted-foreground mx-2">•</span>
                                                <span className="text-sm text-muted-foreground">{task.equipment.name}</span>
                                            </div>
                                            <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => updateInterventionStatus(task.id, 'in_progress', task.equipment_id)}>
                                                S'assigner
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {loading ? <div>Chargement...</div> : myActiveInterventions.length === 0 ? (
                            <div className="text-center py-12 border border-dashed rounded-xl">
                                <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Aucune mission en cours.</p>
                            </div>
                        ) : (
                            myActiveInterventions.map((task) => {
                                const activeRental = getActiveRental(task);
                                return (
                                    <Card key={task.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="border-l-4 border-l-primary flex flex-col md:flex-row">
                                            <div className="p-6 flex-1 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-lg">{task.title}</h3>
                                                            <Badge variant="outline" className={priorityColors[task.priority]}>{task.priority}</Badge>
                                                        </div>
                                                        <p className="text-muted-foreground flex items-center gap-2 font-medium">
                                                            <Wrench className="w-4 h-4" />
                                                            {task.equipment.name}
                                                        </p>
                                                    </div>
                                                    <Badge className={statusColors[task.status]}>
                                                        {task.status === 'pending' ? 'À faire' : 'En cours'}
                                                    </Badge>
                                                </div>

                                                {/* Context Details */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-lg">
                                                    {activeRental && (
                                                        <div className="flex items-center gap-2 text-foreground/80">
                                                            <User className="w-4 h-4 text-primary" />
                                                            <span className="font-semibold">Client:</span> {activeRental.renter?.full_name || 'N/A'}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 text-foreground/80">
                                                        <MapPin className="w-4 h-4 text-primary" />
                                                        <span className="font-semibold">Lieu:</span> {task.equipment.location}
                                                    </div>
                                                    {activeRental && (
                                                        <div className="col-span-1 md:col-span-2 flex items-center gap-2 text-foreground/80">
                                                            <CalendarRange className="w-4 h-4 text-primary" />
                                                            <span className="font-semibold">Période:</span>
                                                            {new Date(activeRental.start_date).toLocaleDateString()} - {new Date(activeRental.end_date).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>

                                                <p className="text-sm text-foreground/80 bg-muted/30 p-3 rounded-md">
                                                    {task.description || "Aucune description fournie."}
                                                </p>

                                                <div className="flex items-center text-xs text-muted-foreground gap-4">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Créé le {new Date(task.created_at).toLocaleDateString()}
                                                    </span>
                                                    {task.scheduled_date && (
                                                        <span className="flex items-center gap-1 text-primary font-medium">
                                                            <CalendarIcon className="w-3 h-3" />
                                                            Prévu le {new Date(task.scheduled_date).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-muted/30 p-6 flex flex-col justify-center gap-2 min-w-[200px] border-t md:border-t-0 md:border-l border-border">
                                                {task.status === 'pending' && (
                                                    <Button className="w-full" onClick={() => updateInterventionStatus(task.id, 'in_progress', task.equipment_id)}>
                                                        <Play className="w-4 h-4 mr-2" />
                                                        Commencer
                                                    </Button>
                                                )}
                                                {task.status === 'in_progress' && (
                                                    <div className="space-y-3 w-full">
                                                        <GPSTracker
                                                            isActive={true}
                                                            initialPath={task.gps_path || []}
                                                            onSave={(path, area) => saveGPSData(task.id, path, area)}
                                                        />

                                                        {task.area_covered ? (
                                                            <div className="text-center p-2 bg-success/10 rounded-md border border-success/20">
                                                                <p className="text-xs text-muted-foreground">Area confirmée</p>
                                                                <p className="font-bold text-success">{task.area_covered.toFixed(4)} ha</p>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center p-2 text-xs text-amber-600 bg-amber-50 rounded border border-amber-200">
                                                                Veuillez enregistrer la superficie via GPS avant de terminer
                                                            </div>
                                                        )}

                                                        <Button
                                                            className="w-full bg-success hover:bg-success/90 text-white"
                                                            disabled={!task.area_covered && !isManager} // Require area for technicians
                                                            onClick={() => updateInterventionStatus(task.id, 'completed', task.equipment_id)}
                                                        >
                                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                                            Terminer
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })
                        )}
                    </TabsContent>

                    <TabsContent value="planning" className="mt-6">
                        <InterventionCalendar
                            interventions={interventions}
                            onDayClick={isManager ? (day) => {
                                // We could redirect to Planning or open a dialog here
                                // For simplicity, let's just show it. 
                                // Actually, Planning page is better for management.
                            } : undefined}
                        />
                    </TabsContent>

                    <TabsContent value="history" className="mt-6">
                        {loading ? <div>Chargement...</div> : historyInterventions.length === 0 ? (
                            <div className="text-center py-12 border border-dashed rounded-xl">
                                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Aucun historique disponible.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {historyInterventions.map((task) => (
                                    <div key={task.id} className="bg-card border border-border p-4 rounded-xl flex justify-between items-center bg-opacity-60">
                                        <div>
                                            <h4 className="font-semibold text-foreground">{task.title}</h4>
                                            <p className="text-sm text-muted-foreground">{task.equipment.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="mb-1 bg-success/5 text-success border-success/20">Terminé</Badge>
                                            <p className="text-xs text-muted-foreground">{new Date(task.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default Interventions;
