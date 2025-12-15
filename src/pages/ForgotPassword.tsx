
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tractor, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            setSubmitted(true);
            toast.success("Email envoyé avec succès !");
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
                    <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-foreground mb-4">
                        Vérifiez votre email
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>.
                        Veuillez vérifier votre boîte de réception (et vos spams).
                    </p>
                    <Link to="/login">
                        <Button variant="outline" className="w-full">
                            Retour à la connexion
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <Link to="/" className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-md">
                    <Tractor className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-display text-xl font-bold text-foreground">
                    OUTILTECH
                </span>
            </Link>

            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                        Mot de passe oublié ?
                    </h1>
                    <p className="text-muted-foreground">
                        Entrez votre email pour recevoir les instructions de réinitialisation.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="votre@email.com"
                                className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                        {loading ? "Envoi en cours..." : "Envoyer le lien"}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </Button>
                </form>

                <p className="mt-8 text-center text-muted-foreground">
                    Vous vous en souvenez ?{" "}
                    <Link to="/login" className="text-primary font-medium hover:underline">
                        Se connecter
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
