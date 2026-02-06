import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import { canPerformCRUD, isReadOnlyUser } from "@/lib/readOnlyConfig";

type User = {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "user" | "employee";
  employee_role?:
    | "packer"
    | "deliveryman"
    | "accounts"
    | "incharge"
    | "call_center"
    | null;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => Promise<void>;
  setAuthData: (token: string, user: User) => void;
  logout: () => void;
  checkIsAdmin: () => boolean;
  canPerformCRUD: () => boolean;
  isReadOnly: () => boolean;
};

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials) => {
        try {
          const response = await api.post("/auth/login", credentials);

          if (response.data.token) {
            set({
              user: response.data,
              token: response.data.token,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          console.error("Login error:", error);
          throw error;
        }
      },

      register: async (userData) => {
        try {
          await api.post("/auth/register", userData);
        } catch (error) {
          console.error("Registration error:", error);
          throw error;
        }
      },

      setAuthData: (token: string, user: User) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkIsAdmin: () => {
        const { user } = get();
        return user?.role === "admin";
      },

      canPerformCRUD: () => {
        const { user } = get();
        return canPerformCRUD(user?.email, user?.role);
      },

      isReadOnly: () => {
        const { user } = get();
        return isReadOnlyUser(user?.email);
      },
    }),
    {
      name: "auth-storage",
    }
  )
);

export default useAuthStore;
