import { useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCooperativeMembersDetail,
  useAvailableClients,
  useAttachMember,
  useDetachMember,
  useCreateMember,
  CooperativeMemberDetail,
} from "@/hooks/useCooperativeMembers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserPlus,
  Search,
  Wheat,
  MapPin,
  TrendingUp,
  Download,
  Eye,
  UserMinus,
  Phone,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  ArrowUpDown,
  CheckCircle2,
  ShieldCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const CooperativeMembers = () => {
  const { user } = useAuth();
  const cooperativeId = user?.id;

  // Data fetching
  const {
    data: memberData,
    isLoading,
    refetch,
  } = useCooperativeMembersDetail(cooperativeId);
  const { data: availableClients, isLoading: loadingClients } = useAvailableClients();

  // Mutations
  const attachMember = useAttachMember();
  const detachMember = useDetachMember();
  const createMember = useCreateMember();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterParcels, setFilterParcels] = useState<"all" | "with_parcels" | "without_parcels">("all");
  const [sortField, setSortField] = useState<"name" | "area" | "date">("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<"existing" | "new">("existing");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // New member form
  const [newMemberForm, setNewMemberForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    company: "",
    password: "",
  });

  // Detail Modal state
  const [detailMember, setDetailMember] = useState<CooperativeMemberDetail | null>(null);

  // Detach Confirmation state
  const [memberToDetach, setMemberToDetach] = useState<CooperativeMemberDetail | null>(null);

  const members = memberData?.members || [];
  const stats = memberData?.stats || {
    totalMembers: 0,
    totalCultivatedArea: 0,
    totalProperties: 0,
    activeParticipants: 0,
  };

  // Filtered and sorted members
  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        const matchesQuery =
          m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.company.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesQuery) return false;

        if (filterParcels === "with_parcels") return m.properties_count > 0;
        if (filterParcels === "without_parcels") return m.properties_count === 0;

        return true;
      })
      .sort((a, b) => {
        if (sortField === "name") {
          return sortAsc
            ? a.full_name.localeCompare(b.full_name)
            : b.full_name.localeCompare(a.full_name);
        }
        if (sortField === "area") {
          return sortAsc ? a.total_area - b.total_area : b.total_area - a.total_area;
        }
        if (sortField === "date") {
          return sortAsc
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      });
  }, [members, searchQuery, filterParcels, sortField, sortAsc]);

  // Handle Attach
  const handleAttach = async () => {
    if (!selectedClientId || !cooperativeId) {
      toast.error("Veuillez sélectionner un agriculteur");
      return;
    }

    await attachMember.mutateAsync({
      memberId: selectedClientId,
      cooperativeId,
    });
    setIsAddModalOpen(false);
    setSelectedClientId("");
  };

  // Handle Create Member
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.fullName || !newMemberForm.email || !newMemberForm.password) {
      toast.error("Veuillez remplir au minimum le nom, l'email et un mot de passe.");
      return;
    }

    try {
      await createMember.mutateAsync({
        fullName: newMemberForm.fullName,
        email: newMemberForm.email,
        password: newMemberForm.password,
        phone: newMemberForm.phone,
        company: newMemberForm.company,
      });

      setIsAddModalOpen(false);
      setNewMemberForm({
        fullName: "",
        phone: "",
        email: "",
        company: "",
        password: "",
      });
    } catch (err) {
      // Error handled by hook toast
    }
  };

  // Handle Detach
  const handleConfirmDetach = async () => {
    if (!memberToDetach || !cooperativeId) return;

    await detachMember.mutateAsync({
      memberId: memberToDetach.id,
      cooperativeId,
    });
    setMemberToDetach(null);
    if (detailMember?.id === memberToDetach.id) {
      setDetailMember(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (members.length === 0) {
      toast.error("Aucun membre à exporter.");
      return;
    }

    const headers = ["Nom", "Téléphone", "Village / Société", "Superficie (ha)", "Nb Parcelles", "Date Inscription"];
    const rows = members.map((m) => [
      `"${m.full_name}"`,
      `"${m.phone}"`,
      `"${m.company}"`,
      m.total_area,
      m.properties_count,
      new Date(m.created_at).toLocaleDateString("fr-FR"),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `membres_cooperative_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Liste des membres exportée avec succès !");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>Coopérative</span>
              <span>/</span>
              <span className="text-foreground font-medium">Gestion des Membres</span>
            </div>
            <h1 className="text-3xl font-bold font-display tracking-tight">
              Membres de la Coopérative
            </h1>
            <p className="text-muted-foreground text-sm">
              Suivez vos agriculteurs affiliés, leurs parcelles et leur engagement dans les commandes groupées.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter un membre
            </Button>
          </div>
        </div>

        {/* Stats KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Membres */}
          <Card className="p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Agriculteurs
                </p>
                <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {stats.totalMembers}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Membres adhérents actifs
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>

          {/* Superficie Totale */}
          <Card className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Superficie Cumulée
                </p>
                <p className="text-3xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                  {stats.totalCultivatedArea}{" "}
                  <span className="text-base font-normal">ha</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalMembers > 0
                    ? `Moyenne : ${(stats.totalCultivatedArea / stats.totalMembers).toFixed(1)} ha / membre`
                    : "0 ha déclaré"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Wheat className="w-6 h-6" />
              </div>
            </div>
          </Card>

          {/* Parcelles Totales */}
          <Card className="p-5 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Parcelles Déclarées
                </p>
                <p className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                  {stats.totalProperties}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Terres cartographiées
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <MapPin className="w-6 h-6" />
              </div>
            </div>
          </Card>

          {/* Membres Engagés */}
          <Card className="p-5 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Membres Engagés
                </p>
                <p className="text-3xl font-bold mt-1 text-purple-600 dark:text-purple-400">
                  {stats.activeParticipants}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalMembers > 0
                    ? `${Math.round((stats.activeParticipants / stats.totalMembers) * 100)}% de participation`
                    : "0%"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Bar & Controls */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, téléphone, village..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <Select
                value={filterParcels}
                onValueChange={(v: any) => setFilterParcels(v)}
              >
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="Parcelles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les parcelles</SelectItem>
                  <SelectItem value="with_parcels">Avec parcelles (&gt; 0)</SelectItem>
                  <SelectItem value="without_parcels">Sans parcelle</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortField}
                onValueChange={(v: any) => setSortField(v)}
              >
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Trier par Nom</SelectItem>
                  <SelectItem value="area">Trier par Superficie</SelectItem>
                  <SelectItem value="date">Trier par Ancienneté</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2"
                onClick={() => setSortAsc(!sortAsc)}
                title={sortAsc ? "Ordre croissant" : "Ordre décroissant"}
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Members Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
              <p className="text-muted-foreground text-sm">Chargement des membres...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <h3 className="font-semibold text-lg">Aucun membre trouvé</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {searchQuery
                  ? "Aucun membre ne correspond à vos critères de recherche."
                  : "Votre coopérative n'a pas encore de membre affilié. Commencez par en ajouter un !"}
              </p>
              <Button
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="gap-2 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <UserPlus className="w-4 h-4" />
                Ajouter le premier membre
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-[280px]">Membre & Contact</TableHead>
                    <TableHead>Village / Société</TableHead>
                    <TableHead className="text-center">Parcelles</TableHead>
                    <TableHead className="text-center">Superficie</TableHead>
                    <TableHead className="text-center">Commandes Groupées</TableHead>
                    <TableHead>Date Adhésion</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                      {/* Name & Avatar */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center text-sm shrink-0 border border-emerald-500/20">
                            {member.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {member.full_name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{member.phone || "Non renseigné"}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Company / Village */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {member.company || "Indépendant"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Parcelles */}
                      <TableCell className="text-center">
                        <Badge
                          variant={member.properties_count > 0 ? "secondary" : "outline"}
                          className="font-medium text-xs"
                        >
                          {member.properties_count} parcelle{member.properties_count > 1 ? "s" : ""}
                        </Badge>
                      </TableCell>

                      {/* Superficie */}
                      <TableCell className="text-center">
                        <span className="font-semibold text-sm text-foreground">
                          {member.total_area} ha
                        </span>
                      </TableCell>

                      {/* Participations */}
                      <TableCell className="text-center">
                        {member.participations_count > 0 ? (
                          <Badge className="bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 border-0 font-medium text-xs">
                            {member.participations_count} participation{member.participations_count > 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Aucune</span>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(member.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailMember(member)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMemberToDetach(member)}
                            className="h-8 w-8 p-0 text-red-500/80 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Retirer de la coopérative"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* ── Modal d'Ajout de Membre ── */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Ajouter un Membre à la Coopérative
            </DialogTitle>
            <DialogDescription>
              Vous pouvez soit rattacher un agriculteur déjà inscrit, soit créer son profil complet directement.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={addMode}
            onValueChange={(v: any) => setAddMode(v)}
            className="w-full mt-2"
          >
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="existing">Agriculteur existant</TabsTrigger>
              <TabsTrigger value="new">Créer un nouveau membre</TabsTrigger>
            </TabsList>

            {/* Onglet 1: Agriculteur Existant */}
            <TabsContent value="existing" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-select">Sélectionner un agriculteur non affilié</Label>
                {loadingClients ? (
                  <div className="flex items-center justify-center p-4 border rounded-md">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600 mr-2" />
                    <span className="text-sm text-muted-foreground">Recherche des agriculteurs...</span>
                  </div>
                ) : availableClients && availableClients.length > 0 ? (
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                  >
                    <SelectTrigger id="client-select">
                      <SelectValue placeholder="Choisir un agriculteur..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availableClients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name} ({client.phone || "Pas de tél"} - {client.company || "Indépendant"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 border rounded-md bg-muted/40 text-center text-sm text-muted-foreground">
                    Aucun agriculteur indépendant disponible actuellement. Vous pouvez en créer un nouveau dans l'onglet voisin.
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Ce client recevra immédiatement les annonces de vos commandes groupées sur son dashboard.
                </p>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  disabled={!selectedClientId || attachMember.isPending}
                  onClick={handleAttach}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {attachMember.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Rattacher à la coopérative
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* Onglet 2: Créer un Nouveau Membre */}
            <TabsContent value="new">
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <Label htmlFor="new-name">Nom complet de l'agriculteur *</Label>
                  <Input
                    id="new-name"
                    placeholder="ex: Mamadou Traoré"
                    value={newMemberForm.fullName}
                    onChange={(e) =>
                      setNewMemberForm({ ...newMemberForm, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="new-phone">Téléphone</Label>
                    <Input
                      id="new-phone"
                      placeholder="ex: +225 07..."
                      value={newMemberForm.phone}
                      onChange={(e) =>
                        setNewMemberForm({ ...newMemberForm, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-company">Village / Exploitation</Label>
                    <Input
                      id="new-company"
                      placeholder="ex: Bouaké Nord"
                      value={newMemberForm.company}
                      onChange={(e) =>
                        setNewMemberForm({ ...newMemberForm, company: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="new-email">Adresse Email de connexion *</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="agriculteur@coop.ci"
                    value={newMemberForm.email}
                    onChange={(e) =>
                      setNewMemberForm({ ...newMemberForm, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="new-password">Mot de passe temporaire *</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Minimum 6 caractères"
                    value={newMemberForm.password}
                    onChange={(e) =>
                      setNewMemberForm({ ...newMemberForm, password: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    L'agriculteur pourra modifier son mot de passe lors de sa première connexion.
                  </p>
                </div>

                <DialogFooter className="mt-6 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMember.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {createMember.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Créer et affilier
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Modal Fiche Détaillée du Membre ── */}
      <Dialog
        open={!!detailMember}
        onOpenChange={(open) => !open && setDetailMember(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailMember && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center text-lg border border-emerald-500/20">
                      {detailMember.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2)}
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold">
                        {detailMember.full_name}
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        {detailMember.company || "Membre individuel"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    Membre actif
                  </Badge>
                </div>
              </DialogHeader>

              {/* Coordonnées & Stats rapides */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-muted/40 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-semibold mt-0.5">{detailMember.phone || "Non renseigné"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Superficie Déclarée</p>
                  <p className="text-sm font-semibold text-emerald-600 mt-0.5">
                    {detailMember.total_area} hectares
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date d'adhésion</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {new Date(detailMember.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              {/* Section Parcelles */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Parcelles Agricoles ({detailMember.properties_count})
                </h3>

                {detailMember.properties.length === 0 ? (
                  <div className="p-4 border rounded-lg bg-muted/20 text-center text-sm text-muted-foreground">
                    Aucune parcelle n'a encore été enregistrée par ce membre.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detailMember.properties.map((property) => (
                      <div
                        key={property.id}
                        className="p-3 border rounded-lg bg-card hover:border-emerald-500/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{property.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {property.village || property.locality || "Localité non précisée"}
                              {property.department ? ` (${property.department})` : ""}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {property.size} {property.unit}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section Participations aux Commandes */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Historique dans les commandes groupées ({detailMember.participations_count})
                </h3>

                {detailMember.participations.length === 0 ? (
                  <div className="p-4 border rounded-lg bg-muted/20 text-center text-sm text-muted-foreground">
                    Ce membre n'a pas encore participé à une commande groupée.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detailMember.participations.map((part) => (
                      <div
                        key={part.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/20 text-sm"
                      >
                        <div>
                          <p className="font-medium">{part.order_title}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {part.prestation_type} • Rejoint le {new Date(part.joined_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {part.committed_area} ha
                          </p>
                          <Badge
                            variant={part.status === "confirmed" ? "default" : "secondary"}
                            className="text-[10px] uppercase font-bold"
                          >
                            {part.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDetailMember(null)}
                >
                  Fermer
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setMemberToDetach(detailMember);
                  }}
                  className="gap-2"
                >
                  <UserMinus className="w-4 h-4" />
                  Retirer de la coopérative
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog Confirmation Détachement ── */}
      <AlertDialog
        open={!!memberToDetach}
        onOpenChange={(open) => !open && setMemberToDetach(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <UserMinus className="w-5 h-5" />
              Retirer ce membre de la coopérative ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous certain de vouloir dissocier{" "}
              <strong className="text-foreground">{memberToDetach?.full_name}</strong> de votre coopérative ?
              <br />
              Cet agriculteur ne recevra plus les annonces de vos commandes groupées jusqu'à ce qu'il soit réaffilié.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDetach}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {detachMember.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirmer le retrait
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default CooperativeMembers;
