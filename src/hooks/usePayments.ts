import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface PaymentTransaction {
    id: string;
    rental_id: string;
    amount: number;
    payment_method: 'cash' | 'credit' | 'mobile_money';
    transaction_reference?: string;
    payment_date: string;
    notes?: string;
    created_by: string;
    created_at: string;
}

export interface Credit {
    id: string;
    rental_id: string;
    property_id?: string;
    client_id: string;
    total_amount: number;
    amount_paid: number;
    amount_remaining: number;
    due_date?: string;
    installments: number;
    interest_rate: number;
    status: 'active' | 'paid' | 'overdue' | 'cancelled';
    notes?: string;
    created_at: string;
    updated_at: string;
    property?: {
        name: string;
        locality?: string;
    };
    rental?: {
        equipment?: {
            name: string;
        };
    };
}

export interface CreditByProperty {
    property_id: string;
    property_name: string;
    total_credits: number;
    total_paid: number;
    total_remaining: number;
    credits: Credit[];
}

// Fetch payment transactions for a rental
export const usePaymentTransactions = (rentalId?: string) => {
    return useQuery({
        queryKey: ['payment-transactions', rentalId],
        queryFn: async () => {
            let query = supabase
                .from('payment_transactions')
                .select('*')
                .order('payment_date', { ascending: false });

            if (rentalId) {
                query = query.eq('rental_id', rentalId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as PaymentTransaction[];
        },
        enabled: !!rentalId,
    });
};

// Create a new payment transaction
export const useCreatePayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payment: {
            rental_id: string;
            amount: number;
            payment_method: 'cash' | 'credit' | 'mobile_money';
            transaction_reference?: string;
            notes?: string;
            created_by: string;
        }) => {
            const { data, error } = await supabase
                .from('payment_transactions')
                .insert([payment])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['rentals'] });
            toast.success('Paiement enregistré avec succès');
        },
        onError: (error: any) => {
            toast.error('Erreur: ' + error.message);
        },
    });
};

// Fetch all credits for a user
export const useCredits = (userId?: string) => {
    return useQuery({
        queryKey: ['credits', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('credits')
                .select(`
          *,
          property:property_id (name, locality),
          rental:rental_id (
            equipment:equipment_id (name)
          )
        `)
                .eq('client_id', userId!)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Credit[];
        },
        enabled: !!userId,
    });
};

// Fetch credits grouped by property
export const useCreditsByProperty = (userId?: string) => {
    return useQuery({
        queryKey: ['credits-by-property', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('credits')
                .select(`
          *,
          property:property_id (name, locality)
        `)
                .eq('client_id', userId!)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Group credits by property
            const creditsByProperty: { [key: string]: CreditByProperty } = {};

            data.forEach((credit: any) => {
                const propertyId = credit.property_id || 'no-property';
                const propertyName = credit.property?.name || 'Sans propriété';

                if (!creditsByProperty[propertyId]) {
                    creditsByProperty[propertyId] = {
                        property_id: propertyId,
                        property_name: propertyName,
                        total_credits: 0,
                        total_paid: 0,
                        total_remaining: 0,
                        credits: [],
                    };
                }

                creditsByProperty[propertyId].total_credits += credit.total_amount;
                creditsByProperty[propertyId].total_paid += credit.amount_paid;
                creditsByProperty[propertyId].total_remaining += credit.amount_remaining;
                creditsByProperty[propertyId].credits.push(credit);
            });

            return Object.values(creditsByProperty);
        },
        enabled: !!userId,
    });
};

// Create a new credit
export const useCreateCredit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (credit: {
            rental_id: string;
            property_id?: string;
            client_id: string;
            total_amount: number;
            due_date?: string;
            installments?: number;
            interest_rate?: number;
            notes?: string;
        }) => {
            const { data, error } = await supabase
                .from('credits')
                .insert([credit])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['credits'] });
            queryClient.invalidateQueries({ queryKey: ['credits-by-property'] });
            toast.success('Crédit enregistré avec succès');
        },
        onError: (error: any) => {
            toast.error('Erreur: ' + error.message);
        },
    });
};

// Update credit payment
export const useUpdateCreditPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            creditId,
            paymentAmount,
        }: {
            creditId: string;
            paymentAmount: number;
        }) => {
            // First, get the current credit
            const { data: credit, error: fetchError } = await supabase
                .from('credits')
                .select('amount_paid, total_amount')
                .eq('id', creditId)
                .single();

            if (fetchError) throw fetchError;

            const newAmountPaid = credit.amount_paid + paymentAmount;
            const newStatus = newAmountPaid >= credit.total_amount ? 'paid' : 'active';

            // Update the credit
            const { data, error } = await supabase
                .from('credits')
                .update({
                    amount_paid: newAmountPaid,
                    status: newStatus,
                })
                .eq('id', creditId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['credits'] });
            queryClient.invalidateQueries({ queryKey: ['credits-by-property'] });
            toast.success('Paiement de crédit enregistré');
        },
        onError: (error: any) => {
            toast.error('Erreur: ' + error.message);
        },
    });
};

// Get credit summary stats
export const useCreditStats = (userId?: string) => {
    return useQuery({
        queryKey: ['credit-stats', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('credits')
                .select('total_amount, amount_paid, amount_remaining, status')
                .eq('client_id', userId!);

            if (error) throw error;

            const stats = {
                totalCredits: 0,
                totalPaid: 0,
                totalRemaining: 0,
                activeCredits: 0,
                overdueCredits: 0,
            };

            data.forEach((credit: any) => {
                stats.totalCredits += credit.total_amount;
                stats.totalPaid += credit.amount_paid;
                stats.totalRemaining += credit.amount_remaining;
                if (credit.status === 'active') stats.activeCredits++;
                if (credit.status === 'overdue') stats.overdueCredits++;
            });

            return stats;
        },
        enabled: !!userId,
    });
};
