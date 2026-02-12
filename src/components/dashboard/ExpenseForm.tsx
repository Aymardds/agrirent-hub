import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useCreateExpense, useUpdateExpense, Expense } from "@/hooks/useExpenses";

const formSchema = z.object({
    category: z.enum(["equipment", "personnel", "service"], {
        required_error: "Veuillez sélectionner une catégorie.",
    }),
    amount: z.coerce.number().min(1, "Le montant doit être supérieur à 0."),
    description: z.string().min(3, "La description doit contenir au moins 3 caractères."),
    reference: z.string().optional(),
    expense_date: z.date({
        required_error: "Une date est requise.",
    }),
    status: z.enum(["pending", "approved", "paid"]),
    notes: z.string().optional(),
});

interface ExpenseFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    expense?: Expense | null;
    onSuccess?: () => void;
}

export function ExpenseForm({ open, onOpenChange, expense, onSuccess }: ExpenseFormProps) {
    const createExpense = useCreateExpense();
    const updateExpense = useUpdateExpense();
    const isEditing = !!expense;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: "equipment",
            amount: 0,
            description: "",
            reference: "",
            expense_date: new Date(),
            status: "pending",
            notes: "",
        },
    });

    useEffect(() => {
        if (open) {
            if (expense) {
                form.reset({
                    category: expense.category,
                    amount: expense.amount,
                    description: expense.description,
                    reference: expense.reference || "",
                    expense_date: new Date(expense.expense_date),
                    status: expense.status,
                    notes: expense.notes || "",
                });
            } else {
                form.reset({
                    category: "equipment",
                    amount: 0,
                    description: "",
                    reference: "",
                    expense_date: new Date(),
                    status: "pending",
                    notes: "",
                });
            }
        }
    }, [expense, form, open]);

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const expenseData = {
                ...values,
                expense_date: format(values.expense_date, "yyyy-MM-dd"),
            };

            if (isEditing && expense) {
                await updateExpense.mutateAsync({
                    id: expense.id,
                    updates: expenseData,
                });
            } else {
                await createExpense.mutateAsync(expenseData);
            }
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    const isLoading = createExpense.isPending || updateExpense.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Modifier la dépense" : "Ajouter une dépense"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Modifiez les détails de la dépense existante."
                            : "Remplissez le formulaire pour enregistrer une nouvelle dépense."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Catégorie</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="equipment">Matériel</SelectItem>
                                                <SelectItem value="personnel">Personnel</SelectItem>
                                                <SelectItem value="service">Prestation</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Statut</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pending">En attente</SelectItem>
                                                <SelectItem value="approved">Approuvé</SelectItem>
                                                <SelectItem value="paid">Payé</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Montant (FCFA)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="expense_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: fr })
                                                        ) : (
                                                            <span>Choisir une date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Description de la dépense" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reference"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Référence (optionnel)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="N° Facture, Bon de commande..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (optionnel)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Notes additionnelles..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Mettre à jour" : "Enregistrer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
