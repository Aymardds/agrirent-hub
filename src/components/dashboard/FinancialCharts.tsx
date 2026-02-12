import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useExpenseStats } from "@/hooks/useExpenses";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

export function FinancialCharts() {
    const { data: financialData } = useFinancialData();
    const { data: expenseStats } = useExpenseStats();

    const chartData = financialData?.history || [];

    // Transform category data for PieChart
    const expenseCategoryData = expenseStats?.byCategory
        ? Object.entries(expenseStats.byCategory).map(([name, value]) => {
            let label = name;
            if (name === 'equipment') label = 'Matériel';
            else if (name === 'personnel') label = 'Personnel';
            else if (name === 'service') label = 'Prestation';

            return { name: label, value };
        })
        : [];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount);
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Revenus vs Dépenses (6 derniers mois)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="month"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value / 1000}k`}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Revenus
                                                            </span>
                                                            <span className="font-bold text-green-600">
                                                                {formatCurrency(payload[0].value as number)}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Dépenses
                                                            </span>
                                                            <span className="font-bold text-red-600">
                                                                {formatCurrency(payload[1].value as number)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="revenue" name="Revenus" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" name="Dépenses" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Répartition des Dépenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] flex items-center justify-center">
                        {expenseCategoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenseCategoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {expenseCategoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <span className="text-sm">Aucune dépense</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
