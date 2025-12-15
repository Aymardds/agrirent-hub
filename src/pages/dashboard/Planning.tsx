import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import InterventionCalendar from "@/components/dashboard/InterventionCalendar";
import RentalCalendar from "@/components/dashboard/RentalCalendar";

const Planning = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const role = user?.user_metadata?.role;
    const isTechnician = role === 'technician';

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);

            try {
                if (isTechnician) {
                    // Fetch Interventions
                    let query = supabase.from("interventions").select("*, equipment(name)");
                    // Technicians see their own or unassigned
                    // Actually, for Planning, they might want to see team planning? 
                    // Usually just theirs.
                    query = query.or(`technician_id.eq.${user.id},technician_id.is.null`);

                    const { data, error } = await query;
                    if (error) throw error;
                    setEvents(data || []);
                } else {
                    // Fetch Rentals (For Stock Manager/Admin)
                    let query = supabase.from("rentals").select("*, equipment(name), renter:renter_id(full_name)");

                    // Filter by owner if not super_admin
                    if (role !== 'super_admin') {
                        // This complex filter again. 
                        // Simplified: fetch all and filter in memory or use !inner join logic if needed.
                        // Let's use the !inner logic for consistency with Accounting.
                        const { data: myEquipment } = await supabase.from("equipment").select("id").eq("owner_id", user.id);
                        const ids = myEquipment?.map(e => e.id) || [];
                        if (ids.length > 0) {
                            query = query.in('equipment_id', ids);
                        } else {
                            if (role !== 'super_admin') {
                                setEvents([]);
                                setLoading(false);
                                return;
                            }
                        }
                    }

                    const { data, error } = await query;
                    if (error) throw error;
                    setEvents(data || []);
                }
            } catch (error) {
                console.error("Error fetching planning:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, isTechnician, role]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold font-display">Planning</h1>
                    <p className="text-muted-foreground">
                        {isTechnician ? "Calendrier des interventions" : "Calendrier des locations"}
                    </p>
                </div>

                {loading ? (
                    <div>Chargement...</div>
                ) : (
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        {isTechnician ? (
                            <InterventionCalendar interventions={events} />
                        ) : (
                            <RentalCalendar rentals={events} />
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Planning;
