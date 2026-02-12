import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns";
import { fr } from "date-fns/locale";

export interface GlobalFinancialStats {
    totalRevenue: number;
    totalExpenses: number;
    netBalance: number;
    pendingRevenue: number;
    pendingExpenses: number;
    revenueGrowth: number; // vs last month
    expenseGrowth: number; // vs last month
}

export interface MonthlyFinancialData {
    month: string;
    revenue: number;
    expenses: number;
    balance: number;
}

/**
 * Hook to fetch aggregared financial data
 */
export const useFinancialData = () => {
    return useQuery({
        queryKey: ["financial-stats"],
        queryFn: async () => {
            // 1. Fetch total revenue (sum of all payments)
            const { data: payments, error: paymentsError } = await supabase
                .from("payment_transactions")
                .select("amount, created_at");

            if (paymentsError) throw paymentsError;

            // 2. Fetch total expenses (sum of paid expenses)
            const { data: expenses, error: expensesError } = await supabase
                .from("expenses")
                .select("amount, expense_date, status");

            if (expensesError) throw expensesError;

            // 3. Fetch pending revenue (active credits)
            const { data: credits, error: creditsError } = await supabase
                .from("credits")
                .select("amount_remaining")
                .eq("status", "active");

            if (creditsError) throw creditsError;

            // --- Calculations ---

            // Totals
            const totalRevenue = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
            const totalExpenses = expenses?.filter(e => e.status === 'paid').reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;
            const netBalance = totalRevenue - totalExpenses;

            // Pending
            const pendingRevenue = credits?.reduce((sum, c) => sum + (Number(c.amount_remaining) || 0), 0) || 0;
            const pendingExpenses = expenses?.filter(e => e.status === 'pending').reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;

            // Growth Calculation (Current Month vs Last Month)
            const now = new Date();
            const currentMonthStart = startOfMonth(now);
            const lastMonthStart = startOfMonth(subMonths(now, 1));
            const lastMonthEnd = endOfMonth(subMonths(now, 1));

            const currentMonthRevenue = payments?.filter(p => new Date(p.created_at) >= currentMonthStart).reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
            const lastMonthRevenue = payments?.filter(p => new Date(p.created_at) >= lastMonthStart && new Date(p.created_at) <= lastMonthEnd).reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

            const currentMonthExpenses = expenses?.filter(e => e.status === 'paid' && new Date(e.expense_date) >= currentMonthStart).reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;
            const lastMonthExpenses = expenses?.filter(e => e.status === 'paid' && new Date(e.expense_date) >= lastMonthStart && new Date(e.expense_date) <= lastMonthEnd).reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;

            const revenueGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
            const expenseGrowth = lastMonthExpenses > 0 ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

            // Monthly Data for Charts (Last 6 months)
            const chartData: MonthlyFinancialData[] = [];
            for (let i = 5; i >= 0; i--) {
                const date = subMonths(now, i);
                const monthStart = startOfMonth(date);
                const monthEnd = endOfMonth(date);
                const monthName = format(date, 'MMM', { locale: fr });

                const monthRev = payments?.filter(p => {
                    const d = new Date(p.created_at);
                    return d >= monthStart && d <= monthEnd;
                }).reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

                const monthExp = expenses?.filter(e => {
                    const d = new Date(e.expense_date);
                    return e.status === 'paid' && d >= monthStart && d <= monthEnd;
                }).reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;

                chartData.push({
                    month: monthName,
                    revenue: monthRev,
                    expenses: monthExp,
                    balance: monthRev - monthExp
                });
            }

            return {
                stats: {
                    totalRevenue,
                    totalExpenses,
                    netBalance,
                    pendingRevenue,
                    pendingExpenses,
                    revenueGrowth,
                    expenseGrowth
                },
                history: chartData
            };
        }
    });
};
