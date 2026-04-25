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
    logout,
    updateProfile,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
