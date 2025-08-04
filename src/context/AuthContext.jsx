import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FailedNotification } from "../components/FailedNotification";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const getToken = () => localStorage.getItem("access_token");
  const getUserRole = () => localStorage.getItem("user_role");
  const getUser = () => JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const location = useLocation();
  const [failedSuccess, setFailedSuccess] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = getToken();
    return !!token;
  });

  const [userRole, setUserRole] = useState(() => {
    const role = getUserRole();
    return role || "user";
  });

  const [user, setUser] = useState(() => {
    const user = getUser();
    return user || null;
  });

  const isTokenValid = () => {
    const token = getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      console.error("Error decoding token:", error);
      return false;
    }
  };

  const clearSession = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUserRole("user");
    setUser(null);
  }, [navigate, location.pathname]);

  const logout = useCallback(() => {
    clearSession();
    navigate("/login");
  }, [navigate, location.pathname, clearSession]);

  const login = useCallback((token, refreshToken, role, userData) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user_role", role);
    localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUserRole(role);
    setUser(userData);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!getToken());
      setUserRole(getUserRole() || "user");
      setUser(getUser());
    };

    const checkAuthAndRedirect = () => {
      const protectedPaths = [
        "/MiCarrito",
        "/Mi-cuenta",
        "/admin-panel/gestionar/",
      ];
      const requiresAuth = protectedPaths.some((path) =>
        location.pathname.startsWith(path)
      );

      if (!isTokenValid()) {
        if (requiresAuth) {
          logout();
          setFailedSuccess(true);
        } else {
          clearSession();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(checkAuthAndRedirect, 5000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [logout, location.pathname, isTokenValid]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        userRole,
        setUserRole,
        user,
        setUser,
        isTokenValid,
        logout,
        login,
      }}
    >
      {children}{" "}
      {failedSuccess && (
        <FailedNotification
          message="Sessión expirada, redirigiendo al Login..."
          onClose={() => setFailedSuccess(false)}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
