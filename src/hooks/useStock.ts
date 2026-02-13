import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface ServicePrice {
    amount: number;
    unit: string;
}

export interface Service {
    id?: string;
    name: string;
    description: string;
    prices: ServicePrice[];
}

export interface Equipment {
    id: string;
    name: string;
    category: string;
    service_type: string;
    price: number;
    price_unit: string;
    location: string;
    description: string;
    image_url: string;
    gallery: string[];
    status: "available" | "rented" | "maintenance";
    owner_id: string;
    equipment_services?: Service[];
}

interface UseStockOptions {
    userId: string | undefined;
    canManage: boolean;
}

export const useStock = ({ userId, canManage }: UseStockOptions) => {
    const queryClient = useQueryClient();

    const { data: equipment = [], isLoading, error, refetch } = useQuery({
        queryKey: ['stock', userId, canManage],
        queryFn: async () => {
            if (!userId) return [];

            let query = supabase
                .from("equipment")
                .select("*, equipment_services(*)")
                .order('created_at', { ascending: false });

            // If not a manager/admin, only show own equipment
            if (!canManage) {
                query = query.eq('owner_id', userId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Equipment[];
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const deleteEquipmentMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("equipment").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stock'] });
            toast.success("Équipement supprimé");
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    return {
        equipment,
        isLoading,
        error,
        refetch,
        deleteEquipment: deleteEquipmentMutation.mutateAsync
    };
};
