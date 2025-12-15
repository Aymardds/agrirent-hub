import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { User, Lock, Mail, Phone, MapPin } from "lucide-react";

const Settings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        address: "",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.user_metadata?.full_name || "",
                email: user.email || "",
                phone: user.user_metadata?.phone || "",
                address: user.user_metadata?.address || "",
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: formData.full_name,
                    phone: formData.phone,
                    address: formData.address,
                }
            });

            if (error) throw error;
            toast.success("Profil mis à jour avec succès");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold font-display">Paramètres</h1>
                    <p className="text-muted-foreground">Gérez vos informations personnelles et préférences</p>
                </div>

                <div className="grid gap-6">
                    {/* Profile Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations personnelles</CardTitle>
                            <CardDescription>Mettez à jour vos coordonnées publiques.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleUpdateProfile}>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name">Nom complet</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="full_name"
                                                name="full_name"
                                                placeholder="Votre nom"
                                                className="pl-10"
                                                value={formData.full_name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                disabled
                                                className="pl-10 bg-muted"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Téléphone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                name="phone"
                                                placeholder="+221..."
                                                className="pl-10"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Adresse</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="address"
                                                name="address"
                                                placeholder="Ville, Quartier..."
                                                className="pl-10"
                                                value={formData.address}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Mise à jour..." : "Enregistrer les modifications"}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* Security */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Sécurité</CardTitle>
                            <CardDescription>Gérez votre mot de passe et la sécurité de votre compte.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-muted rounded-full">
                                        <Lock className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Mot de passe</p>
                                        <p className="text-sm text-muted-foreground">Dernière modification il y a 3 mois</p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => window.location.href = '/update-password'}>
                                    Modifier
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
