import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Hook pour récupérer les statistiques du dashboard
 */
export const useDashboardStats = () => {
    return useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            // Récupérer le nombre total d'utilisateurs
            const { count: usersCount, error: usersError } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true });

            if (usersError) throw usersError;

            // Récupérer le nombre total de matériels
            const { count: equipmentCount, error: equipmentError } = await supabase
                .from("equipment")
                .select("*", { count: "exact", head: true });

            if (equipmentError) throw equipmentError;

            // Récupérer les locations actives
            const { count: activeRentalsCount, error: rentalsError } = await supabase
                .from("rentals")
                .select("*", { count: "exact", head: true })
                .eq("status", "active");

            if (rentalsError) throw rentalsError;

            // Calculer les revenus du mois en cours
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { data: monthlyRentals, error: monthlyError } = await supabase
                .from("rentals")
                .select("total_price")
                .gte("created_at", startOfMonth.toISOString())
                .eq("status", "completed");

            if (monthlyError) throw monthlyError;

            const monthlyRevenue = monthlyRentals?.reduce(
                (sum, rental) => sum + (rental.total_price || 0),
                0
            ) || 0;

            // Calculer les revenus du mois précédent pour le pourcentage de changement
            const startOfLastMonth = new Date(startOfMonth);
            startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
            const endOfLastMonth = new Date(startOfMonth);
            endOfLastMonth.setTime(endOfLastMonth.getTime() - 1);

            const { data: lastMonthRentals } = await supabase
                .from("rentals")
                .select("total_price")
                .gte("created_at", startOfLastMonth.toISOString())
                .lte("created_at", endOfLastMonth.toISOString())
                .eq("status", "completed");

            const lastMonthRevenue = lastMonthRentals?.reduce(
                (sum, rental) => sum + (rental.total_price || 0),
                0
            ) || 0;

            const revenueChange =
                lastMonthRevenue > 0
                    ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
                    : 0;

            return {
                usersCount: usersCount || 0,
                equipmentCount: equipmentCount || 0,
                activeRentalsCount: activeRentalsCount || 0,
                monthlyRevenue,
                revenueChange,
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook pour récupérer les locations récentes
 */
export const useRecentRentals = (limit = 4) => {
    return useQuery({
        queryKey: ["recent-rentals", limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("rentals")
                .select(
                    `
          id,
          status,
          created_at,
          start_date,
          end_date,
          total_price,
          equipment:equipment_id (
            id,
            name,
            type
          ),
          client:renter_id (
            id,
            full_name,
            company
          )
        `
                )
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error) throw error;

            return data || [];
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
};

/**
 * Hook pour récupérer les statistiques de performance du mois
 */
export const useMonthlyPerformance = () => {
    return useQuery({
        queryKey: ["monthly-performance"],
        queryFn: async () => {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            // Récupérer toutes les locations du mois
            const { data: rentals, error } = await supabase
                .from("rentals")
                .select("status, created_at")
                .gte("created_at", startOfMonth.toISOString());

            if (error) throw error;

            const completed = rentals?.filter((r) => r.status === "completed").length || 0;
            const pending = rentals?.filter((r) => r.status === "pending").length || 0;
            const active = rentals?.filter((r) => r.status === "active").length || 0;

            // Calculer les retards (locations actives dont la date de fin est dépassée)
            const { data: overdueRentals, error: overdueError } = await supabase
                .from("rentals")
                .select("id")
                .eq("status", "active")
                .lt("end_date", new Date().toISOString());

            if (overdueError) throw overdueError;

            const overdue = overdueRentals?.length || 0;

            // Calculer le taux d'occupation
            const { count: totalEquipment } = await supabase
                .from("equipment")
                .select("*", { count: "exact", head: true })
                .eq("status", "available");

            const { count: rentedEquipment } = await supabase
                .from("rentals")
                .select("equipment_id", { count: "exact", head: true })
                .eq("status", "active");

            const occupancyRate =
                totalEquipment && totalEquipment > 0
                    ? Math.round(((rentedEquipment || 0) / totalEquipment) * 100)
                    : 0;

            return {
                completed,
                pending,
                active,
                overdue,
                occupancyRate,
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook pour récupérer les statistiques utilisateur (pour le mois précédent)
 */
export const useUserGrowth = () => {
    return useQuery({
        queryKey: ["user-growth"],
        queryFn: async () => {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const startOfLastMonth = new Date(startOfMonth);
            startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

            // Utilisateurs ce mois
            const { count: thisMonth } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .gte("created_at", startOfMonth.toISOString());

            // Utilisateurs le mois dernier
            const { count: lastMonth } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true })
                .gte("created_at", startOfLastMonth.toISOString())
                .lt("created_at", startOfMonth.toISOString());

            const growth =
                lastMonth && lastMonth > 0
                    ? Math.round(((thisMonth || 0) - lastMonth) / lastMonth * 100)
                    : 0;

            return {
                thisMonth: thisMonth || 0,
                lastMonth: lastMonth || 0,
                growth,
            };
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};

/**
 * Hook pour récupérer la croissance du matériel
 */
export const useEquipmentGrowth = () => {
    return useQuery({
        queryKey: ["equipment-growth"],
        queryFn: async () => {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            // Matériel ajouté ce mois
            const { count: addedThisMonth } = await supabase
                .from("equipment")
                .select("*", { count: "exact", head: true })
                .gte("created_at", startOfMonth.toISOString());

            return {
                addedThisMonth: addedThisMonth || 0,
            };
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
};
