import { useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { ChatContext } from "../context/ChatContext.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { formatMessageTime } from "../lib/utils.js";
import assets from "../assets/assets.js";
import toast from "react-hot-toast";

const EDIT_WINDOW_MS = 5 * 60 * 1000;

const MessagesSkeleton = () => (
  <div className="flex-1 min-h-0 p-4 flex flex-col gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className={`max-w-[60%] h-8 rounded-lg bg-white/10 animate-pulse ${
          i % 2 === 0 ? "self-start" : "self-end"
        }`}
      />
    ))}
  </div>
);

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    loadOlderMessages,
    isLoadingMessages,
    isLoadingMore,
    hasMore,
    typingUserIds,
    editMessage,
    deleteMessage,
    emitTyping,
  } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollRef = useRef();
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const isOtherTyping = selectedUser && typingUserIds[selectedUser._id];

  const lastSeenOwnMsgId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.senderId === authUser._id && m.seen && !m.deleted) return m._id;
    }
    return null;
  }, [messages, authUser._id]);

  const isNearBottom = () => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const scrollToBottom = (smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  const stopTyping = () => {
    if (isTypingRef.current) {
      emitTyping(false);
      isTypingRef.current = false;
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!selectedUser) return;
    if (e.target.value.length === 0) {
      stopTyping();
      return;
    }
    if (!isTypingRef.current) {
      emitTyping(true);
      isTypingRef.current = true;
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    stopTyping();
    await sendMessage({ text });
    scrollToBottom();
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }

    setIsUploading(true);
    try {
      const sigRes = await axios.get("/api/uploads/signature");
      const { signature, timestamp, folder, cloudName, apiKey } = sigRes.data;

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", timestamp);
      form.append("signature", signature);
      form.append("folder", folder);

      const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
      if (!upRes.ok) throw new Error("Cloudinary upload failed");
      const upJson = await upRes.json();

      await sendMessage({ imageUrl: upJson.secure_url });
      scrollToBottom();
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop < 60 && hasMore && !isLoadingMore) {
      const el = e.target;
      const prevHeight = el.scrollHeight;
      loadOlderMessages().then(() => {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight - prevHeight;
        });
      });
    }
  };

  const startEdit = (msg) => {
    setEditingId(msg._id);
    setEditingText(msg.text || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async () => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    await editMessage(editingId, trimmed);
    cancelEdit();
  };

  const confirmDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    await deleteMessage(id);
  };

  const canEdit = (msg) =>
    msg.senderId === authUser._id &&
    !msg.deleted &&
    !msg.image &&
    Date.now() - new Date(msg.createdAt).getTime() < EDIT_WINDOW_MS;

  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id);
    return () => stopTyping();
  }, [selectedUser]);

  useEffect(() => {
    if (isNearBottom()) scrollToBottom(false);
  }, [messages, selectedUser]);

  if (!selectedUser) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-3 max-md:hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${assets.bgImage})` }}
      >
        <img src={assets.logo_icon} alt="" className="w-16 opacity-80" />
        <p className="text-lg">Chat anytime, anywhere</p>
      </div>
    );
  }

  return (
    <div
      className="h-full min-h-0 flex flex-col backdrop-blur-lg bg-cover bg-center"
      style={{ backgroundImage: `url(${assets.bgImage})` }}
    >
      <div className="flex items-center gap-3 p-3 border-b border-white/10 bg-black/20">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          className="w-10 h-10 rounded-full object-cover"
          alt=""
        />
        <div className="flex-1 min-w-0">
          <p className="flex items-center gap-2">
            {selectedUser.fullName}
            {onlineUsers.includes(selectedUser._id) && (
              <span className="w-2 h-2 bg-green-500 rounded-full" />
            )}
          </p>
          {isOtherTyping && (
            <p className="text-xs text-violet-300 flex items-center gap-1">
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 bg-violet-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 bg-violet-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 bg-violet-300 rounded-full animate-bounce" />
              </span>
              typing…
            </p>
          )}
        </div>
        <img
          src={assets.arrow_icon}
          alt="back"
          onClick={() => setSelectedUser(null)}
          className="w-5 cursor-pointer rotate-180 invert opacity-80 md:hidden"
        />
        <img src={assets.help_icon} alt="" className="w-5 opacity-60 max-md:hidden" />
      </div>

      {isLoadingMessages && messages.length === 0 ? (
        <MessagesSkeleton />
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3"
        >
          {isLoadingMore && (
            <div className="self-center text-xs text-gray-400 flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Loading older messages…
            </div>
          )}
          {messages.map((msg) => {
            const mine = msg.senderId === authUser._id;
            const isEditing = editingId === msg._id;
            return (
              <div
                key={msg._id}
                className={`group flex flex-col max-w-[70%] ${mine ? "self-end items-end" : "self-start items-start"}`}
              >
                <div className={`flex items-center gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  {msg.deleted ? (
                    <p className="p-2 px-3 rounded-lg text-sm italic text-gray-400 bg-white/5 border border-white/10">
                      message deleted
                    </p>
                  ) : isEditing ? (
                    <div className="flex flex-col gap-1">
                      <input
                        autoFocus
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="p-2 px-3 rounded-lg text-sm bg-violet-500/30 outline-none border border-violet-300/40 text-white"
                      />
                      <div className="flex gap-2 text-xs text-gray-300">
                        <button onClick={saveEdit} className="text-violet-300 hover:text-violet-200">save</button>
                        <button onClick={cancelEdit} className="hover:text-white">cancel</button>
                        <span className="text-gray-500">esc to cancel · enter to save</span>
                      </div>
                    </div>
                  ) : msg.image ? (
                    <img src={msg.image} className="rounded-lg max-w-xs border border-white/10" alt="" />
                  ) : (
                    <p
                      className={`p-2 px-3 rounded-lg text-sm break-words ${
                        mine
                          ? "bg-violet-500/40 rounded-br-none"
                          : "bg-white/10 rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                    </p>
                  )}

                  {mine && !isEditing && !msg.deleted && (
                    <div className="opacity-0 group-hover:opacity-100 transition flex gap-1 text-xs text-gray-300">
                      {canEdit(msg) && (
                        <button
                          onClick={() => startEdit(msg)}
                          className="hover:text-violet-300"
                          title="Edit"
                        >
                          ✎
                        </button>
                      )}
                      <button
                        onClick={() => confirmDelete(msg._id)}
                        className="hover:text-red-400"
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  {formatMessageTime(msg.createdAt)}
                  {msg.editedAt && !msg.deleted && <span className="italic">(edited)</span>}
                  {mine && msg._id === lastSeenOwnMsgId && (
                    <span className="text-violet-300">· Seen</span>
                  )}
                </span>
              </div>
            );
          })}
          {isUploading && (
            <div className="self-end max-w-[70%] flex items-center gap-2 p-2 px-3 rounded-lg bg-violet-500/20 text-sm text-gray-300">
              <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Uploading image…
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-3 p-3 border-t border-white/10 bg-black/20"
      >
        <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-full px-4 py-2">
          <input
            value={input}
            onChange={handleInputChange}
            onBlur={stopTyping}
            placeholder="Send a message"
            disabled={isUploading}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/40 disabled:opacity-50"
          />
          <label
            className={`cursor-pointer ${isUploading ? "opacity-40 pointer-events-none" : ""}`}
          >
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleSendImage}
              disabled={isUploading}
            />
            <img src={assets.gallery_icon} alt="image" className="w-5 opacity-80" />
          </label>
        </div>
        <button type="submit" disabled={isUploading} className="disabled:opacity-50">
          <img src={assets.send_button} alt="send" className="w-7" />
        </button>
      </form>
    </div>
  );
};

export default ChatContainer;
