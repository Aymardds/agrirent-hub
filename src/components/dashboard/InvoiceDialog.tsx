
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface InvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rental: any;
}

const InvoiceDialog = ({ open, onOpenChange, rental }: InvoiceDialogProps) => {
    if (!rental) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Facture #{rental.invoice_number || rental.id.slice(0, 8).toUpperCase()}</DialogTitle>
                    <DialogDescription>
                        Détails de la transaction
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 bg-white text-black rounded-lg border shadow-sm my-4" id="invoice">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-2xl font-bold">OUTILTECH</h1>
                            <p className="text-sm text-gray-500">Plateforme de location agricole</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-semibold mb-1">FACTURE</h2>
                            <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-2">Locataire</h3>
                            <p>{rental.renter?.full_name}</p>
                            <p>{rental.renter?.phone}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="font-semibold text-gray-700 mb-2">Propriétaire</h3>
                            <p>{rental.equipment?.name} (Gestion)</p>
                        </div>
                    </div>

                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b-2 border-gray-200">
                                <th className="text-left py-2">Description</th>
                                <th className="text-right py-2">Période</th>
                                <th className="text-right py-2">Prix Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-2">
                                    <div>{rental.equipment?.name}</div>
                                    {rental.prestation_type && (
                                        <div className="text-sm text-gray-500">Service: {rental.prestation_type}</div>
                                    )}
                                </td>
                                <td className="text-right py-2">{rental.start_date} - {rental.end_date}</td>
                                <td className="text-right py-2">{rental.total_price.toLocaleString()} FCFA</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex justify-end">
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">Total à payer</p>
                            <p className="text-2xl font-bold">{rental.total_price.toLocaleString()} FCFA</p>
                            <p className="text-sm text-green-600 font-medium mt-2">
                                Statut: {rental.payment_status === 'paid' ? 'PAYÉ' : 'EN ATTENTE'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default InvoiceDialog;
