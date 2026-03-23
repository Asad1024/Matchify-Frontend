import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Dashboard from "@/pages/admin/Dashboard";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false); // Start as false
  
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const authToken = localStorage.getItem("authToken");
    const currentUser = localStorage.getItem("currentUser");
    
    // Require BOTH isAdmin flag AND authToken
    if (isAdmin !== "true" || !authToken) {
      // Clear invalid admin session
      if (isAdmin === "true" && !authToken) {
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("currentUser");
      }
      setIsAuthorized(false);
      setLocation("/admin/login");
      return;
    }
    
    // Double-check user object has isAdmin flag
    try {
      if (currentUser) {
        const user = JSON.parse(currentUser);
        if (!user.isAdmin) {
          // User object says not admin, clear session
          localStorage.removeItem("isAdmin");
          localStorage.removeItem("authToken");
          localStorage.removeItem("currentUser");
          setIsAuthorized(false);
          setLocation("/admin/login");
          return;
        }
      }
    } catch (e) {
      // Invalid user data, clear session
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      setIsAuthorized(false);
      setLocation("/admin/login");
      return;
    }
    
    setIsAuthorized(true);
  }, [setLocation]);

  if (!isAuthorized) {
    return null; // Will redirect to login
  }

  return <Dashboard />;
}

