import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeRole } from "@/lib/roleUtils";
import { Shield, User, Database } from "lucide-react";

const DebugRole = () => {
    const { user } = useAuth();

    const rawRole = user?.user_metadata?.role;
    const normalized = normalizeRole(rawRole);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-display">Debug: Informations Utilisateur</h1>
                    <p className="text-muted-foreground">Diagnostic du rôle et des permissions</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <User className="w-6 h-6 text-primary" />
                            <h3 className="font-semibold text-lg">Informations Utilisateur</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">User ID:</span>
                                <span className="font-mono">{user?.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span>{user?.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Nom:</span>
                                <span>{user?.user_metadata?.full_name || 'Non défini'}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-6 h-6 text-primary" />
                            <h3 className="font-semibold text-lg">Informations Rôle</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Rôle brut:</span>
                                <span className="font-mono bg-muted px-2 py-1 rounded">{rawRole || 'null'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Rôle normalisé:</span>
                                <span className="font-mono bg-primary/10 text-primary px-2 py-1 rounded font-bold">
                                    {normalized || 'null'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Type:</span>
                                <span>{typeof rawRole}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Database className="w-6 h-6 text-primary" />
                        <h3 className="font-semibold text-lg">User Metadata Complet</h3>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                        {JSON.stringify(user?.user_metadata, null, 2)}
                    </pre>
                </Card>

                <Card className="p-6 bg-blue-50 border-blue-200">
                    <h4 className="font-semibold mb-2">💡 Instructions de débogage</h4>
                    <ul className="text-sm space-y-1 text-blue-900">
                        <li>1. Vérifiez que le "Rôle normalisé" correspond à votre rôle attendu</li>
                        <li>2. Si le rôle est NULL, vérifiez votre table profiles dans Supabase</li>
                        <li>3. Pour Super Admin, le rôle doit être exactement "super_admin"</li>
                        <li>4. Les variantes acceptées: "Super Admin", "super_admin", "SUPER_ADMIN"</li>
                    </ul>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default DebugRole;
