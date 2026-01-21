import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface DiagnosticResult {
    test: string;
    status: 'loading' | 'success' | 'error' | 'warning';
    message: string;
    details?: string;
}

const NetworkDiagnostic = () => {
    const [results, setResults] = useState<DiagnosticResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addResult = (result: DiagnosticResult) => {
        setResults(prev => [...prev, result]);
    };

    const runDiagnostics = async () => {
        setResults([]);
        setIsRunning(true);

        // Test 1: Environment Variables
        addResult({
            test: "Variables d'environnement",
            status: import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY ? 'success' : 'error',
            message: import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
                ? "Variables correctement définies"
                : "Variables manquantes",
            details: `URL: ${import.meta.env.VITE_SUPABASE_URL || 'NON DÉFINI'}`
        });

        // Test 2: Basic Network Connectivity
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            addResult({
                test: "Connectivité Internet",
                status: response.ok ? 'success' : 'warning',
                message: response.ok ? "Connexion Internet active" : "Connexion limitée",
                details: `Status: ${response.status}`
            });
        } catch (error: any) {
            addResult({
                test: "Connectivité Internet",
                status: 'error',
                message: "Pas de connexion Internet",
                details: error.message
            });
        }

        // Test 3: DNS Resolution for Supabase
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch('https://xztvxhuvmwlurkljsqhx.supabase.co', {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            addResult({
                test: "Résolution DNS Supabase",
                status: 'success',
                message: "Serveur Supabase accessible",
                details: "DNS résolu avec succès"
            });
        } catch (error: any) {
            addResult({
                test: "Résolution DNS Supabase",
                status: 'error',
                message: "Impossible de résoudre le DNS",
                details: error.name === 'AbortError' ? 'Timeout (5s)' : error.message
            });
        }

        // Test 4: Supabase Auth Endpoint
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`, {
                headers: {
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            addResult({
                test: "Endpoint Auth Supabase",
                status: response.ok ? 'success' : 'warning',
                message: response.ok ? "Endpoint Auth accessible" : `Status: ${response.status}`,
                details: await response.text().catch(() => 'Pas de détails')
            });
        } catch (error: any) {
            addResult({
                test: "Endpoint Auth Supabase",
                status: 'error',
                message: "Erreur de connexion à l'API Auth",
                details: error.name === 'AbortError' ? 'Timeout (10s)' : error.message
            });
        }

        // Test 5: CORS Check
        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
                headers: {
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                }
            });

            addResult({
                test: "Configuration CORS",
                status: 'success',
                message: "CORS correctement configuré",
                details: `Status: ${response.status}`
            });
        } catch (error: any) {
            addResult({
                test: "Configuration CORS",
                status: 'error',
                message: "Erreur CORS détectée",
                details: error.message
            });
        }

        // Test 6: Browser Info
        addResult({
            test: "Informations Navigateur",
            status: 'success',
            message: navigator.userAgent.includes('Chrome') ? 'Chrome' :
                navigator.userAgent.includes('Safari') ? 'Safari' :
                    navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Autre',
            details: `Online: ${navigator.onLine ? 'Oui' : 'Non'}`
        });

        setIsRunning(false);
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    const StatusIcon = ({ status }: { status: DiagnosticResult['status'] }) => {
        if (status === 'loading') return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
        if (status === 'success') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        return <XCircle className="w-5 h-5 text-red-500" />;
    };

    const hasErrors = results.some(r => r.status === 'error');
    const allSuccess = results.every(r => r.status === 'success');

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        {navigator.onLine ? (
                            <Wifi className="w-8 h-8 text-green-500" />
                        ) : (
                            <WifiOff className="w-8 h-8 text-red-500" />
                        )}
                        <h1 className="text-3xl font-bold font-display">Diagnostic Réseau</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Analyse de la connectivité Supabase
                    </p>
                </div>

                {/* Summary Card */}
                {results.length > 0 && !isRunning && (
                    <Card className={`p-6 ${allSuccess ? 'bg-green-50 border-green-200' :
                            hasErrors ? 'bg-red-50 border-red-200' :
                                'bg-yellow-50 border-yellow-200'
                        }`}>
                        <h3 className="font-semibold text-lg mb-2">
                            {allSuccess ? '✅ Tous les tests réussis' :
                                hasErrors ? '❌ Problèmes détectés' :
                                    '⚠️ Avertissements'}
                        </h3>
                        <p className="text-sm">
                            {allSuccess ? 'Votre connexion à Supabase fonctionne correctement.' :
                                hasErrors ? 'Des problèmes de connectivité ont été détectés. Voir les détails ci-dessous.' :
                                    'Certains tests ont généré des avertissements.'}
                        </p>
                    </Card>
                )}

                {/* Results */}
                <div className="space-y-3">
                    {results.map((result, index) => (
                        <Card key={index} className="p-4">
                            <div className="flex items-start gap-4">
                                <StatusIcon status={result.status} />
                                <div className="flex-1">
                                    <h4 className="font-semibold">{result.test}</h4>
                                    <p className="text-sm text-muted-foreground">{result.message}</p>
                                    {result.details && (
                                        <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted p-2 rounded">
                                            {result.details}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        onClick={runDiagnostics}
                        disabled={isRunning}
                        className="flex-1"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
                        {isRunning ? 'Test en cours...' : 'Relancer les tests'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/login'}
                        className="flex-1"
                    >
                        Aller à la connexion
                    </Button>
                </div>

                {/* Solutions */}
                {hasErrors && (
                    <Card className="p-6 bg-blue-50 border-blue-200">
                        <h4 className="font-semibold mb-3">🔧 Solutions recommandées</h4>
                        <ol className="text-sm space-y-2 list-decimal list-inside">
                            <li>
                                <strong>Vider le cache DNS du navigateur:</strong>
                                <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                                    <li>Chrome: <code className="bg-white px-2 py-0.5 rounded">chrome://net-internals/#dns</code> → Clear host cache</li>
                                    <li>Safari: Redémarrer Safari après avoir vidé le cache système</li>
                                </ul>
                            </li>
                            <li>
                                <strong>Vider le cache système (macOS):</strong>
                                <code className="block bg-white p-2 rounded mt-1 font-mono text-xs">
                                    sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
                                </code>
                            </li>
                            <li>
                                <strong>Essayer en mode navigation privée</strong> (pour exclure les extensions)
                            </li>
                            <li>
                                <strong>Désactiver temporairement:</strong> VPN, pare-feu, antivirus, extensions de sécurité
                            </li>
                            <li>
                                <strong>Vérifier que le projet Supabase est actif</strong> sur supabase.com
                            </li>
                        </ol>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default NetworkDiagnostic;
