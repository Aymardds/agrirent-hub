import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ExpensesList } from "@/components/dashboard/ExpensesList";

const Expenses = () => {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-display mb-2">
                        Gestion des Dépenses
                    </h1>
                    <p className="text-muted-foreground">
                        Suivez et gérez les dépenses liées au matériel, au personnel et aux prestations.
                    </p>
                </div>

                <div className="bg-card rounded-lg border p-6 shadow-sm">
                    <ExpensesList />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Expenses;
