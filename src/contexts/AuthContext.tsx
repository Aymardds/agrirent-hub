
import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface Profile {
    id: string;
    full_name: string | null;
    role: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    avatar_url: string | null;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    session: null,
    loading: true,
});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string, userObject?: User | null) => {
        console.log('🔄 AuthContext: Fetching profile for', userId);

        // Timeout of 10 seconds
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AuthContext: Profile fetch timeout (10s)')), 10000)
        );

        try {
            const profileQuery = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            console.log('📡 AuthContext: Sending profile query to Supabase...');
            const response = await Promise.race([profileQuery, timeoutPromise]) as any;

            if (response && (response.data !== undefined || response.error !== undefined)) {
                const { data, error } = response;
                if (error) {
                    console.error('❌ AuthContext: Error fetching profile:', error);
                    throw error; // Throw to handle fallback in catch block
                } else {
                    console.log('✅ AuthContext: Profile fetched successfully', data);
                    setProfile(data);
                }
            }
        } catch (err: any) {
            console.error('❌ AuthContext: Profile fetch failed or timed out:', err);

            // Use provided user object or current session user as fallback
            // Avoid making new async calls (getUser) here as they might also hang/fail
            const currentUser = userObject || user || session?.user;

            if (currentUser?.user_metadata?.role) {
                console.log('⚠️ AuthContext: Using role from user metadata as fallback');
                setProfile({
                    id: userId,
                    full_name: currentUser.user_metadata.full_name || currentUser.email || null,
                    role: currentUser.user_metadata.role,
                    email: currentUser.email || null,
                    phone: currentUser.user_metadata.phone || null,
                    company: currentUser.user_metadata.company || null,
                    avatar_url: null
                });
            } else {
                setProfile(null);
            }
        } finally {
            setLoading(false);
            console.log('🏁 AuthContext: Profile fetch flow completed, loading set to false');
        }
    };

    useEffect(() => {
        let initialized = false;
        console.log('🔐 AuthContext: Initializing mounting...');

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('✅ AuthContext: getSession result', { hasSession: !!session });

                if (session) {
                    setSession(session);
                    setUser(session.user);
                    await fetchProfile(session.user.id, session.user); // Pass session.user for robust fallback
                } else {
                    setLoading(false);
                }
                initialized = true;
            } catch (error) {
                console.error('❌ AuthContext: Initialization error', error);
                setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔄 AuthContext: onAuthStateChange event', { event, hasSession: !!session });

            // Only re-fetch if the session definitely changed or we weren't initialized
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || (event === 'INITIAL_SESSION' && !initialized)) {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id, session.user);
                }
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        session,
        user,
        profile,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
