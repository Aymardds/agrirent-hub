
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tractor, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const UpdatePassword = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");

    // Verify we have a session (Supabase handles this automatically via the link hash)
    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // We have a session, likely from the recovery link
                console.log("Session found");
            } else {
                // No immediate session, check hash or wait for auth state change
                const hash = window.location.hash;
                if (!hash) {
                    // No session and no hash -> invalid access
                    toast.error("Accès non autorisé");
                    navigate("/login");
                    return;
                }

                // Check for errors in hash
                if (hash.includes('error=')) {
                    const params = new URLSearchParams(hash.substring(1)); // remove #
                    const errorDescription = params.get('error_description');
                    toast.error(errorDescription ? decodeURIComponent(errorDescription) : "Lien expiré ou invalide");
                    navigate("/login");
                }
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth event:", event);
            if (event === "PASSWORD_RECOVERY") {
                // This is the specific event for password recovery
                toast.info("Vous pouvez maintenant définir votre nouveau mot de passe");
            } else if (event === "SIGNED_IN") {
                // Also valid if just signed in via link
            } else if (event === "SIGNED_OUT") {
                // Only redirect if we clearly signed out and are not in the process of recovering
                // navigate("/login");
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.success("Mot de passe mis à jour avec succès !");
            navigate("/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

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
                        Nouveau mot de passe
                    </h1>
                    <p className="text-muted-foreground">
                        Choisissez un mot de passe sécurisé pour votre compte.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-12 pl-12 pr-12 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                        {loading ? "Mise à jour..." : "Mettre à jour"}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default UpdatePassword;
