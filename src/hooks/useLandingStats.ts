import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface LandingStats {
    equipmentCount: number;
    rentalsCount: number;
    usersCount: number;
    totalRevenue: number;
    equipmentAddedThisMonth: number;
    occupancyRate: number;
}

export const useLandingStats = () => {
    return useQuery({
        queryKey: ["landing-stats"],
        queryFn: async (): Promise<LandingStats> => {
            const { data, error } = await supabase.rpc('get_landing_stats');

            if (error) {
                console.error("Error fetching landing stats:", error);
                throw error;
            }

            // Map snake_case from SQL to camelCase for TS
            return {
                equipmentCount: data?.equipment_count || 0,
                rentalsCount: data?.rentals_count || 0,
                usersCount: data?.users_count || 0,
                totalRevenue: data?.total_revenue || 0,
                equipmentAddedThisMonth: data?.equipment_added_this_month || 0,
                occupancyRate: data?.occupancy_rate || 0
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
