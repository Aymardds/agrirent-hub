import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Harvest {
    id: string;
    property_id: string;
    farmer_id: string;
    harvest_date: string;
    crop_type: string;
    quantity_bags: number;
    weight_kg: number;
    kg_per_bag: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    property?: {
        name: string;
        size: number;
        unit: string;
        locality?: string;
    };
}

export interface HarvestStats {
    totalHarvests: number;
    totalBags: number;
    totalWeightKg: number;
    averageKgPerBag: number;
    harvestsByProperty: {
        property_id: string;
        property_name: string;
        count: number;
        total_bags: number;
        total_kg: number;
    }[];
}

// Fetch all harvests for a user
export const useHarvests = (userId?: string) => {
    return useQuery({
        queryKey: ['harvests', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('harvests')
                .select(`
          *,
          property:property_id (name, size, unit, locality)
        `)
                .eq('farmer_id', userId!)
                .order('harvest_date', { ascending: false });

            if (error) throw error;
            return data as Harvest[];
        },
        enabled: !!userId,
    });
};

// Fetch harvests for a specific property
export const useHarvestsByProperty = (propertyId?: string) => {
    return useQuery({
        queryKey: ['harvests', 'property', propertyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('harvests')
                .select(`
          *,
          property:property_id (name, size, unit, locality)
        `)
                .eq('property_id', propertyId!)
                .order('harvest_date', { ascending: false });

            if (error) throw error;
            return data as Harvest[];
        },
        enabled: !!propertyId,
    });
};

// Create a new harvest record
export const useCreateHarvest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (harvest: {
            property_id: string;
            farmer_id: string;
            harvest_date: string;
            crop_type: string;
            quantity_bags: number;
            weight_kg: number;
            notes?: string;
        }) => {
            const { data, error } = await supabase
                .from('harvests')
                .insert([harvest])
                .select(`
          *,
          property:property_id (name, size, unit, locality)
        `)
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['harvests'] });
            queryClient.invalidateQueries({ queryKey: ['harvest-stats'] });
            toast.success('Récolte enregistrée avec succès');
        },
        onError: (error: any) => {
            toast.error('Erreur: ' + error.message);
        },
    });
};

// Update a harvest record
export const useUpdateHarvest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            updates,
        }: {
            id: string;
            updates: Partial<{
                harvest_date: string;
                crop_type: string;
                quantity_bags: number;
                weight_kg: number;
                notes: string;
            }>;
        }) => {
            const { data, error } = await supabase
                .from('harvests')
                .update(updates)
                .eq('id', id)
                .select(`
          *,
          property:property_id (name, size, unit, locality)
        `)
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['harvests'] });
            queryClient.invalidateQueries({ queryKey: ['harvest-stats'] });
            toast.success('Récolte mise à jour');
        },
        onError: (error: any) => {
            toast.error('Erreur: ' + error.message);
        },
    });
};

// Delete a harvest record
export const useDeleteHarvest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (harvestId: string) => {
            const { error } = await supabase
                .from('harvests')
                .delete()
                .eq('id', harvestId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['harvests'] });
            queryClient.invalidateQueries({ queryKey: ['harvest-stats'] });
            toast.success('Récolte supprimée');
        },
        onError: (error: any) => {
            toast.error('Erreur: ' + error.message);
        },
    });
};

// Get harvest statistics
export const useHarvestStats = (userId?: string) => {
    return useQuery({
        queryKey: ['harvest-stats', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('harvests')
                .select(`
          *,
          property:property_id (name)
        `)
                .eq('farmer_id', userId!);

            if (error) throw error;

            const stats: HarvestStats = {
                totalHarvests: data.length,
                totalBags: 0,
                totalWeightKg: 0,
                averageKgPerBag: 0,
                harvestsByProperty: [],
            };

            const propertyMap: {
                [key: string]: {
                    property_id: string;
                    property_name: string;
                    count: number;
                    total_bags: number;
                    total_kg: number;
                };
            } = {};

            data.forEach((harvest: any) => {
                stats.totalBags += harvest.quantity_bags;
                stats.totalWeightKg += harvest.weight_kg;

                const propId = harvest.property_id;
                if (!propertyMap[propId]) {
                    propertyMap[propId] = {
                        property_id: propId,
                        property_name: harvest.property?.name || 'Propriété inconnue',
                        count: 0,
                        total_bags: 0,
                        total_kg: 0,
                    };
                }

                propertyMap[propId].count++;
                propertyMap[propId].total_bags += harvest.quantity_bags;
                propertyMap[propId].total_kg += harvest.weight_kg;
            });

            stats.averageKgPerBag = stats.totalBags > 0 ? stats.totalWeightKg / stats.totalBags : 0;
            stats.harvestsByProperty = Object.values(propertyMap);

            return stats;
        },
        enabled: !!userId,
    });
};
