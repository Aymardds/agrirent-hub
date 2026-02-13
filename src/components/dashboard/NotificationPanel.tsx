import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification, type Notification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    CheckCheck,
    Trash2,
    ShoppingCart,
    Wrench,
    PlayCircle,
    CheckCircle,
    XCircle,
    CreditCard,
    FileText,
    Info,
    Bell
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NotificationPanelProps {
    onClose?: () => void;
}

const getNotificationIcon = (eventType: Notification['event_type']) => {
    const iconClass = "h-5 w-5";

    switch (eventType) {
        case 'rental_created':
        case 'rental_updated':
            return <ShoppingCart className={iconClass} />;
        case 'rental_completed':
            return <CheckCircle className={iconClass} />;
        case 'mission_assigned':
            return <Wrench className={iconClass} />;
        case 'mission_started':
            return <PlayCircle className={iconClass} />;
        case 'mission_completed':
            return <CheckCircle className={iconClass} />;
        case 'mission_cancelled':
            return <XCircle className={iconClass} />;
        case 'payment_received':
        case 'payment_pending':
            return <CreditCard className={iconClass} />;
        case 'invoice_generated':
            return <FileText className={iconClass} />;
        default:
            return <Info className={iconClass} />;
    }
};

const getNotificationColor = (type: Notification['type'], read: boolean) => {
    if (read) return "text-muted-foreground";

    switch (type) {
        case 'success':
            return "text-green-600";
        case 'warning':
            return "text-yellow-600";
        case 'error':
            return "text-red-600";
        default:
            return "text-blue-600";
    }
};

export const NotificationPanel = ({ onClose }: NotificationPanelProps) => {
    const { data: notifications = [], isLoading } = useNotifications(20);
    const markAsRead = useMarkNotificationAsRead();
    const markAllAsRead = useMarkAllNotificationsAsRead();
    const deleteNotification = useDeleteNotification();
    const navigate = useNavigate();

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        if (!notification.read) {
            markAsRead.mutate(notification.id);
        }

        // Navigate to action URL if exists
        if (notification.action_url) {
            navigate(notification.action_url);
            onClose?.();
        }
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead.mutate();
    };

    const handleDelete = (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        deleteNotification.mutate(notificationId);
    };

    if (isLoading) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                Chargement...
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-3">
                <h3 className="font-semibold text-lg">Notifications</h3>
                {notifications.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="text-xs"
                    >
                        <CheckCheck className="h-4 w-4 mr-1" />
                        Tout marquer comme lu
                    </Button>
                )}
            </div>

            <Separator />

            {/* Notifications List */}
            <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Aucune notification</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={cn(
                                    "p-4 hover:bg-accent cursor-pointer transition-colors group relative",
                                    !notification.read && "bg-blue-50/50 dark:bg-blue-950/20"
                                )}
                            >
                                <div className="flex gap-3">
                                    {/* Icon */}
                                    <div className={cn(
                                        "flex-shrink-0 mt-0.5",
                                        getNotificationColor(notification.type, notification.read)
                                    )}>
                                        {getNotificationIcon(notification.event_type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn(
                                                "font-medium text-sm",
                                                notification.read ? "text-muted-foreground" : "text-foreground"
                                            )}>
                                                {notification.title}
                                            </p>

                                            {/* Delete button */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                onClick={(e) => handleDelete(e, notification.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <p className={cn(
                                            "text-sm mt-1",
                                            notification.read ? "text-muted-foreground" : "text-foreground/80"
                                        )}>
                                            {notification.message}
                                        </p>

                                        <p className="text-xs text-muted-foreground mt-2">
                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                                locale: fr,
                                            })}
                                        </p>
                                    </div>

                                    {/* Unread indicator */}
                                    {!notification.read && (
                                        <div className="flex-shrink-0 mt-2">
                                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};
