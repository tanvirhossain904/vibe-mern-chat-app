import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./AuthContext.jsx";
import toast from "react-hot-toast";

export const ChatContext = createContext();

const PAGE_SIZE = 50;

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [typingUserIds, setTypingUserIds] = useState({});

  const { socket, axios, authUser } = useContext(AuthContext);
  const selectedUserRef = useRef(null);
  selectedUserRef.current = selectedUser;

  const getUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const getMessages = async (userId) => {
    setIsLoadingMessages(true);
    try {
      const { data } = await axios.get(`/api/messages/${userId}?limit=${PAGE_SIZE}`);
      if (data.success) {
        setMessages(data.messages);
        setHasMore(Boolean(data.hasMore));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!selectedUser || isLoadingMore || !hasMore || messages.length === 0) return;
    setIsLoadingMore(true);
    try {
      const oldest = messages[0].createdAt;
      const { data } = await axios.get(
        `/api/messages/${selectedUser._id}?limit=${PAGE_SIZE}&before=${encodeURIComponent(oldest)}`
      );
      if (data.success) {
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMore(Boolean(data.hasMore));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load history");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const sendMessage = async (messageData) => {
    if (!selectedUser) return;
    try {
      const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
      if (data.success) {
        setMessages((prev) => [...prev, data.newMessage]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    }
  };

  const editMessage = async (id, text) => {
    try {
      const { data } = await axios.put(`/api/messages/${id}`, { text });
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === id ? { ...m, text: data.message.text, editedAt: data.message.editedAt } : m
          )
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to edit message");
    }
  };

  const deleteMessage = async (id) => {
    try {
      const { data } = await axios.delete(`/api/messages/${id}`);
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === id ? { ...m, deleted: true, text: undefined, image: undefined } : m))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete message");
    }
  };

  const emitTyping = (start) => {
    if (!socket || !selectedUser) return;
    socket.emit(start ? "typing:start" : "typing:stop", { to: selectedUser._id });
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const current = selectedUserRef.current;
      if (current && newMessage.senderId === current._id) {
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`).catch(() => {});
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    };

    const handleEdited = ({ _id, text, editedAt }) => {
      setMessages((prev) => prev.map((m) => (m._id === _id ? { ...m, text, editedAt } : m)));
    };

    const handleDeleted = ({ _id }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === _id ? { ...m, deleted: true, text: undefined, image: undefined } : m))
      );
    };

    const handleSeen = ({ byUserId }) => {
      const current = selectedUserRef.current;
      if (!current || current._id !== byUserId) return;
      setMessages((prev) => prev.map((m) => (m.seen ? m : { ...m, seen: true })));
    };

    const handleTypingStart = ({ from }) => {
      setTypingUserIds((prev) => ({ ...prev, [from]: true }));
    };

    const handleTypingStop = ({ from }) => {
      setTypingUserIds((prev) => {
        const { [from]: _drop, ...rest } = prev;
        return rest;
      });
    };

    const handleReconnect = () => {
      if (authUser) getUsers();
      if (selectedUserRef.current) getMessages(selectedUserRef.current._id);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageEdited", handleEdited);
    socket.on("messageDeleted", handleDeleted);
    socket.on("messagesSeen", handleSeen);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.io.on("reconnect", handleReconnect);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageEdited", handleEdited);
      socket.off("messageDeleted", handleDeleted);
      socket.off("messagesSeen", handleSeen);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.io.off("reconnect", handleReconnect);
    };
  }, [socket, authUser]);

  const value = {
    messages,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    isLoadingUsers,
    isLoadingMessages,
    isLoadingMore,
    hasMore,
    typingUserIds,
    getUsers,
    getMessages,
    loadOlderMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    emitTyping,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
