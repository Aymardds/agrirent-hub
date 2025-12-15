import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Calendar } from "lucide-react";

const Stats = () => {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold font-display">Statistiques Détaillées</h1>
                    <p className="text-muted-foreground">Analyses et rapports de performance</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Taux de conversion</p>
                                <h3 className="text-2xl font-bold">12.5%</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-success/10 text-success rounded-xl">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                                <h3 className="text-2xl font-bold">2.4M FCFA</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Nouveaux Clients</p>
                                <h3 className="text-2xl font-bold">+18</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Locations Actives</p>
                                <h3 className="text-2xl font-bold">24</h3>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="bg-muted/20 border border-dashed rounded-xl p-12 text-center text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">Graphiques détaillés</h3>
                    <p>Cette section sera bientôt disponible avec des graphiques interactifs.</p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Stats;
