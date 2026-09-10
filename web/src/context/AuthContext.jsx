import React, { createContext, useState, useEffect } from "react";
import * as api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const storedToken = api.getToken();
    if (storedToken) {
      setTokenState(storedToken);
      // Fetch user data to verify token is valid
      api
        .getMe()
        .then((userData) => setUser(userData))
        .catch(() => {
          // Token is invalid, clear it
          api.clearToken();
          setTokenState(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await api.login(email, password);
    const newToken = response.access_token;
    api.setToken(newToken);
    setTokenState(newToken);

    // Fetch user data
    const userData = await api.getMe();
    setUser(userData);
  };

  const register = async (data) => {
    return api.register(data);
  };

  const logout = () => {
    api.clearToken();
    setTokenState(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
