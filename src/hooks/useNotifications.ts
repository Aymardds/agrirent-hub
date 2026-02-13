import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { toast } from "sonner";

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    read: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
    event_type:
    | 'rental_created'
    | 'rental_updated'
    | 'rental_completed'
    | 'mission_assigned'
    | 'mission_started'
    | 'mission_completed'
    | 'mission_cancelled'
    | 'payment_received'
    | 'payment_pending'
    | 'invoice_generated';
    link?: string;
    action_url?: string;
    related_entity_type?: 'rental' | 'intervention' | 'payment' | 'invoice';
    related_entity_id?: string;
    metadata?: Record<string, any>;
    created_at: string;
}

/**
 * Hook to fetch all notifications for the current user
 */
export const useNotifications = (limit?: number) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["notifications", limit],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            let query = supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (limit) {
                query = query.limit(limit);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as Notification[];
        },
        staleTime: 1000 * 30, // 30 seconds
    });

    // Set up real-time subscription
    useEffect(() => {
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const channel = supabase
                .channel('notifications-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        // Invalidate and refetch notifications
                        queryClient.invalidateQueries({ queryKey: ["notifications"] });
                        queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });

                        // Show toast for new notifications
                        if (payload.eventType === 'INSERT') {
                            const notification = payload.new as Notification;
                            toast[notification.type || 'info'](notification.title, {
                                description: notification.message,
                            });
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        setupSubscription();
    }, [queryClient]);

    return query;
};

/**
 * Hook to get count of unread notifications
 */
export const useUnreadNotificationsCount = () => {
    return useQuery({
        queryKey: ["unread-notifications-count"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;

            const { count, error } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("read", false);

            if (error) throw error;
            return count || 0;
        },
        staleTime: 1000 * 30, // 30 seconds
    });
};

/**
 * Hook to mark a notification as read
 */
export const useMarkNotificationAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("id", notificationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
        },
    });
};

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllNotificationsAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("user_id", user.id)
                .eq("read", false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
            toast.success("Toutes les notifications ont été marquées comme lues");
        },
    });
};

/**
 * Hook to delete a notification
 */
export const useDeleteNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("id", notificationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
            toast.success("Notification supprimée");
        },
    });
};

/**
 * Hook to delete all read notifications
 */
export const useDeleteAllReadNotifications = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("user_id", user.id)
                .eq("read", true);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
            toast.success("Notifications lues supprimées");
        },
    });
};
