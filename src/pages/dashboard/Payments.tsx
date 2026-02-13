import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Calendar } from "lucide-react";

const Payments = () => {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold font-display">Historique des Paiements</h1>
                    <p className="text-muted-foreground">Journal détaillé des entrées et sorties</p>
                </div>

                <div className="bg-muted/20 border border-dashed rounded-xl p-12 text-center text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">Module en développement</h3>
                    <p>L'historique détaillé des paiements sera bientôt disponible.</p>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default Payments;
