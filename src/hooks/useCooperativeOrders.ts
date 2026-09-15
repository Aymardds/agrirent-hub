import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface EquipmentServicePrice {
  amount: number;
  unit: string;
}

export interface EquipmentServiceItem {
  id: string;
  equipment_id: string;
  name: string;
  description?: string;
  prices: EquipmentServicePrice[];
}

export interface EquipmentCatalogItem {
  id: string;
  name: string;
  category: string;
  service_type: string;
  price: number;
  price_unit: string;
  location: string;
  available: boolean;
  image_url?: string;
  specs?: string[];
  equipment_services?: EquipmentServiceItem[];
}

export interface CooperativeOrder {
  id: string;
  cooperative_id: string;
  title: string;
  description: string | null;
  prestation_type: string;
  quota_type: "area" | "members";
  quota_target: number;
  current_progress: number;
  equipment_type: string | null;
  equipment_id?: string | null;
  service_id?: string | null;
  price_per_ha: number | null;
  price_unit?: string | null;
  deadline: string | null;
  status: "open" | "quota_reached" | "submitted" | "confirmed" | "cancelled";
  created_at: string;
  submitted_at: string | null;
  admin_confirmed_at: string | null;
  admin_notes: string | null;
  equipment?: {
    id: string;
    name: string;
    category?: string;
    image_url?: string;
    price?: number;
    price_unit?: string;
    location?: string;
  } | null;
}

export interface CooperativeParticipation {
  id: string;
  order_id: string;
  member_id: string;
  committed_area: number;
  property_id: string | null;
  status: "pending" | "confirmed" | "cancelled";
  notes: string | null;
  joined_at: string;
  member?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    company: string | null;
  };
  property?: {
    id: string;
    name: string;
    size: number;
  } | null;
}

export interface CooperativeOrderWithParticipations extends CooperativeOrder {
  participations: CooperativeParticipation[];
  participants_count: number;
}

export interface CreateOrderPayload {
  title: string;
  description?: string;
  prestation_type: string;
  quota_type: "area" | "members";
  quota_target: number;
  equipment_type?: string;
  equipment_id?: string;
  service_id?: string;
  price_per_ha?: number;
  price_unit?: string;
  deadline?: string;
}

export interface JoinOrderPayload {
  order_id: string;
  committed_area: number;
  property_id?: string;
  notes?: string;
}

// ─── Hooks Coopérative ─────────────────────────────────────────────────────

/**
 * Liste des commandes groupées d'une coopérative
 */
export const useCooperativeOrders = (cooperativeId: string | undefined) => {
  return useQuery({
    queryKey: ["cooperative-orders", cooperativeId],
    enabled: !!cooperativeId,
    queryFn: async (): Promise<CooperativeOrder[]> => {
      const { data, error } = await supabase
        .from("cooperative_orders")
        .select("*, equipment:equipment_id(id, name, category, image_url, price, price_unit, location)")
        .eq("cooperative_id", cooperativeId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Détails d'une commande groupée avec ses participations
 */
export const useCooperativeOrderDetails = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ["cooperative-order-details", orderId],
    enabled: !!orderId,
    queryFn: async (): Promise<CooperativeOrderWithParticipations | null> => {
      const { data: order, error: orderError } = await supabase
        .from("cooperative_orders")
        .select("*, equipment:equipment_id(id, name, category, image_url, price, price_unit, location)")
        .eq("id", orderId!)
        .single();

      if (orderError) throw orderError;
      if (!order) return null;

      const { data: participations, error: partError } = await supabase
        .from("cooperative_order_participations")
        .select(`
          *,
          member:member_id (
            id,
            full_name,
            phone,
            company
          ),
          property:property_id (
            id,
            name,
            size
          )
        `)
        .eq("order_id", orderId!)
        .neq("status", "cancelled")
        .order("joined_at", { ascending: false });

      if (partError) throw partError;

      return {
        ...order,
        participations: participations || [],
        participants_count: participations?.length || 0,
      };
    },
    staleTime: 1000 * 60 * 1,
  });
};

/**
 * Membres liés à une coopérative
 */
export const useCooperativeMembers = (cooperativeId: string | undefined) => {
  return useQuery({
    queryKey: ["cooperative-members", cooperativeId],
    enabled: !!cooperativeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, company, created_at")
        .eq("cooperative_id", cooperativeId!)
        .eq("role", "client");

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Statistiques de la coopérative
 */
export const useCooperativeStats = (cooperativeId: string | undefined) => {
  return useQuery({
    queryKey: ["cooperative-stats", cooperativeId],
    enabled: !!cooperativeId,
    queryFn: async () => {
      // Nombre de membres
      const { count: membersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("cooperative_id", cooperativeId!)
        .eq("role", "client");

      // Commandes par statut
      const { data: orders } = await supabase
        .from("cooperative_orders")
        .select("status, current_progress, quota_target")
        .eq("cooperative_id", cooperativeId!);

      const openOrders = orders?.filter((o) => o.status === "open").length || 0;
      const quotaReached = orders?.filter((o) => o.status === "quota_reached").length || 0;
      const submitted = orders?.filter((o) => o.status === "submitted").length || 0;
      const confirmed = orders?.filter((o) => o.status === "confirmed").length || 0;

      // Superficie totale engagée sur les commandes ouvertes
      const totalEngagedArea = orders
        ?.filter((o) => ["open", "quota_reached", "submitted"].includes(o.status))
        .reduce((sum, o) => sum + (o.current_progress || 0), 0) || 0;

      return {
        membersCount: membersCount || 0,
        openOrders,
        quotaReached,
        submitted,
        confirmed,
        totalEngagedArea,
        totalOrders: orders?.length || 0,
      };
    },
    staleTime: 1000 * 60 * 3,
  });
};

// ─── Hooks Client (membres de la coopérative) ──────────────────────────────

/**
 * Annonces de commandes groupées pour un client membre d'une coopérative
 */
export const useMyCooperativeAnnouncements = (
  cooperativeId: string | null | undefined
) => {
  return useQuery({
    queryKey: ["my-cooperative-announcements", cooperativeId],
    enabled: !!cooperativeId,
    queryFn: async (): Promise<CooperativeOrder[]> => {
      const { data, error } = await supabase
        .from("cooperative_orders")
        .select("*, equipment:equipment_id(id, name, category, image_url, price, price_unit, location)")
        .eq("cooperative_id", cooperativeId!)
        .in("status", ["open", "quota_reached"])
        .order("deadline", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Participation d'un membre à une commande spécifique
 */
export const useMyParticipation = (
  orderId: string | undefined,
  memberId: string | undefined
) => {
  return useQuery({
    queryKey: ["my-participation", orderId, memberId],
    enabled: !!orderId && !!memberId,
    queryFn: async (): Promise<CooperativeParticipation | null> => {
      const { data, error } = await supabase
        .from("cooperative_order_participations")
        .select("*")
        .eq("order_id", orderId!)
        .eq("member_id", memberId!)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 30,
  });
};

// ─── Mutations ─────────────────────────────────────────────────────────────

/**
 * Créer une nouvelle commande groupée (pour coopérative)
 */
export const useCreateCooperativeOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cooperativeId,
      payload,
    }: {
      cooperativeId: string;
      payload: CreateOrderPayload;
    }) => {
      const { data, error } = await supabase
        .from("cooperative_orders")
        .insert({
          cooperative_id: cooperativeId,
          ...payload,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { cooperativeId }) => {
      queryClient.invalidateQueries({ queryKey: ["cooperative-orders", cooperativeId] });
      queryClient.invalidateQueries({ queryKey: ["cooperative-stats", cooperativeId] });
      toast.success("Commande groupée créée avec succès !");
    },
    onError: (error: any) => {
      toast.error("Erreur lors de la création : " + error.message);
    },
  });
};

/**
 * Rejoindre / confirmer sa participation à une commande (pour client)
 */
export const useJoinCooperativeOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      payload,
    }: {
      memberId: string;
      payload: JoinOrderPayload;
    }) => {
      // Upsert — si déjà participé, met à jour
      const { data, error } = await supabase
        .from("cooperative_order_participations")
        .upsert(
          {
            order_id: payload.order_id,
            member_id: memberId,
            committed_area: payload.committed_area,
            property_id: payload.property_id || null,
            notes: payload.notes || null,
            status: "pending",
          },
          { onConflict: "order_id,member_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cooperative-order-details", data.order_id] });
      queryClient.invalidateQueries({ queryKey: ["my-participation", data.order_id, data.member_id] });
      queryClient.invalidateQueries({ queryKey: ["my-cooperative-announcements"] });
      toast.success("Votre participation a été enregistrée !");
    },
    onError: (error: any) => {
      toast.error("Erreur : " + error.message);
    },
  });
};

/**
 * Annuler sa participation (pour client)
 */
export const useCancelParticipation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      participationId,
      orderId,
      memberId,
    }: {
      participationId: string;
      orderId: string;
      memberId: string;
    }) => {
      const { error } = await supabase
        .from("cooperative_order_participations")
        .update({ status: "cancelled" })
        .eq("id", participationId);

      if (error) throw error;
      return { orderId, memberId };
    },
    onSuccess: ({ orderId, memberId }) => {
      queryClient.invalidateQueries({ queryKey: ["cooperative-order-details", orderId] });
      queryClient.invalidateQueries({ queryKey: ["my-participation", orderId, memberId] });
      queryClient.invalidateQueries({ queryKey: ["my-cooperative-announcements"] });
      toast.info("Participation annulée.");
    },
    onError: (error: any) => {
      toast.error("Erreur : " + error.message);
    },
  });
};

/**
 * Soumettre une commande à l'admin Outiltech (pour coopérative, quand quota atteint)
 */
export const useSubmitOrderToAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      cooperativeId,
    }: {
      orderId: string;
      cooperativeId: string;
    }) => {
      const { data, error } = await supabase
        .from("cooperative_orders")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("cooperative_id", cooperativeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, { cooperativeId }) => {
      queryClient.invalidateQueries({ queryKey: ["cooperative-orders", cooperativeId] });
      queryClient.invalidateQueries({ queryKey: ["cooperative-order-details", data.id] });
      queryClient.invalidateQueries({ queryKey: ["cooperative-stats", cooperativeId] });
      queryClient.invalidateQueries({ queryKey: ["admin-submitted-orders"] });
      toast.success("✅ Commande transmise à l'équipe Outiltech !");
    },
    onError: (error: any) => {
      toast.error("Erreur lors de la transmission : " + error.message);
    },
  });
};

/**
 * [Admin] Confirmer une commande groupée soumise
 */
export const useConfirmCooperativeOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      adminNotes,
    }: {
      orderId: string;
      adminNotes?: string;
    }) => {
      const { data, error } = await supabase
        .from("cooperative_orders")
        .update({
          status: "confirmed",
          admin_confirmed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-submitted-orders"] });
      toast.success("✅ Commande coopérative confirmée !");
    },
    onError: (error: any) => {
      toast.error("Erreur : " + error.message);
    },
  });
};

/**
 * [Admin] Commandes groupées soumises (en attente de confirmation)
 */
export const useAdminSubmittedOrders = () => {
  return useQuery({
    queryKey: ["admin-submitted-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cooperative_orders")
        .select(`
          *,
          cooperative:cooperative_id (
            id,
            full_name,
            company,
            phone
          ),
          equipment:equipment_id (
            id,
            name,
            category,
            image_url,
            price,
            price_unit,
            location
          )
        `)
        .in("status", ["submitted", "quota_reached"])
        .order("submitted_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Récupérer l'ensemble des équipements du catalogue avec leurs prestations déclarées
 */
export const useEquipmentCatalog = () => {
  return useQuery({
    queryKey: ["equipment-catalog-for-coop"],
    queryFn: async (): Promise<EquipmentCatalogItem[]> => {
      const { data, error } = await supabase
        .from("equipment")
        .select("*, equipment_services(*)")
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};
