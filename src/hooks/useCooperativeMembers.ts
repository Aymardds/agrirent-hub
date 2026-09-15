import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface MemberProperty {
  id: string;
  name: string;
  size: number;
  unit: string;
  department?: string;
  locality?: string;
  village?: string;
}

export interface MemberParticipation {
  id: string;
  order_id: string;
  order_title: string;
  prestation_type: string;
  committed_area: number;
  status: string;
  joined_at: string;
}

export interface CooperativeMemberDetail {
  id: string;
  full_name: string;
  phone: string;
  company: string;
  email?: string;
  created_at: string;
  properties: MemberProperty[];
  total_area: number;
  properties_count: number;
  participations: MemberParticipation[];
  participations_count: number;
}

export interface CooperativeMembersStats {
  totalMembers: number;
  totalCultivatedArea: number;
  totalProperties: number;
  activeParticipants: number;
}

/**
 * Hook pour récupérer les membres détaillés d'une coopérative
 * avec leurs propriétés, superficies et participations
 */
export const useCooperativeMembersDetail = (cooperativeId: string | undefined) => {
  return useQuery({
    queryKey: ["cooperative-members-detail", cooperativeId],
    enabled: !!cooperativeId,
    queryFn: async (): Promise<{
      members: CooperativeMemberDetail[];
      stats: CooperativeMembersStats;
    }> => {
      // 1. Récupérer les profils des membres clients
      const { data: membersData, error: membersError } = await supabase
        .from("profiles")
        .select("id, full_name, phone, company, created_at")
        .eq("cooperative_id", cooperativeId!)
        .eq("role", "client")
        .order("created_at", { ascending: false });

      if (membersError) throw membersError;
      if (!membersData || membersData.length === 0) {
        return {
          members: [],
          stats: {
            totalMembers: 0,
            totalCultivatedArea: 0,
            totalProperties: 0,
            activeParticipants: 0,
          },
        };
      }

      const memberIds = membersData.map((m) => m.id);

      // 2. Récupérer les propriétés/parcelles de ces membres
      let propertiesByOwner: Record<string, MemberProperty[]> = {};
      try {
        const { data: propsData, error: propsError } = await supabase
          .from("properties")
          .select("id, owner_id, name, size, unit, department, locality, village")
          .in("owner_id", memberIds);

        if (!propsError && propsData) {
          propsData.forEach((p: any) => {
            if (!propertiesByOwner[p.owner_id]) {
              propertiesByOwner[p.owner_id] = [];
            }
            propertiesByOwner[p.owner_id].push({
              id: p.id,
              name: p.name,
              size: Number(p.size) || 0,
              unit: p.unit || "hectares",
              department: p.department,
              locality: p.locality,
              village: p.village,
            });
          });
        }
      } catch (err) {
        console.warn("Could not fetch member properties:", err);
      }

      // 3. Récupérer les participations aux commandes groupées
      let participationsByMember: Record<string, MemberParticipation[]> = {};
      try {
        const { data: partsData, error: partsError } = await supabase
          .from("cooperative_order_participations")
          .select(`
            id,
            order_id,
            member_id,
            committed_area,
            status,
            joined_at,
            order:order_id (
              id,
              title,
              prestation_type
            )
          `)
          .in("member_id", memberIds);

        if (!partsError && partsData) {
          partsData.forEach((p: any) => {
            if (!participationsByMember[p.member_id]) {
              participationsByMember[p.member_id] = [];
            }
            participationsByMember[p.member_id].push({
              id: p.id,
              order_id: p.order_id,
              order_title: p.order?.title || "Commande groupée",
              prestation_type: p.order?.prestation_type || "prestation",
              committed_area: Number(p.committed_area) || 0,
              status: p.status,
              joined_at: p.joined_at,
            });
          });
        }
      } catch (err) {
        console.warn("Could not fetch member participations:", err);
      }

      // 4. Assembler les membres
      let totalCultivatedArea = 0;
      let totalProperties = 0;
      let activeParticipantsCount = 0;

      const members: CooperativeMemberDetail[] = membersData.map((m) => {
        const props = propertiesByOwner[m.id] || [];
        const parts = participationsByMember[m.id] || [];

        const totalArea = props.reduce((acc, curr) => acc + curr.size, 0);
        totalCultivatedArea += totalArea;
        totalProperties += props.length;
        if (parts.length > 0) activeParticipantsCount++;

        return {
          id: m.id,
          full_name: m.full_name || "Sans nom",
          phone: m.phone || "Non renseigné",
          company: m.company || "",
          created_at: m.created_at,
          properties: props,
          total_area: totalArea,
          properties_count: props.length,
          participations: parts,
          participations_count: parts.length,
        };
      });

      return {
        members,
        stats: {
          totalMembers: members.length,
          totalCultivatedArea: Math.round(totalCultivatedArea * 10) / 10,
          totalProperties,
          activeParticipants: activeParticipantsCount,
        },
      };
    },
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Hook pour récupérer les clients de la plateforme disponibles
 * (ceux qui ne sont pas encore affiliés à une coopérative)
 */
export const useAvailableClients = () => {
  return useQuery({
    queryKey: ["available-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, company, created_at")
        .eq("role", "client")
        .is("cooperative_id", null)
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Mutation pour rattacher un client existant à la coopérative
 */
export const useAttachMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      cooperativeId,
    }: {
      memberId: string;
      cooperativeId: string;
    }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ cooperative_id: cooperativeId })
        .eq("id", memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Membre rattaché avec succès à votre coopérative !");
      queryClient.invalidateQueries({ queryKey: ["cooperative-members"] });
      queryClient.invalidateQueries({ queryKey: ["cooperative-members-detail"] });
      queryClient.invalidateQueries({ queryKey: ["available-clients"] });
    },
    onError: (err: any) => {
      toast.error(`Erreur de rattachement : ${err.message}`);
    },
  });
};

/**
 * Mutation pour dissocier un membre de la coopérative
 */
export const useDetachMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      cooperativeId,
    }: {
      memberId: string;
      cooperativeId: string;
    }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ cooperative_id: null })
        .eq("id", memberId)
        .eq("cooperative_id", cooperativeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Membre retiré de la coopérative.");
      queryClient.invalidateQueries({ queryKey: ["cooperative-members"] });
      queryClient.invalidateQueries({ queryKey: ["cooperative-members-detail"] });
      queryClient.invalidateQueries({ queryKey: ["available-clients"] });
    },
    onError: (err: any) => {
      toast.error(`Erreur de retrait : ${err.message}`);
    },
  });
};

/**
 * Mutation pour créer directement un nouveau compte membre et l'affilier
 */
export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      fullName,
      phone,
      company,
    }: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
      company?: string;
    }) => {
      // 1. Tenter d'abord la RPC custom `cooperative_create_member`
      const { data, error } = await supabase.rpc("cooperative_create_member", {
        new_email: email,
        new_password: password,
        new_full_name: fullName,
        new_phone: phone || null,
        new_company: company || null,
      });

      if (error) {
        // Si l'erreur est que la fonction n'existe pas encore
        throw new Error(
          error.message.includes("does not exist")
            ? "Veuillez d'abord exécuter cooperative_members_migration.sql dans Supabase."
            : error.message
        );
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Nouveau membre inscrit et rattaché avec succès !");
      queryClient.invalidateQueries({ queryKey: ["cooperative-members"] });
      queryClient.invalidateQueries({ queryKey: ["cooperative-members-detail"] });
      queryClient.invalidateQueries({ queryKey: ["available-clients"] });
    },
    onError: (err: any) => {
      toast.error(`Erreur d'inscription du membre : ${err.message}`);
    },
  });
};
