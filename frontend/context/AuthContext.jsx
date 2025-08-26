import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // -----------------------------
  // Check if user is authenticated
  // -----------------------------
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // -----------------------------
  // Login / Signup
  // -----------------------------
  const login = async (state, credentials) => {
    try {
      let payload =
        state === "login"
          ? { email: credentials.email, password: credentials.password }
          : credentials;

      const { data } = await axios.post(`/api/auth/${state}`, payload);

      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);

        // Set token for axios
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);

        toast.success(data.message);
        return { success: true };
      } else {
        toast.error(data.message);
        return { success: false };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      return { success: false };
    }
  };

  // -----------------------------
  // Logout
  // -----------------------------
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    delete axios.defaults.headers.common["token"];
    socket?.disconnect();
    toast.success("Logged out successfully");
  };

  // -----------------------------
  // Update user profile
  // -----------------------------
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.userData);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // -----------------------------
  // Connect to Socket.io server
  // -----------------------------
  const connectSocket = (userData) => {
    if (!userData) return;

    // Disconnect previous socket if exists
    if (socket) socket.disconnect();

    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
    });

    setSocket(newSocket);

    // Listen for online users
    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("✅ Online Users from server:", userIds);
      setOnlineUsers(userIds);
    });
  };

  // -----------------------------
  // Initialize on token change
  // -----------------------------
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
      checkAuth();
    }

    return () => {
      socket?.disconnect();
    };
  }, [token]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
