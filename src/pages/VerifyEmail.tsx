import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tractor, Mail, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [email, setEmail] = useState("");
    const [resending, setResending] = useState(false);

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get("token");
            const type = searchParams.get("type");

            // Si c'est une confirmation d'email
            if (type === "signup" || token) {
                try {
                    // Supabase gère automatiquement la vérification via le lien
                    const { data: { session }, error } = await supabase.auth.getSession();

                    if (error) throw error;

                    if (session) {
                        setStatus("success");
                        toast.success("Email vérifié avec succès !");

                        // Rediriger vers le dashboard après 2 secondes
                        setTimeout(() => {
                            navigate("/dashboard");
                        }, 2000);
                    } else {
                        setStatus("error");
                    }
                } catch (error: any) {
                    console.error("Erreur de vérification:", error);
                    setStatus("error");
                    toast.error("Erreur lors de la vérification de l'email");
                }
            } else {
                // Page d'attente de vérification
                setStatus("loading");
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    const handleResendEmail = async () => {
        if (!email) {
            toast.error("Veuillez entrer votre adresse email");
            return;
        }

        setResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) throw error;

            toast.success("Email de vérification renvoyé ! Vérifiez votre boîte de réception.");
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'envoi de l'email");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
                    <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center shadow-md">
                        <Tractor className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="font-display text-2xl font-bold text-foreground">
                        OUTILTECH
                    </span>
                </Link>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                    {status === "loading" && (
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <Mail className="w-10 h-10 text-primary animate-pulse" />
                            </div>
                            <h1 className="text-2xl font-display font-bold text-foreground mb-3">
                                Vérifiez votre email
                            </h1>
                            <p className="text-muted-foreground mb-6">
                                Nous avons envoyé un lien de confirmation à votre adresse email.
                                Cliquez sur le lien pour activer votre compte.
                            </p>

                            <div className="bg-muted/50 rounded-xl p-4 mb-6">
                                <p className="text-sm text-muted-foreground">
                                    💡 <strong>Astuce :</strong> Si vous ne voyez pas l'email, vérifiez votre dossier spam ou courrier indésirable.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                        Renvoyer l'email de vérification
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="votre@email.com"
                                            className="flex-1 h-11 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                        <Button
                                            onClick={handleResendEmail}
                                            disabled={resending}
                                            variant="outline"
                                            className="px-4"
                                        >
                                            {resending ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                "Renvoyer"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <h1 className="text-2xl font-display font-bold text-foreground mb-3">
                                Email vérifié !
                            </h1>
                            <p className="text-muted-foreground mb-6">
                                Votre compte a été activé avec succès. Vous allez être redirigé vers votre tableau de bord...
                            </p>
                            <div className="flex items-center justify-center gap-2 text-primary">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Redirection en cours...</span>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                                <XCircle className="w-10 h-10 text-destructive" />
                            </div>
                            <h1 className="text-2xl font-display font-bold text-foreground mb-3">
                                Erreur de vérification
                            </h1>
                            <p className="text-muted-foreground mb-6">
                                Le lien de vérification est invalide ou a expiré. Veuillez demander un nouveau lien.
                            </p>

                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="votre@email.com"
                                        className="flex-1 h-11 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                    <Button
                                        onClick={handleResendEmail}
                                        disabled={resending}
                                        variant="hero"
                                    >
                                        {resending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                Renvoyer
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <Link to="/login">
                                    <Button variant="outline" className="w-full">
                                        Retour à la connexion
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Besoin d'aide ?{" "}
                    <Link to="/contact" className="text-primary hover:underline">
                        Contactez le support
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;
