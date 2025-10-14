import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { authService, User, cartService } from "@/services";

interface AuthSession {
  user: User;
  token: string;
}

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            // Verify token is still valid by fetching current user
            const currentUser = await authService.getCurrentUser();
            const token = authService.getToken();

            if (currentUser && token) {
              setUser(currentUser);
              setSession({ user: currentUser, token });
              setIsAdmin(currentUser.role === "admin");

              // Sync local cart with server if user is logged in
              await cartService.syncLocalCartWithServer();
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear invalid session on error
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // Empty dependency array is correct here - we only want this to run once on mount

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    try {
      setLoading(true);
      const authResponse = await authService.login({ email, password });

      if (authResponse.user && authResponse.token) {
        setUser(authResponse.user);
        setSession(authResponse);
        setIsAdmin(authResponse.user.role === "admin");

        // Sync local cart after successful login
        await cartService.syncLocalCartWithServer();

        return { error: null };
      }

      return { error: new Error("Login failed") };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: Error | null }> => {
    try {
      setLoading(true);
      const authResponse = await authService.register({
        email,
        password,
        full_name: fullName,
      });

      if (authResponse.user && authResponse.token) {
        setUser(authResponse.user);
        setSession(authResponse);
        setIsAdmin(authResponse.user.role === "admin");

        // Sync local cart after successful registration
        await cartService.syncLocalCartWithServer();

        return { error: null };
      }

      return { error: new Error("Registration failed") };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      navigate("/");
    }
  };

  const value = {
    user,
    session,
    isAdmin,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
