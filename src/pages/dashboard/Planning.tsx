
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import InterventionCalendar from "@/components/dashboard/InterventionCalendar";
import RentalCalendar from "@/components/dashboard/RentalCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InterventionDialog } from "@/components/dashboard/InterventionDialog";
import { Calendar, Wrench, Loader2 } from "lucide-react";

const Planning = () => {
    const { user } = useAuth();
    const [interventions, setInterventions] = useState<any[]>([]);
    const [rentals, setRentals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedIntervention, setSelectedIntervention] = useState<any>(null);

    const role = user?.user_metadata?.role;
    const isTechnician = role === 'technician';
    const isManager = ['stock_manager', 'admin', 'super_admin'].includes(role || '');

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Fetch Interventions
            let intQuery = supabase.from("interventions").select(`
                *,
                equipment:equipment_id (id, name),
                technician:technician_id (id, full_name)
            `);

            if (isTechnician) {
                intQuery = intQuery.or(`technician_id.eq.${user.id},technician_id.is.null`);
            } else if (!isManager) {
                // Clients/others see nothing for now or their own rentals' interventions? 
                // For now just empty for them.
            }

            const { data: intData, error: intError } = await intQuery;
            if (intError) throw intError;
            setInterventions(intData || []);

            // Fetch Rentals
            if (!isTechnician) {
                let rentQuery = supabase.from("rentals").select("*, equipment(name), renter:renter_id(full_name)");

                if (role !== 'super_admin' && isManager) {
                    const { data: myEquipment } = await supabase.from("equipment").select("id").eq("owner_id", user.id);
                    const ids = myEquipment?.map(e => e.id) || [];
                    if (ids.length > 0) {
                        rentQuery = rentQuery.in('equipment_id', ids);
                    } else {
                        setRentals([]);
                    }
                } else if (!isManager && role !== 'super_admin') {
                    rentQuery = rentQuery.eq('renter_id', user.id);
                }

                const { data: rentData, error: rentError } = await rentQuery;
                if (rentError) throw rentError;
                setRentals(rentData || []);
            }
        } catch (error) {
            console.error("Error fetching planning:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, isTechnician, role]);

    const handleDayClick = (day: Date) => {
        if (isManager) {
            setSelectedDate(day);
            setSelectedIntervention(null);
            setIsDialogOpen(true);
        }
    };

    const handleInterventionClick = (intervention: any) => {
        if (isManager) {
            setSelectedIntervention(intervention);
            setSelectedDate(undefined);
            setIsDialogOpen(true);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-display">Planning</h1>
                        <p className="text-muted-foreground">
                            {isTechnician ? "Calendrier de vos interventions" : "Vue d'ensemble de l'activité"}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Tabs defaultValue={isTechnician ? "interventions" : "rentals"} className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
                            <TabsTrigger value="rentals" disabled={isTechnician} className="gap-2">
                                <Calendar className="w-4 h-4" />
                                Locations
                            </TabsTrigger>
                            <TabsTrigger value="interventions" className="gap-2">
                                <Wrench className="w-4 h-4" />
                                Interventions
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="rentals" className="space-y-4">
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <RentalCalendar rentals={rentals} />
                            </div>
                        </TabsContent>

                        <TabsContent value="interventions" className="space-y-4">
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <InterventionCalendar
                                    interventions={interventions}
                                    onDayClick={isManager ? handleDayClick : undefined}
                                    onInterventionClick={isManager ? handleInterventionClick : undefined}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            <InterventionDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={fetchData}
                selectedDate={selectedDate}
                intervention={selectedIntervention}
            />
        </DashboardLayout>
    );
};

export default Planning;
