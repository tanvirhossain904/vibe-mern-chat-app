import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [guestLoading, setGuestLoading] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);

  const connectSocket = (userData) => {
    if (!userData) return;
    const newSocket = io(backendUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
    });
    newSocket.on("getOnlineUsers", setOnlineUsers);
    newSocket.on("connect_error", (err) => {
      if (err.message === "Unauthorized") {
        setAuthUser(null);
      }
    });
    setSocket(newSocket);
  };

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch {
      // not authenticated; treat as logged out
    } finally {
      setAuthChecked(true);
    }
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
        toast.success(state === "signup" ? "Account created" : "Welcome back");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Request failed");
    }
  };

  const guestLogin = async () => {
    if (guestLoading) return;
    setGuestLoading(true);
    setWakingUp(false);
    // Free-tier hosts (Render etc.) cold-start in ~30s. Show a hint after 3s.
    const wakingTimer = setTimeout(() => setWakingUp(true), 3000);
    try {
      const { data } = await axios.post(
        "/api/auth/login",
        { email: "guest@vibe.com", password: "password123" },
        { timeout: 60_000 }
      );
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
        toast.success("Welcome, Guest!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Guest login failed");
    } finally {
      clearTimeout(wakingTimer);
      setWakingUp(false);
      setGuestLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch {
      // ignore
    }
    socket?.disconnect();
    setSocket(null);
    setAuthUser(null);
    setOnlineUsers([]);
    toast.success("Logged out");
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const deleteAccount = async () => {
    try {
      const { data } = await axios.delete("/api/auth/me");
      if (data.success) {
        socket?.disconnect();
        setSocket(null);
        setAuthUser(null);
        setOnlineUsers([]);
        toast.success("Account deleted");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    axios,
    authUser,
    authChecked,
    onlineUsers,
    socket,
    login,
    guestLogin,
    guestLoading,
    wakingUp,
    logout,
    updateProfile,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
