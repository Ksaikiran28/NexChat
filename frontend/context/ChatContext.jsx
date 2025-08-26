import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.jsx";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);

  // -----------------------------
  // Fetch all users (except logged-in)
  // -----------------------------
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // -----------------------------
  // Fetch messages with selected user
  // -----------------------------
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);

        // Reset unseen messages count for this user
        setUnseenMessages((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // -----------------------------
  // Send a message
  // -----------------------------
  const sendMessage = async (messageData) => {
    if (!selectedUser) return toast.error("No user selected!");
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      if (data.success) {
        setMessages((prev) => [...prev, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // -----------------------------
  // Delete a message
  // -----------------------------
  const deleteMessage = async (messageId) => {
    try {
      const { data } = await axios.delete(`/api/messages/${messageId}`);
      if (data.success) {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        toast.success("Message deleted");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // -----------------------------
  // Socket: unsubscribe from messages
  // -----------------------------
  const unsubscribeFromMessages = () => {
    if (socket) socket.off("newMessage");
  };

  // -----------------------------
  // Socket: subscribe to messages
  // -----------------------------
  const subscribeToMessages = () => {
    if (!socket) return () => {};

    unsubscribeFromMessages();

    socket.on("newMessage", async (newMessage) => {
      // If message belongs to current chat
      if (
        selectedUser &&
        (newMessage.senderId === selectedUser._id ||
          newMessage.receiverId === selectedUser._id)
      ) {
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);

        // Mark as seen in backend
        try {
          await axios.put(`/api/messages/mark/${newMessage._id}`);
        } catch (err) {
          console.error("Error marking message seen:", err);
        }
      } else {
        // Increment unseen count
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: prev[newMessage.senderId]
            ? prev[newMessage.senderId] + 1
            : 1,
        }));
      }
    });

    return () => unsubscribeFromMessages();
  };

  // -----------------------------
  // Reset unseen count when switching users
  // -----------------------------
  useEffect(() => {
    if (selectedUser) {
      setUnseenMessages((prev) => {
        const updated = { ...prev };
        delete updated[selectedUser._id];
        return updated;
      });
    }
  }, [selectedUser]);

  // -----------------------------
  // Subscribe to socket messages
  // -----------------------------
  useEffect(() => {
    const unsubscribe = subscribeToMessages();
    return unsubscribe;
  }, [socket, selectedUser]);

  // -----------------------------
  // Context value
  // -----------------------------
  const value = {
    messages,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    getUsers,
    getMessages,
    sendMessage,
    deleteMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
