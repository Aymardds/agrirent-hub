import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type ExpenseCategory = 'equipment' | 'personnel' | 'service';
export type ExpenseStatus = 'pending' | 'approved' | 'paid';

export interface Expense {
    id: string;
    category: ExpenseCategory;
    amount: number;
    description: string;
    reference?: string;
    expense_date: string;
    status: ExpenseStatus;
    created_by?: string;
    approved_by?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateExpenseParams {
    category: ExpenseCategory;
    amount: number;
    description: string;
    reference?: string;
    expense_date: string;
    notes?: string;
    status?: ExpenseStatus;
}

/**
 * Hook to fetch all expenses
 */
export const useExpenses = () => {
    return useQuery({
        queryKey: ["expenses"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("expenses")
                .select("*")
                .order("expense_date", { ascending: false });

            if (error) throw error;
            return data as Expense[];
        },
    });
};

/**
 * Hook to fetch expense statistics
 */
export const useExpenseStats = () => {
    return useQuery({
        queryKey: ["expense-stats"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("expenses")
                .select("*");

            if (error) throw error;

            const expenses = data as Expense[];

            const totalQuantity = expenses.length;
            const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

            // By Category
            const byCategory = expenses.reduce((acc, exp) => {
                acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
                return acc;
            }, {} as Record<string, number>);

            // By Status
            const byStatus = expenses.reduce((acc, exp) => {
                acc[exp.status] = (acc[exp.status] || 0) + (exp.amount || 0);
                return acc;
            }, {} as Record<string, number>);

            // Pending count
            const pendingCount = expenses.filter(e => e.status === 'pending').length;

            return {
                totalQuantity,
                totalAmount,
                byCategory,
                byStatus,
                pendingCount
            };
        },
    });
};

/**
 * Hook to create a new expense
 */
export const useCreateExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: CreateExpenseParams) => {
            const { error } = await supabase
                .from("expenses")
                .insert([params]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
            queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
            toast.success("Dépense enregistrée avec succès");
        },
        onError: (error: any) => {
            toast.error("Erreur lors de l'enregistrement: " + error.message);
        },
    });
};

/**
 * Hook to update an expense
 */
export const useUpdateExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateExpenseParams> }) => {
            const { error } = await supabase
                .from("expenses")
                .update(updates)
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
            queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
            toast.success("Dépense mise à jour");
        },
        onError: (error: any) => {
            toast.error("Erreur de mise à jour: " + error.message);
        },
    });
};

/**
 * Hook to delete an expense
 */
export const useDeleteExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("expenses")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
            queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
            toast.success("Dépense supprimée");
        },
        onError: (error: any) => {
            toast.error("Erreur de suppression: " + error.message);
        },
    });
};
