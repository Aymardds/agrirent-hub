import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Pencil, Trash2, Search, FilterX } from "lucide-react";
import { useExpenses, useDeleteExpense, Expense } from "@/hooks/useExpenses";
import { ExpenseForm } from "./ExpenseForm";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ExpensesList() {
    const { data: expenses, isLoading } = useExpenses();
    const deleteExpense = useDeleteExpense();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleEdit = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (deleteId) {
            await deleteExpense.mutateAsync(deleteId);
            setDeleteId(null);
        }
    };

    const handleCreate = () => {
        setSelectedExpense(null);
        setIsFormOpen(true);
    };

    const filteredExpenses = expenses?.filter((expense) => {
        const matchesSearch =
            expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.reference?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || expense.status === statusFilter;
        const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "paid":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Payé</Badge>;
            case "approved":
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">Approuvé</Badge>;
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">En attente</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case "equipment": return "Matériel";
            case "personnel": return "Personnel";
            case "service": return "Prestation";
            default: return category;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-1 gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous statuts</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="approved">Approuvé</SelectItem>
                            <SelectItem value="paid">Payé</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes cat.</SelectItem>
                            <SelectItem value="equipment">Matériel</SelectItem>
                            <SelectItem value="personnel">Personnel</SelectItem>
                            <SelectItem value="service">Prestation</SelectItem>
                        </SelectContent>
                    </Select>

                    {(searchTerm || statusFilter !== "all" || categoryFilter !== "all") && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("all");
                                setCategoryFilter("all");
                            }}
                        >
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <Button onClick={handleCreate}>+ Nouvelle dépense</Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Chargement...
                                </TableCell>
                            </TableRow>
                        ) : filteredExpenses?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Aucune dépense trouvée.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredExpenses?.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>
                                        {format(new Date(expense.expense_date), "dd MMM yyyy", { locale: fr })}
                                    </TableCell>
                                    <TableCell className="font-medium">{expense.description}</TableCell>
                                    <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {expense.reference || "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(expense.amount)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(expense)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => setDeleteId(expense.id)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ExpenseForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                expense={selectedExpense}
            />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Cette dépense sera définitivement supprimée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
