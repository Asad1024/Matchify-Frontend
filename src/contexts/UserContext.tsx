import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUserId, setCurrentUserId } from "@/lib/mockData";

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
  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id) return u.id;
      if (u?.userId) return u.userId;
    }
  } catch {
    /* ignore */
  }
  return getCurrentUserId();
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(getStoredUserId);

  // Keep in sync when another tab logs in/out or currentUser is updated
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "currentUser" || e.key === "authToken") {
        setUserId(getStoredUserId());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const id = getStoredUserId();
    setUserId(id);
    if (id) setCurrentUserId(id);
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
