import { createContext, useContext, useState, useEffect } from "react";
import { setCurrentUserId } from "@/lib/mockData";
import {
  getReconciledStoredUserId,
  getStoredUserIdFromCurrentUserJson,
  reconcileCurrentUserIdWithJwt,
} from "@/lib/authUserIdReconcile";

interface UserContextType {
  userId: string | null;
  isLoading: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextType>({
  userId: null,
  isLoading: false,
  error: null,
});

function getStoredUserId(): string | null {
  return getReconciledStoredUserId();
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(getStoredUserId);

  const syncUser = () => {
    const fixed = reconcileCurrentUserIdWithJwt();
    const id = getStoredUserIdFromCurrentUserJson();
    setUserId(id);
    if (id) setCurrentUserId(id);
    if (fixed) {
      try {
        window.dispatchEvent(new Event("matchify-auth-changed"));
      } catch {
        /* ignore */
      }
    }
  };

  // Keep in sync when another tab logs in/out or currentUser is updated
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "currentUser" || e.key === "authToken") {
        syncUser();
      }
    };
    const onAuthChanged = () => syncUser();
    window.addEventListener("storage", onStorage);
    window.addEventListener("matchify-auth-changed", onAuthChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("matchify-auth-changed", onAuthChanged);
    };
  }, []);

  useEffect(() => {
    syncUser();
  }, []);

  return (
    <UserContext.Provider
      value={{ userId, isLoading: false, error: null }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(UserContext);
}
