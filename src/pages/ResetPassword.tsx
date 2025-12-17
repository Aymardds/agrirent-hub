import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tractor, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
    validatePassword,
    calculatePasswordStrength,
    getPasswordStrengthLabel
} from "@/lib/emailConfig";

const ResetPassword = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isValidSession, setIsValidSession] = useState(false);

    useEffect(() => {
        // Vérifier si l'utilisateur a une session valide (vient du lien email)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsValidSession(true);
            } else {
                toast.error("Lien invalide ou expiré");
                navigate("/forgot-password");
            }
        };

        checkSession();
    }, [navigate]);

    const handlePasswordChange = (newPassword: string) => {
        setPassword(newPassword);

        // Valider le mot de passe
        const validation = validatePassword(newPassword);
        setPasswordErrors(validation.errors);

        // Calculer la force
        const strength = calculatePasswordStrength(newPassword);
        setPasswordStrength(strength);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const validation = validatePassword(password);
        if (!validation.isValid) {
            toast.error("Le mot de passe ne respecte pas les critères de sécurité");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            toast.success("Mot de passe réinitialisé avec succès !");
            navigate("/login");
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    if (!isValidSession) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Tractor className="w-8 h-8 text-muted-foreground animate-pulse" />
                    </div>
                    <p className="text-muted-foreground">Vérification...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8 justify-center">
                    <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center shadow-md">
                        <Tractor className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="font-display text-2xl font-bold text-foreground">
                        OUTILTECH
                    </span>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                    <div className="mb-6">
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
                                Nouveau mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-12 pl-12 pr-12 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Indicateur de force du mot de passe */}
                            {password && (
                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Force du mot de passe</span>
                                        <span className={getPasswordStrengthLabel(passwordStrength).color + " font-medium"}>
                                            {getPasswordStrengthLabel(passwordStrength).label}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${passwordStrength < 30
                                                    ? "bg-red-500"
                                                    : passwordStrength < 50
                                                        ? "bg-orange-500"
                                                        : passwordStrength < 70
                                                            ? "bg-yellow-500"
                                                            : passwordStrength < 90
                                                                ? "bg-green-500"
                                                                : "bg-emerald-500"
                                                }`}
                                            style={{ width: `${passwordStrength}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Messages d'erreur de validation */}
                            {passwordErrors.length > 0 && password && (
                                <div className="mt-3 space-y-1">
                                    {passwordErrors.map((error, index) => (
                                        <div key={index} className="flex items-start gap-2 text-xs text-destructive">
                                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Critères de validation */}
                            {password && passwordErrors.length === 0 && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Tous les critères de sécurité sont respectés</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-12 pl-12 pr-12 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Vérification de correspondance */}
                            {confirmPassword && (
                                <div className="mt-3">
                                    {password === confirmPassword ? (
                                        <div className="flex items-center gap-2 text-xs text-green-600">
                                            <CheckCircle2 className="w-3 h-3" />
                                            <span>Les mots de passe correspondent</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs text-destructive">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>Les mots de passe ne correspondent pas</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <Button
                            type="submit"
                            variant="hero"
                            size="lg"
                            className="w-full"
                            disabled={loading || passwordErrors.length > 0 || password !== confirmPassword}
                        >
                            {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
