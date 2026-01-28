import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wallet, Tractor, Activity } from "lucide-react";

interface ClientDashboardChartsProps {
  stats: {
    totalAreaAvailable: number;
    cultivatedArea: number;
    completedArea: number;
    transactionCount: number;
    pendingPrestations: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  } | undefined;
}

const ClientDashboardCharts = ({ stats }: ClientDashboardChartsProps) => {
  if (!stats) return null;

  // Data for Area/Operations Chart
  const areaData = [
    { name: "Disponible", value: stats.totalAreaAvailable },
    { name: "Emblavé", value: stats.cultivatedArea },
    { name: "Traité", value: stats.completedArea },
  ];

  // Data for Activity Chart
  const activityData = [
    { name: "Total", value: stats.transactionCount },
    { name: "En attente", value: stats.pendingPrestations },
    { name: "Terminé", value: stats.transactionCount - stats.pendingPrestations },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Operations Area Chart */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tractor className="w-5 h-5 text-blue-500" />
            Exploitation (Ha)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs font-medium"
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value: number) => [`${value} ha`, "Superficie"]}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                  {areaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#94a3b8" : index === 1 ? "#3b82f6" : "#22c55e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Activity Chart */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-orange-500" />
            Activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs font-medium"
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40}>
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#94a3b8" : index === 1 ? "#f97316" : "#22c55e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboardCharts;
