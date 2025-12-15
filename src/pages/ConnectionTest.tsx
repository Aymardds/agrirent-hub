import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

const ConnectionTest = () => {
    const [status, setStatus] = useState<{
        supabase: 'loading' | 'success' | 'error';
        auth: 'loading' | 'success' | 'error';
        session: any;
        error: string | null;
    }>({
        supabase: 'loading',
        auth: 'loading',
        session: null,
        error: null
    });

    const testConnection = async () => {
        setStatus({
            supabase: 'loading',
            auth: 'loading',
            session: null,
            error: null
        });

        try {
            // Test 1: Supabase Client
            if (!supabase) {
                throw new Error("Supabase client not initialized");
            }
            setStatus(prev => ({ ...prev, supabase: 'success' }));

            // Test 2: Auth Session
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                setStatus(prev => ({ ...prev, auth: 'error', error: error.message }));
            } else {
                setStatus(prev => ({
                    ...prev,
                    auth: 'success',
                    session,
                    error: session ? null : "Aucune session active - Connectez-vous"
                }));
            }
        } catch (error: any) {
            setStatus(prev => ({
                ...prev,
                supabase: 'error',
                auth: 'error',
                error: error.message
            }));
        }
    };

    useEffect(() => {
        testConnection();
    }, []);

    const StatusIcon = ({ status }: { status: 'loading' | 'success' | 'error' }) => {
        if (status === 'loading') return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
        if (status === 'success') return <CheckCircle2 className="w-5 h-5 text-success" />;
        return <XCircle className="w-5 h-5 text-destructive" />;
    };

    return (
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
            <div className="max-w-2xl w-full space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold font-display mb-2">Test de Connexion</h1>
                    <p className="text-muted-foreground">Diagnostic de la connexion Supabase</p>
                </div>

                <Card className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                            <h3 className="font-semibold">Client Supabase</h3>
                            <p className="text-sm text-muted-foreground">Initialisation du client</p>
                        </div>
                        <StatusIcon status={status.supabase} />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                            <h3 className="font-semibold">Authentification</h3>
                            <p className="text-sm text-muted-foreground">Vérification de la session</p>
                        </div>
                        <StatusIcon status={status.auth} />
                    </div>

                    {status.error && (
                        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-destructive">Erreur détectée</h4>
                                <p className="text-sm text-destructive/90 mt-1">{status.error}</p>
                            </div>
                        </div>
                    )}

                    {status.session && (
                        <div className="p-4 bg-success/10 border border-success rounded-lg">
                            <h4 className="font-semibold text-success mb-2">Session active</h4>
                            <div className="text-sm space-y-1">
                                <p><strong>User ID:</strong> {status.session.user.id}</p>
                                <p><strong>Email:</strong> {status.session.user.email}</p>
                                <p><strong>Rôle:</strong> {status.session.user.user_metadata?.role || 'Non défini'}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button onClick={testConnection} className="flex-1">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retester
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/login'}
                            className="flex-1"
                        >
                            Aller à la connexion
                        </Button>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-semibold mb-3">Variables d'environnement</h3>
                    <div className="space-y-2 text-sm font-mono">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">VITE_SUPABASE_URL:</span>
                            <span className={import.meta.env.VITE_SUPABASE_URL ? 'text-success' : 'text-destructive'}>
                                {import.meta.env.VITE_SUPABASE_URL ? '✓ Défini' : '✗ Manquant'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">VITE_SUPABASE_ANON_KEY:</span>
                            <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-success' : 'text-destructive'}>
                                {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Défini' : '✗ Manquant'}
                            </span>
                        </div>
                    </div>
                    {(!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) && (
                        <p className="text-sm text-destructive mt-4">
                            ⚠️ Variables d'environnement manquantes. Vérifiez votre fichier .env
                        </p>
                    )}
                </Card>

                <Card className="p-6 bg-blue-50 border-blue-200">
                    <h4 className="font-semibold mb-2">🔍 Étapes de résolution</h4>
                    <ol className="text-sm space-y-1 text-blue-900 list-decimal list-inside">
                        <li>Vérifiez que les variables d'environnement sont correctes</li>
                        <li>Assurez-vous d'être connecté à Internet</li>
                        <li>Vérifiez que votre projet Supabase est actif</li>
                        <li>Si pas de session: connectez-vous via /login</li>
                        <li>Si erreur persiste: vérifiez la console (F12)</li>
                    </ol>
                </Card>
            </div>
        </div>
    );
};

export default ConnectionTest;
