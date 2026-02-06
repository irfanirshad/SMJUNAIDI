import { createContext, useContext, ReactNode } from "react";
import useAuthStore from "@/store/useAuthStore";

type PermissionsContextType = {
  canPerformCRUD: boolean;
  isReadOnly: boolean;
  isAdmin: boolean;
  can: (permission: string) => boolean;
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
);

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { canPerformCRUD, isReadOnly, checkIsAdmin } = useAuthStore();

  const value = {
    canPerformCRUD: canPerformCRUD(),
    isReadOnly: isReadOnly(),
    isAdmin: checkIsAdmin(),
    can: (permission: string) => {
      if (permission === "manage_vendors") return checkIsAdmin();
      return false;
    },
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};
