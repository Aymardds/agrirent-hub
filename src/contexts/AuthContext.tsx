
import { createContext, useContext, useEffect, useRef, useState } from "react";
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

    // Use refs to track initialization and mount state across async calls
    const initializedRef = useRef(false);
    const isMountedRef = useRef(true);
    const fetchingRef = useRef(false);

    const fetchProfile = async (userId: string, userObject?: User | null) => {
        // Prevent concurrent fetches — only the first one runs
        if (fetchingRef.current) {
            console.log('⏭️ AuthContext: Profile fetch already in progress, skipping');
            return;
        }
        fetchingRef.current = true;
        console.log('🔄 AuthContext: Fetching profile for', userId);

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
                    throw error;
                } else if (isMountedRef.current) {
                    console.log('✅ AuthContext: Profile fetched successfully', data);
                    setProfile(data);
                }
            }
        } catch (err: any) {
            console.error('❌ AuthContext: Profile fetch failed or timed out:', err);

            const currentUser = userObject;

            if (isMountedRef.current && currentUser?.user_metadata?.role) {
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
            }
            // Do NOT set profile to null — keep whatever was there before
        } finally {
            fetchingRef.current = false;
            if (isMountedRef.current) {
                setLoading(false);
                console.log('🏁 AuthContext: Profile fetch flow completed, loading set to false');
            }
        }
    };

    useEffect(() => {
        isMountedRef.current = true;
        console.log('🔐 AuthContext: Initializing mounting...');

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('✅ AuthContext: getSession result', { hasSession: !!session });

                if (session && isMountedRef.current) {
                    setSession(session);
                    setUser(session.user);
                    await fetchProfile(session.user.id, session.user);
                } else if (isMountedRef.current) {
                    setLoading(false);
                }
                initializedRef.current = true;
            } catch (error) {
                console.error('❌ AuthContext: Initialization error', error);
                if (isMountedRef.current) setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔄 AuthContext: onAuthStateChange event', { event, hasSession: !!session, initialized: initializedRef.current });

            // Skip INITIAL_SESSION if initAuth already handled it
            if (event === 'INITIAL_SESSION' && initializedRef.current) {
                console.log('⏭️ AuthContext: Skipping INITIAL_SESSION — already initialized');
                return;
            }

            if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
                if (isMountedRef.current) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        await fetchProfile(session.user.id, session.user);
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                if (isMountedRef.current) {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
            }
        });

        return () => {
            isMountedRef.current = false;
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        session,
        user,
        profile,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
