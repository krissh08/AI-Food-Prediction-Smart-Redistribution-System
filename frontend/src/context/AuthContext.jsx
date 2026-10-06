import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI, notificationsAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const u = await authAPI.getMe();
      setUser(u);
      localStorage.setItem("user", JSON.stringify(u));
    } catch (err) {
      console.error("Failed to load user profile:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      if (!token) return;
      const notifs = await notificationsAPI.getNotifications();
      setNotifications(notifs);
      setUnreadNotifCount(notifs.filter((n) => !n.read_status).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const login = async (email, password, role) => {
    const res = await authAPI.login({ email, password, role });
    localStorage.setItem("token", res.access_token);
    setToken(res.access_token);
    
    // Fetch user details
    const userData = await authAPI.getMe();
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  };

  const registerDonor = async (data) => {
    const res = await authAPI.registerDonor(data);
    localStorage.setItem("token", res.access_token);
    setToken(res.access_token);
    const userData = await authAPI.getMe();
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  };

  const registerAcceptor = async (data) => {
    const res = await authAPI.registerAcceptor(data);
    localStorage.setItem("token", res.access_token);
    setToken(res.access_token);
    const userData = await authAPI.getMe();
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadNotifCount(0);
  };

  const markNotificationAsRead = async (id) => {
    await notificationsAPI.markRead(id);
    fetchNotifications();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerDonor,
        registerAcceptor,
        logout,
        notifications,
        unreadNotifCount,
        refreshNotifications: fetchNotifications,
        markNotificationAsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
