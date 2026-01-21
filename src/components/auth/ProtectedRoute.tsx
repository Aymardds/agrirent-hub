import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeRole } from "@/lib/roleUtils";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { session, profile, loading } = useAuth();
    const location = useLocation();

    console.log('🛡️ ProtectedRoute Check:', {
        path: location.pathname,
        loading,
        hasSession: !!session,
        role: profile?.role,
        allowedRoles,
    });

    if (loading) {
        return <div className="h-screen flex items-center justify-center">Chargement...</div>;
    }

    if (!session) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (allowedRoles) {
        // Fallback to JWT role only if profile is not yet available, 
        // but AuthContext now ensures profile is loaded or failed before loading=false
        const userRole = normalizeRole(profile?.role || undefined);

        // Super admin has access to everything
        if (userRole === 'super_admin') {
            return <>{children}</>;
        }

        if (!userRole || !allowedRoles.includes(userRole)) {
            console.log('⛔ ProtectedRoute: Access DENIED', {
                userRole,
                allowedRoles,
                currentPath: location.pathname
            });
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
};
