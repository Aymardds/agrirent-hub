import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

const Credits = () => {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold font-display">Gestion des Crédits</h1>
                    <p className="text-muted-foreground">Suivi des crédits et avoirs clients</p>
                </div>

                <div className="bg-muted/20 border border-dashed rounded-xl p-12 text-center text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">Module en développement</h3>
                    <p>La gestion des crédits sera bientôt disponible.</p>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default Credits;
