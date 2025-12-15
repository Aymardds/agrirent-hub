
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// CinetPay Global Object Definition
declare global {
    interface Window {
        CinetPay: {
            setConfig: (config: {
                apikey: string;
                site_id: number;
                notify_url: string;
                mode: string;
            }) => void;
            getCheckout: (config: {
                transaction_id: string;
                amount: number;
                currency: string;
                channels: string;
                description: string;
                customer_name?: string;
                customer_surname?: string;
                customer_email?: string;
                customer_phone_number?: string;
                customer_address?: string;
                customer_city?: string;
                customer_country?: string;
                customer_state?: string;
                customer_zip_code?: string;
            }) => void;
            waitResponse: (callback: (data: { status: string; operator_id?: string; metadata?: string }) => void) => void;
            onError: (callback: (data: { message: string }) => void) => void;
        };
    }
}

interface PaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    rental: any;
    onPaymentSuccess: () => void;
}

const PaymentDialog = ({ open, onOpenChange, rental, onPaymentSuccess }: PaymentDialogProps) => {
    const { user } = useAuth();
    const [method, setMethod] = useState("ALL");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Method, 2: Processing (External), 3: Success

    if (!rental) return null;

    const CINETPAY_API_KEY = import.meta.env.VITE_CINETPAY_API_KEY || "YOUR_API_KEY";
    const CINETPAY_SITE_ID = Number(import.meta.env.VITE_CINETPAY_SITE_ID) || 0;

    const handlePayment = () => {
        if (!window.CinetPay) {
            toast.error("Le module de paiement n'est pas chargé.");
            return;
        }

        setLoading(true);
        // setStep(2); // We stay on step 1 or show a loading overlay because CinetPay opens an overlay/popup

        const transactionId = `${rental.id.slice(0, 8)}-${Math.floor(Date.now() / 1000)}`;

        // Configure CinetPay
        window.CinetPay.setConfig({
            apikey: CINETPAY_API_KEY,
            site_id: CINETPAY_SITE_ID,
            notify_url: 'http://mondomaine.com/notify/', // Placeholder for now
            mode: 'PRODUCTION',
        });

        // Use user metadata for customer info if available, otherwise defaults
        const customerName = user?.user_metadata?.full_name?.split(' ')[0] || "Client";
        const customerSurname = user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "Inconnu";
        const customerEmail = user?.email || "client@agrirent.com";
        const customerPhone = user?.user_metadata?.phone || "00000000";

        // Launch Payment
        window.CinetPay.getCheckout({
            transaction_id: transactionId,
            amount: rental.total_price,
            currency: 'XOF',
            channels: 'ALL',
            description: `Location de ${rental.equipment?.name}`,
            customer_name: customerName,
            customer_surname: customerSurname,
            customer_email: customerEmail,
            customer_phone_number: customerPhone,
            customer_address: "Address",
            customer_city: "Abidjan",
            customer_country: "CI",
            customer_state: "CM",
            customer_zip_code: "06510",
        });

        // Wait for response
        window.CinetPay.waitResponse(async (data: { status: string; operator_id?: string }) => {
            if (data.status === "ACCEPTED") {
                try {
                    const { error } = await supabase
                        .from("rentals")
                        .update({
                            payment_status: 'paid',
                            payment_method: 'CinetPay',
                            invoice_number: transactionId
                        })
                        .eq("id", rental.id);

                    if (error) throw error;

                    setStep(3);
                    toast.success("Paiement effectué avec succès!");
                    onPaymentSuccess();
                } catch (error: any) {
                    toast.error("Erreur d'enregistrement: " + error.message);
                } finally {
                    setLoading(false);
                }
            } else if (data.status === "REFUSED") {
                toast.error("Paiement refusé par l'opérateur.");
                setLoading(false);
            }
        });

        window.CinetPay.onError((data: { message: string }) => {
            toast.error("Erreur CinetPay: " + data.message);
            setLoading(false);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Paiement Sécurisé</DialogTitle>
                    <DialogDescription>
                        Réglez votre location de {rental.equipment?.name} via CinetPay
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-6 py-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Montant à payer</p>
                            <p className="text-3xl font-bold text-primary">{rental.total_price?.toLocaleString()} FCFA</p>
                        </div>

                        <div className="flex justify-center">
                            <img src="https://cinetpay.com/img/logo_cinetpay.png" alt="CinetPay" className="h-8 opacity-80" />
                        </div>

                        <div className="bg-blue-50/50 p-3 rounded-md flex items-start gap-3 text-sm text-blue-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>Une fenêtre sécurisée CinetPay s'ouvrira pour vous permettre de payer par Mobile Money (Orange, MTN, Moov) ou Carte Bancaire.</p>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-lg">Paiement Réussi !</h3>
                            <p className="text-muted-foreground text-sm">Votre transaction a été validée.</p>
                        </div>
                    </div>
                )}

                <DialogFooter className="sm:justify-end">
                    {step === 1 && (
                        <Button onClick={handlePayment} disabled={loading} className="w-full sm:w-auto">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                            Procéder au paiement
                        </Button>
                    )}
                    {step === 3 && (
                        <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                            Fermer
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentDialog;
