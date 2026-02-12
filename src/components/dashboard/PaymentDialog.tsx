
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Smartphone, CheckCircle2, Loader2, AlertCircle, Wallet, Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePayment, useCreateCredit } from "@/hooks/usePayments";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'mobile_money'>('mobile_money');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Method Selection, 2: Processing, 3: Success

    // Credit form fields
    const [dueDate, setDueDate] = useState<Date>();
    const [installments, setInstallments] = useState(1);
    const [notes, setNotes] = useState('');

    const createPayment = useCreatePayment();
    const createCredit = useCreateCredit();

    if (!rental) return null;

    const CINETPAY_API_KEY = import.meta.env.VITE_CINETPAY_API_KEY || "YOUR_API_KEY";
    const CINETPAY_SITE_ID = Number(import.meta.env.VITE_CINETPAY_SITE_ID) || 0;

    const handleCashPayment = async () => {
        setLoading(true);
        try {
            // Create payment transaction
            await createPayment.mutateAsync({
                rental_id: rental.id,
                amount: rental.total_price,
                payment_method: 'cash',
                notes: notes || undefined,
                created_by: user!.id,
            });

            // Update rental payment status
            const { error } = await supabase
                .from("rentals")
                .update({
                    payment_status: 'paid',
                    payment_method: 'cash',
                    amount_paid: rental.total_price,
                    amount_remaining: 0,
                })
                .eq("id", rental.id);

            if (error) throw error;

            setStep(3);
            onPaymentSuccess();
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreditPayment = async () => {
        if (!dueDate) {
            toast.error("Veuillez sélectionner une date d'échéance");
            return;
        }

        setLoading(true);
        try {
            // Create credit record
            await createCredit.mutateAsync({
                rental_id: rental.id,
                property_id: rental.property_id,
                client_id: user!.id,
                total_amount: rental.total_price,
                due_date: format(dueDate, 'yyyy-MM-dd'),
                installments: installments,
                notes: notes || undefined,
            });

            // Update rental
            const { error } = await supabase
                .from("rentals")
                .update({
                    payment_status: 'pending',
                    payment_method: 'credit',
                    credit_terms: {
                        due_date: format(dueDate, 'yyyy-MM-dd'),
                        installments: installments,
                    },
                    amount_paid: 0,
                    amount_remaining: rental.total_price,
                })
                .eq("id", rental.id);

            if (error) throw error;

            setStep(3);
            onPaymentSuccess();
            toast.success("Achat à crédit enregistré");
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMobileMoneyPayment = () => {
        if (!window.CinetPay) {
            toast.error("Le module de paiement n'est pas chargé.");
            return;
        }

        setLoading(true);
        const transactionId = `${rental.id.slice(0, 8)}-${Math.floor(Date.now() / 1000)}`;

        window.CinetPay.setConfig({
            apikey: CINETPAY_API_KEY,
            site_id: CINETPAY_SITE_ID,
            notify_url: 'http://mondomaine.com/notify/',
            mode: 'PRODUCTION',
        });

        const customerName = user?.user_metadata?.full_name?.split(' ')[0] || "Client";
        const customerSurname = user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "Inconnu";
        const customerEmail = user?.email || "client@agrirent.com";
        const customerPhone = user?.user_metadata?.phone || "00000000";

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

        window.CinetPay.waitResponse(async (data: { status: string; operator_id?: string }) => {
            if (data.status === "ACCEPTED") {
                try {
                    // Create payment transaction
                    await createPayment.mutateAsync({
                        rental_id: rental.id,
                        amount: rental.total_price,
                        payment_method: 'mobile_money',
                        transaction_reference: transactionId,
                        created_by: user!.id,
                    });

                    // Update rental
                    const { error } = await supabase
                        .from("rentals")
                        .update({
                            payment_status: 'paid',
                            payment_method: 'mobile_money',
                            invoice_number: transactionId,
                            amount_paid: rental.total_price,
                            amount_remaining: 0,
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

    const handlePayment = () => {
        if (paymentMethod === 'cash') {
            handleCashPayment();
        } else if (paymentMethod === 'credit') {
            handleCreditPayment();
        } else {
            handleMobileMoneyPayment();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Paiement de la prestation</DialogTitle>
                    <DialogDescription>
                        Choisissez votre mode de paiement pour {rental.equipment?.name}
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-6 py-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Montant à payer</p>
                            <p className="text-3xl font-bold text-primary">{rental.total_price?.toLocaleString()} FCFA</p>
                        </div>

                        <div className="space-y-4">
                            <Label>Mode de paiement</Label>
                            <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                                    <RadioGroupItem value="cash" id="cash" />
                                    <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                                        <Wallet className="w-5 h-5 text-green-600" />
                                        <div>
                                            <div className="font-medium">Cash</div>
                                            <div className="text-xs text-muted-foreground">Paiement en espèces</div>
                                        </div>
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                                    <RadioGroupItem value="credit" id="credit" />
                                    <Label htmlFor="credit" className="flex items-center gap-3 cursor-pointer flex-1">
                                        <CreditCard className="w-5 h-5 text-orange-600" />
                                        <div>
                                            <div className="font-medium">À crédit</div>
                                            <div className="text-xs text-muted-foreground">Paiement différé avec échéances</div>
                                        </div>
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                                    <RadioGroupItem value="mobile_money" id="mobile_money" />
                                    <Label htmlFor="mobile_money" className="flex items-center gap-3 cursor-pointer flex-1">
                                        <Smartphone className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <div className="font-medium">Mobile Money</div>
                                            <div className="text-xs text-muted-foreground">Orange Money, MTN, Moov</div>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Credit Terms Form */}
                        {paymentMethod === 'credit' && (
                            <div className="space-y-4 border-t pt-4">
                                {/* Harvest Payment Info Banner */}
                                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <CreditCard className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-sm text-orange-900 dark:text-orange-100">
                                                Paiement à la récolte
                                            </h4>
                                            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                                Le montant sera payé lors de la récolte. Ce crédit apparaîtra dans "Crédits à payer à la récolte".
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Date d'échéance</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dueDate ? format(dueDate, 'PPP', { locale: fr }) : "Sélectionner une date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={dueDate}
                                                onSelect={setDueDate}
                                                initialFocus
                                                disabled={(date) => date < new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>Nombre d'échéances</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={installments}
                                        onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Notes field for cash and credit */}
                        {(paymentMethod === 'cash' || paymentMethod === 'credit') && (
                            <div className="space-y-2">
                                <Label>Notes (optionnel)</Label>
                                <Textarea
                                    placeholder="Ajouter des notes..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        )}

                        {paymentMethod === 'mobile_money' && (
                            <div className="bg-blue-50/50 p-3 rounded-md flex items-start gap-3 text-sm text-blue-700">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>Une fenêtre sécurisée CinetPay s'ouvrira pour vous permettre de payer par Mobile Money ou Carte Bancaire.</p>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-lg">
                                {paymentMethod === 'credit' ? 'Crédit enregistré !' : 'Paiement Réussi !'}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                {paymentMethod === 'credit'
                                    ? 'Votre achat à crédit a été enregistré.'
                                    : 'Votre transaction a été validée.'}
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="sm:justify-end">
                    {step === 1 && (
                        <Button onClick={handlePayment} disabled={loading} className="w-full sm:w-auto">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> :
                                paymentMethod === 'cash' ? <Wallet className="w-4 h-4 mr-2" /> :
                                    paymentMethod === 'credit' ? <CreditCard className="w-4 h-4 mr-2" /> :
                                        <Smartphone className="w-4 h-4 mr-2" />
                            }
                            {paymentMethod === 'credit' ? 'Confirmer le crédit' : 'Procéder au paiement'}
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
