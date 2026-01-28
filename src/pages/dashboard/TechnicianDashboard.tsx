import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock, Wrench, Calendar, MapPin, PlayCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Intervention {
    id: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
    equipment: {
        name: string;
        location: string;
    };
}

const TechnicianDashboard = () => {
    const { user } = useAuth();
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMyInterventions = async () => {
        if (!user) return;
        setLoading(true);
        // Fetch assigned interventions that are NOT closed (so pending or in_progress or completed waiting validation)
        const { data } = await supabase
            .from("interventions")
            .select("*, equipment(name, location)")
            .or(`technician_id.eq.${user.id}`)
            // We want to see pending, in_progress, and completed (waiting for manager validation)
            .in('status', ['pending', 'in_progress', 'completed'])
            .order('created_at', { ascending: false });

        setInterventions(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchMyInterventions();
    }, [user]);

    const handleStartIntervention = async (id: string) => {
        const { error } = await supabase
            .from("interventions")
            .update({ status: 'in_progress' })
            .eq('id', id);

        if (error) toast.error("Erreur");
        else {
            toast.success("Mission commencée");
            fetchMyInterventions();
        }
    };

    const handleCompleteIntervention = async (id: string) => {
        const { error } = await supabase
            .from("interventions")
            .update({ status: 'completed' }) // 'completed' means done by tech, waiting for return validation
            .eq('id', id);

        if (error) toast.error("Erreur");
        else {
            toast.success("Mission terminée ! Le gestionnaire a été notifié pour le retour.");
            fetchMyInterventions();
        }
    };

    const stats = {
        pending: interventions.filter(i => i.status === 'pending').length,
        inProgress: interventions.filter(i => i.status === 'in_progress').length,
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-3xl font-bold font-display">Tableau de bord Technicien</h1>
                    <p className="text-muted-foreground">Bienvenue {user?.user_metadata?.full_name || 'Technicien'}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">À faire</p>
                                <h3 className="text-2xl font-bold">{stats.pending}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">En cours</p>
                                <h3 className="text-2xl font-bold">{stats.inProgress}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-success/10 text-success rounded-xl">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Terminés (ce mois)</p>
                                <h3 className="text-2xl font-bold">12</h3>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Recent Interventions */}
                <Card>
                    <div className="p-6 border-b">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Mes Missions Actives</h2>
                            <Link to="/dashboard/interventions">
                                <Button variant="ghost" size="sm">Voir tout</Button>
                            </Link>
                        </div>
                    </div>
                    <div className="divide-y">
                        {loading ? (
                            <div className="p-6 text-center text-muted-foreground">Chargement...</div>
                        ) : interventions.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                <Wrench className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Aucune mission assignée pour le moment</p>
                            </div>
                        ) : (
                            interventions.map(intervention => (
                                <div key={intervention.id} className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-lg">{intervention.title}</h4>
                                                <Badge variant={
                                                    intervention.status === 'pending' ? 'secondary' :
                                                        intervention.status === 'in_progress' ? 'default' : 'outline'
                                                }>
                                                    {intervention.status === 'pending' ? 'À faire' :
                                                        intervention.status === 'in_progress' ? 'En cours' : 'En attente validation'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Wrench className="w-4 h-4" />
                                                    {intervention.equipment?.name || 'Matériel inconnu'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {intervention.equipment?.location || 'Lieu inconnu'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(intervention.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Actions based on status */}
                                            {intervention.status === 'pending' && (
                                                <Button size="sm" onClick={() => handleStartIntervention(intervention.id)}>
                                                    <PlayCircle className="w-4 h-4 mr-2" />
                                                    Commencer
                                                </Button>
                                            )}

                                            {intervention.status === 'in_progress' && (
                                                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleCompleteIntervention(intervention.id)}>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Terminer Prestation
                                                </Button>
                                            )}

                                            {intervention.status === 'completed' && (
                                                <span className="text-sm text-muted-foreground italic flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    En attente validation retour
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link to="/dashboard/interventions">
                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                    <Wrench className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Historique</h3>
                                    <p className="text-sm text-muted-foreground">Voir toutes mes interventions passées</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                    <Link to="/dashboard/planning">
                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Planning</h3>
                                    <p className="text-sm text-muted-foreground">Voir mon calendrier</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TechnicianDashboard;
