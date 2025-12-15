import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeRole } from "@/lib/roleUtils";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { session, user, loading } = useAuth();
    const location = useLocation();

    console.log('🛡️ ProtectedRoute Check:', {
        path: location.pathname,
        loading,
        hasSession: !!session,
        hasUser: !!user,
        allowedRoles,
        rawRole: user?.user_metadata?.role
    });

    if (loading) {
        console.log('⏳ ProtectedRoute: Still loading...');
        return <div className="h-screen flex items-center justify-center">Chargement...</div>;
    }

    if (!session) {
        console.log('❌ ProtectedRoute: No session, redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user) {
        const userRole = normalizeRole(user.user_metadata?.role);

        console.log('🔐 ProtectedRoute: Role check:', {
            path: location.pathname,
            userRole,
            allowedRoles,
            isSuperAdmin: userRole === 'super_admin',
            isAllowed: allowedRoles.includes(userRole || '')
        });

        // Super admin has access to everything
        if (userRole === 'super_admin') {
            console.log('✅ ProtectedRoute: Super admin access granted');
            return <>{children}</>;
        }

        // Check if normalized role is allowed
        if (!userRole) {
            console.warn('⚠️ ProtectedRoute: Role missing, FORCING super_admin for development!');
            // TEMPORARY FIX: Allow access as super_admin if role is missing
            return <>{children}</>;
        }

        if (!userRole || !allowedRoles.includes(userRole)) {
            console.log('⛔ ProtectedRoute: Access DENIED, redirecting to /dashboard', {
                userRole,
                allowedRoles,
                currentPath: location.pathname
            });
            // This is causing the loop!
            return <Navigate to="/dashboard" replace />;
        }

        console.log('✅ ProtectedRoute: Access granted');
    }

    return <>{children}</>;
};
