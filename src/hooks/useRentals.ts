import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface Rental {
    id: string;
    start_date: string;
    end_date: string;
    total_price: number;
    status: "pending" | "active" | "completed" | "cancelled";
    payment_status: "pending" | "paid" | "failed";
    prestation_type?: string;
    invoice_number?: string;
    properties?: {
        name: string;
        unit?: string;
    };
    equipment: {
        name: string;
        image_url: string;
        location: string;
        owner_id: string;
    };
    renter?: {
        full_name: string;
        phone: string;
    };
    interventions?: {
        technician?: {
            full_name: string;
        };
        area_covered?: number;
        created_at?: string;
    }[];
}

interface UseRentalsOptions {
    userId: string | undefined;
    activeTab: string;
    filter?: string | null;
}

export const useRentals = ({ userId, activeTab, filter }: UseRentalsOptions) => {
    const queryClient = useQueryClient();

    const { data: rentals = [], isLoading, error, refetch } = useQuery({
        queryKey: ['rentals', userId, activeTab, filter],
        queryFn: async () => {
            if (!userId) return [];

            let query = supabase.from("rentals").select(`
                *,
                equipment (name, image_url, location, owner_id),
                properties (name, unit),
                interventions (technician:technician_id (full_name), area_covered, created_at),
                prestation_type,
                renter:renter_id (full_name, phone)
            `);

            if (activeTab === "tenant") {
                query = query.eq("renter_id", userId);
                if (filter === 'unpaid') {
                    query = query.neq('payment_status', 'paid');
                }
            } else {
                // Owner / Planning tab
                const { data: myEquipment } = await supabase
                    .from("equipment")
                    .select("id")
                    .eq("owner_id", userId);

                const myEquipmentIds = myEquipment?.map(e => e.id) || [];

                if (myEquipmentIds.length === 0) {
                    return [];
                }

                query = query.in("equipment_id", myEquipmentIds);
            }

            const { data, error } = await query.order("created_at", { ascending: false });
            if (error) throw error;
            return data as Rental[];
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    // Mutations for updates
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { error } = await supabase.from("rentals").update({ status }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rentals'] });
            toast.success("Statut mis à jour");
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const updatePaymentStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { error } = await supabase.from("rentals").update({ payment_status: status }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rentals'] });
            toast.success("Statut de paiement mis à jour");
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    return {
        rentals,
        isLoading,
        error,
        refetch,
        updateStatus: updateStatusMutation.mutate,
        updatePaymentStatus: updatePaymentStatusMutation.mutate
    };
};
