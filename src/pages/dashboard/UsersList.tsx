
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2, UserPlus } from "lucide-react";

interface Profile {
    id: string;
    full_name: string;
    role: string;
    phone: string;
    company: string;
    created_at: string;
    email?: string; // Optional as it might not be in profile view
}

const UsersList = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Create User State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        email: "",
        password: "",
        full_name: "",
        role: "client",
        phone: "",
        company: ""
    });

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        company: "",
        role: "",
    });

    // Delete State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error: any) {
            toast.error("Erreur lors du chargement: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const roleColors: Record<string, string> = {
        super_admin: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
        admin: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
        client: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
        cooperative: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
        provider: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
        stock_manager: "bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20",
        technician: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
        accountant: "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20",
    };

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password || !newUser.full_name) {
            toast.error("Veuillez remplir les champs obligatoires (Email, MdP, Nom)");
            return;
        }

        setActionLoading(true);
        try {
            // Call the custom RPC function
            const { data, error } = await supabase.rpc('create_user_by_admin', {
                new_email: newUser.email,
                new_password: newUser.password,
                new_full_name: newUser.full_name,
                new_role: newUser.role,
                new_phone: newUser.phone,
                new_company: newUser.company
            });

            if (error) throw error;

            // Check if function returned an error object
            if (data && data.error) {
                throw new Error(data.error);
            }

            toast.success("Utilisateur créé avec succès !");
            setIsCreateOpen(false);
            setNewUser({
                email: "",
                password: "",
                full_name: "",
                role: "client",
                phone: "",
                company: ""
            });
            fetchUsers(); // Refresh list
        } catch (error: any) {
            console.error('Create error:', error);
            toast.error("Erreur création: " + (error.message || "Erreur inconnue"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = (user: Profile) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name || "",
            phone: user.phone || "",
            company: user.company || "",
            role: user.role || "client",
        });
        setIsEditOpen(true);
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    company: formData.company,
                    role: formData.role,
                })
                .eq("id", editingUser.id);

            if (error) throw error;

            toast.success("Utilisateur mis à jour avec succès");
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
            setIsEditOpen(false);
        } catch (error: any) {
            toast.error("Erreur lors de la mise à jour: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const confirmDelete = (user: Profile) => {
        setUserToDelete(user);
        setIsDeleteOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setActionLoading(true);
        try {
            // Note: This only deletes the profile. Auth user management requires server-side admin client.
            const { error } = await supabase
                .from("profiles")
                .delete()
                .eq("id", userToDelete.id);

            if (error) throw error;

            toast.success("Profil utilisateur supprimé");
            setUsers(users.filter(u => u.id !== userToDelete.id));
            setIsDeleteOpen(false);
        } catch (error: any) {
            toast.error("Erreur lors de la suppression: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold font-display">Utilisateurs</h1>
                        <p className="text-muted-foreground">Gestion des utilisateurs et de leurs rôles</p>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <UserPlus className="w-4 h-4" />
                                Ajouter Utilisateur
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Nouvel Utilisateur</DialogTitle>
                                <DialogDescription>
                                    Créer un compte utilisateur avec accès immédiat.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="col-span-2 space-y-2">
                                    <Label>Email (Obligatoire)</Label>
                                    <Input
                                        type="email"
                                        placeholder="utilisateur@exemple.com"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Mot de passe (Obligatoire)</Label>
                                    <Input
                                        type="password"
                                        placeholder="Minimum 6 caractères"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nom complet</Label>
                                    <Input
                                        placeholder="Jean Dupont"
                                        value={newUser.full_name}
                                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Rôle</Label>
                                    <Select
                                        value={newUser.role}
                                        onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="client">Client</SelectItem>
                                            <SelectItem value="technician">Technicien</SelectItem>
                                            <SelectItem value="stock_manager">Gestionnaire Stock</SelectItem>
                                            <SelectItem value="accountant">Comptable</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Téléphone</Label>
                                    <Input
                                        value={newUser.phone}
                                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Entreprise</Label>
                                    <Input
                                        value={newUser.company}
                                        onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateUser} disabled={actionLoading}>
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Créer le compte
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="bg-card rounded-xl border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom complet</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Téléphone</TableHead>
                                <TableHead>Entreprise</TableHead>
                                <TableHead>Date d'inscription</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <div className="flex justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Aucun utilisateur trouvé</TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={roleColors[user.role] || ""}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{user.phone || "-"}</TableCell>
                                        <TableCell>{user.company || "-"}</TableCell>
                                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(user)}
                                                    className="hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => confirmDelete(user)}
                                                    className="hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier l'utilisateur</DialogTitle>
                        <DialogDescription>
                            Modifiez les informations et le rôle de l'utilisateur.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nom complet</Label>
                            <Input
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Rôle</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="client">Client</SelectItem>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                    <SelectItem value="admin">Administrateur</SelectItem>
                                    <SelectItem value="stock_manager">Gestionnaire Stock</SelectItem>
                                    <SelectItem value="technician">Technicien</SelectItem>
                                    <SelectItem value="accountant">Comptable</SelectItem>
                                    <SelectItem value="provider">Fournisseur</SelectItem>
                                    <SelectItem value="cooperative">Coopérative</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Téléphone</Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Entreprise</Label>
                            <Input
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Annuler</Button>
                        <Button onClick={handleSaveUser} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Êtes-vous sûr ?</DialogTitle>
                        <DialogDescription>
                            Cette action supprimera le profil de l'utilisateur. Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Annuler</Button>
                        <Button variant="destructive" onClick={handleDeleteUser} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default UsersList;
