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

            if (equipmentCount === null && equipmentError) throw equipmentError;

            // Récupérer les locations actives
            const { count: activeRentalsCount, error: rentalsError } = await supabase
                .from("rentals")
                .select("*", { count: "exact", head: true })
                .eq("status", "active");

            if (rentalsError) {
                console.warn("Error fetching active rentals:", rentalsError);
            }

            // Récupérer toutes les transactions terminées (payées ou complétées) pour les stats globales
            const { data: allTransactions, error: transactionsError } = await supabase
                .from("rentals")
                .select(`
                    total_price,
                    status,
                    equipment!inner (
                        service_type
                    )
                `)
                .eq("status", "completed");

            if (transactionsError) {
                console.warn("Error fetching transactions:", transactionsError);
            }

            // Calculer les métriques globales
            let completedRentals = 0;
            let completedSales = 0;
            let totalRevenue = 0;

            allTransactions?.forEach((t: any) => {
                const serviceType = t.equipment?.service_type || "location";
                const price = t.total_price || 0;
                totalRevenue += price;

                if (serviceType === "vente") {
                    completedSales++;
                } else {
                    completedRentals++;
                }
            });


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

            // Récupérer la superficie totale traitée (area_covered) depuis les interventions terminées
            // Jointure logique avec equipment pour filtrer par catégorie
            const { data: areaData, error: areaError } = await supabase
                .from("interventions")
                .select(`
                    area_covered,
                    equipment (
                        category
                    )
                `)
                .in("status", ["completed", "validated"]);

            if (areaError) throw areaError;

            let totalArea = 0;
            let labouredArea = 0;
            let harvestedArea = 0;

            areaData?.forEach((item: any) => {
                const area = item.area_covered || 0;
                const category = item.equipment?.category;

                totalArea += area;
                if (category === 'Tracteurs') labouredArea += area;
                if (category === 'Moissonneuses') harvestedArea += area;
            });

            // Récupérer le nombre de matériels loués (en cours)
            const { count: rentedEquipmentCount } = await supabase
                .from("equipment")
                .select("*", { count: "exact", head: true })
                .eq("status", "rented");

            // Récupérer les statistiques sur les paysans (clients)
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("gender")
                .eq("role", "client");

            if (profileError) throw profileError;

            const peasantCount = profileData?.length || 0;
            const womenCount = profileData?.filter(p => p.gender === 'femme').length || 0;
            const womenPercentage = peasantCount > 0 ? Math.round((womenCount / peasantCount) * 100) : 0;

            return {
                usersCount: usersCount || 0,
                equipmentCount: equipmentCount || 0,
                activeRentalsCount: activeRentalsCount || 0,
                monthlyRevenue,
                revenueChange,
                completedRentals,
                completedSales,
                totalRevenue,
                totalTransactions: completedRentals + completedSales,
                totalArea,
                labouredArea,
                harvestedArea,
                rentedEquipmentCount: rentedEquipmentCount || 0,
                peasantCount,
                womenPercentage,
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook pour récupérer les statistiques du dashboard Client (Agriculteur / Coopérative)
 */
export const useClientDashboardStats = (userId: string | undefined) => {
    return useQuery({
        queryKey: ["client-dashboard-stats", userId],
        enabled: !!userId,
        queryFn: async () => {
            // 1. Récupérer le profil pour les superficies et la localité
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("total_area_available, cultivated_area, locality")
                .eq("id", userId)
                .single();

            if (profileError) throw profileError;

            // 2. Récupérer les propriétés du client pour la superficie totale
            const { data: properties, error: propertiesError } = await supabase
                .from("properties")
                .select("size, unit")
                .eq("owner_id", userId);

            if (propertiesError) throw propertiesError;

            const totalAreaAvailable = properties?.reduce((sum, p) => {
                // Pour l'instant on additionne tout, mais on pourrait différencier hectares et casiers
                return sum + (p.size || 0);
            }, 0) || 0;

            // 3. Récupérer toutes les prestations du client
            const { data: rentals, error: rentalsError } = await supabase
                .from("rentals")
                .select(`
                    id,
                    total_price,
                    status,
                    payment_status,
                    prestation_type,
                    planned_area,
                    created_at
                `)
                .eq("renter_id", userId);

            if (rentalsError) throw rentalsError;

            let totalAmount = 0;
            let paidAmount = 0;
            let transactionCount = rentals?.length || 0;
            let pendingPrestations = rentals?.filter(r => r.status === 'pending' || r.status === 'active').length || 0;

            let completedArea = 0;
            let totalPlannedArea = 0;

            rentals?.forEach(r => {
                totalAmount += r.total_price || 0;
                if (r.payment_status === 'paid') {
                    paidAmount += r.total_price || 0;
                }

                totalPlannedArea += r.planned_area || 0;
                if (r.status === 'completed') {
                    completedArea += r.planned_area || 0;
                }
            });

            const remainingAmount = totalAmount - paidAmount;
            const recoveryRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
            const executionRate = totalPlannedArea > 0 ? Math.round((completedArea / totalPlannedArea) * 100) : 0;

            const prestationTypes = rentals?.map(r => r.prestation_type).filter(Boolean);
            const mainPrestationType = prestationTypes?.length ? prestationTypes[0] : "Aucune";

            return {
                mainPrestationType,
                totalAreaAvailable,
                propertiesCount: properties?.length || 0,
                cultivatedArea: profile?.cultivated_area || 0,
                locality: profile?.locality || "Non renseignée",
                transactionCount,
                totalAmount,
                executionRate,
                completedArea,
                pendingPrestations,
                paidAmount,
                remainingAmount,
                recoveryRate
            };
        },
        staleTime: 1000 * 60 * 5,
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
            category
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
