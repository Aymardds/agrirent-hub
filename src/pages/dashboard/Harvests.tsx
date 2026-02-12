import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Loader2,
    Wheat,
    Calendar,
    Home,
    Weight,
    Package,
    Pencil,
    Trash2,
    TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useHarvests, useHarvestStats, useDeleteHarvest } from "@/hooks/useHarvests";
import HarvestForm from "@/components/dashboard/HarvestForm";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
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

const Harvests = () => {
    const { user } = useAuth();
    const { data: harvests, isLoading, refetch } = useHarvests(user?.id);
    const { data: stats } = useHarvestStats(user?.id);
    const deleteHarvest = useDeleteHarvest();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedHarvest, setSelectedHarvest] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleEdit = (harvest: any) => {
        setSelectedHarvest(harvest);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        await deleteHarvest.mutateAsync(deleteId);
        setDeleteId(null);
        refetch();
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setSelectedHarvest(null);
    };

    const filteredHarvests = harvests?.filter(
        (h) =>
            h.crop_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.property?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('fr-FR').format(num);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display">Mes Récoltes</h1>
                        <p className="text-muted-foreground">
                            Enregistrez et suivez vos récoltes par propriété
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setSelectedHarvest(null);
                            setIsFormOpen(true);
                        }}
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" /> Ajouter une récolte
                    </Button>
                </div>

                {/* Statistics Cards */}
                {stats && stats.totalHarvests > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <Wheat className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total récoltes</p>
                                    <p className="text-2xl font-bold">{stats.totalHarvests}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total sacs</p>
                                    <p className="text-2xl font-bold">{formatNumber(stats.totalBags)}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <Weight className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total poids</p>
                                    <p className="text-2xl font-bold">{formatNumber(stats.totalWeightKg)} kg</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Moy. kg/sac</p>
                                    <p className="text-2xl font-bold">{stats.averageKgPerBag.toFixed(1)}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Harvest Comparison Chart */}
                {harvests && harvests.length > 0 && (
                    <Card className="p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold mb-1">Performance des Productions par Propriété</h2>
                            <p className="text-sm text-muted-foreground">
                                Évolution du poids total des récoltes par propriété au fil des années
                            </p>
                        </div>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={(() => {
                                        // Group harvests by year and property
                                        const dataByYear: Record<string, any> = {};

                                        harvests.forEach(h => {
                                            const year = new Date(h.harvest_date).getFullYear().toString();
                                            const propertyName = h.property?.name || 'Sans propriété';

                                            if (!dataByYear[year]) {
                                                dataByYear[year] = { year };
                                            }

                                            // Sum weights for same property in same year
                                            if (!dataByYear[year][propertyName]) {
                                                dataByYear[year][propertyName] = 0;
                                            }
                                            dataByYear[year][propertyName] += h.weight_kg;
                                        });

                                        // Convert to array and sort by year
                                        return Object.values(dataByYear).sort((a, b) =>
                                            parseInt(a.year) - parseInt(b.year)
                                        );
                                    })()}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="year"
                                        className="text-xs"
                                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                        label={{ value: 'Année', position: 'insideBottom', offset: -5 }}
                                    />
                                    <YAxis
                                        className="text-xs"
                                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                        label={{ value: 'Poids Total (kg)', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-background border rounded-lg shadow-lg p-3">
                                                        <p className="font-semibold mb-2">Année {label}</p>
                                                        <div className="space-y-1 text-sm">
                                                            {payload.map((entry: any, index: number) => (
                                                                <p key={index} style={{ color: entry.color }}>
                                                                    {entry.name}: <span className="font-medium">{formatNumber(entry.value)} kg</span>
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend />
                                    {Array.from(new Set(harvests.map(h => h.property?.name || 'Sans propriété'))).map((propertyName, index) => {
                                        const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
                                        return (
                                            <Line
                                                key={propertyName}
                                                type="monotoneX"
                                                dataKey={propertyName}
                                                stroke={colors[index % colors.length]}
                                                strokeWidth={3}
                                                dot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                                                activeDot={{ r: 8, strokeWidth: 2 }}
                                                name={propertyName}
                                                connectNulls
                                            />
                                        );
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                )}

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par culture ou propriété..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Harvests List */}
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : !harvests || harvests.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Wheat className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium mb-2">Aucune récolte enregistrée</h3>
                        <p className="text-muted-foreground mb-4">
                            Commencez à enregistrer vos récoltes pour suivre votre production
                        </p>
                        <Button onClick={() => setIsFormOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter votre première récolte
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredHarvests?.map((harvest) => (
                            <Card key={harvest.id} className="p-5 hover:shadow-md transition-shadow group">
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Wheat className="w-4 h-4 text-green-600" />
                                                <h3 className="font-bold text-lg">{harvest.crop_type}</h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Home className="w-3 h-3" />
                                                <span>{harvest.property?.name}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => handleEdit(harvest)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive"
                                                onClick={() => setDeleteId(harvest.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                            {format(new Date(harvest.harvest_date), 'PPP', { locale: fr })}
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Sacs</p>
                                            <p className="text-lg font-bold">{formatNumber(harvest.quantity_bags)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Poids total</p>
                                            <p className="text-lg font-bold">{formatNumber(harvest.weight_kg)} kg</p>
                                        </div>
                                    </div>

                                    {/* Kg per bag */}
                                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                                        <p className="text-xs text-muted-foreground">Poids moyen/sac</p>
                                        <p className="font-semibold text-primary">{harvest.kg_per_bag.toFixed(2)} kg</p>
                                    </div>

                                    {/* Notes */}
                                    {harvest.notes && (
                                        <div className="text-sm text-muted-foreground italic border-t pt-3">
                                            "{harvest.notes}"
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Harvest Form Dialog */}
                <HarvestForm
                    open={isFormOpen}
                    onOpenChange={handleFormClose}
                    harvest={selectedHarvest}
                    onSuccess={refetch}
                />

                {/* Delete Confirmation */}
                <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette récolte ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible. Les données de cette récolte seront
                                définitivement supprimées.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleDelete}
                            >
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default Harvests;
