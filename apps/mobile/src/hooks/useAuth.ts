import { useUserStore } from '../store';

// Custom hook that provides a similar interface to the old useAuth hook
export const useAuth = () => {
  const {
    user,
    auth_token,
    isLoading,
    isAuthenticated,
    login,
    register,
    loginWithGoogle,
    logout,
    checkStoredAuth,
    refreshUser,
    updateProfile,
  } = useUserStore();

  return {
    user,
    token: auth_token, // Alias auth_token as token for easier use
    isLoading,
    isAuthenticated,
    login,
    register,
    loginWithGoogle,
    logout,
    checkStoredAuth,
    refreshUser,
    updateProfile,
  };
};
