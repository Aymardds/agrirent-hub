
import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('🔐 AuthContext: Initializing...');

        // Check active sessions and sets the user
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                console.log('✅ AuthContext: getSession resolved', { hasSession: !!session });
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
                if (session) {
                    console.log("Supabase Connection Viable: Session found");
                } else {
                    console.log("Supabase Connection Viable: No active session");
                }
            })
            .catch((error) => {
                console.error('❌ AuthContext: getSession ERROR', error);
                setLoading(false);
            });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('🔄 AuthContext: Auth state changed', { event: _event, hasSession: !!session });
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        session,
        user,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
