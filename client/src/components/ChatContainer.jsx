import { useContext, useEffect, useRef, useState } from "react";
import { ChatContext } from "../context/ChatContext.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { formatMessageTime } from "../lib/utils.js";
import assets from "../assets/assets.js";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } =
    useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollRef = useRef();
  const fileInputRef = useRef();
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    await sendMessage({ text });
    scrollToBottom();
  };

  const handleSendImage = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setIsUploading(true);
      try {
        await sendMessage({ image: reader.result });
        scrollToBottom();
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id);
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
        <p className="flex-1 flex items-center gap-2">
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 bg-green-500 rounded-full" />
          )}
        </p>
        <img
          src={assets.arrow_icon}
          alt="back"
          onClick={() => setSelectedUser(null)}
          className="w-5 cursor-pointer rotate-180 invert opacity-80 md:hidden"
        />
        <img src={assets.help_icon} alt="" className="w-5 opacity-60 max-md:hidden" />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3"
      >
        {messages.map((msg) => {
          const mine = msg.senderId === authUser._id;
          return (
            <div
              key={msg._id}
              className={`flex flex-col max-w-[70%] ${mine ? "self-end items-end" : "self-start items-start"}`}
            >
              {msg.image ? (
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
              <span className="text-xs text-gray-400 mt-1">
                {formatMessageTime(msg.createdAt)}
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

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-3 p-3 border-t border-white/10 bg-black/20"
      >
        <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-full px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message"
            disabled={isUploading}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/40 disabled:opacity-50"
          />
          <label
            className={`cursor-pointer ${isUploading ? "opacity-40 pointer-events-none" : ""}`}
          >
            <input
              ref={fileInputRef}
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
