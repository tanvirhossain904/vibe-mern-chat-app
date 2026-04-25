import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { ChatContext } from "../context/ChatContext.jsx";
import assets from "../assets/assets.js";

const SidebarSkeleton = () => (
  <div className="mt-4 flex flex-col gap-2">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3 bg-white/10 rounded w-3/4" />
          <div className="h-2 bg-white/5 rounded w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout, onlineUsers, authUser } = useContext(AuthContext);
  const {
    users,
    selectedUser,
    setSelectedUser,
    getUsers,
    isLoadingUsers,
    unseenMessages,
    setUnseenMessages,
  } = useContext(ChatContext);

  const [input, setInput] = useState("");

  const filteredUsers = input
    ? users.filter((u) => u.fullName.toLowerCase().includes(input.toLowerCase()))
    : users;

  useEffect(() => {
    if (authUser) getUsers();
  }, [authUser]);

  return (
    <div
      className={`bg-black/20 h-full p-5 overflow-y-auto text-white ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <img src={assets.logo_icon} alt="" className="h-7 w-7" />
          <span className="text-lg font-medium tracking-tight">Vibe</span>
        </div>
        <div className="relative group py-2">
          <img src={assets.menu_icon} alt="menu" className="w-5 cursor-pointer opacity-80" />
          <div className="absolute right-0 top-full hidden group-hover:flex flex-col bg-[#282142] rounded p-3 text-sm gap-2 z-10 min-w-[140px] border border-white/10 shadow-lg">
            <button onClick={() => navigate("/profile")} className="text-left hover:text-violet-300">
              Edit Profile
            </button>
            <hr className="border-white/10" />
            <button onClick={logout} className="text-left hover:text-violet-300">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-full flex items-center gap-2 px-4 py-2 mt-2">
        <img src={assets.search_icon} alt="search" className="w-3 opacity-70" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search user..."
          className="bg-transparent flex-1 outline-none text-xs placeholder:text-white/40"
        />
      </div>

      {isLoadingUsers && users.length === 0 ? (
        <SidebarSkeleton />
      ) : (
        <div className="mt-4 flex flex-col gap-1">
          {filteredUsers.length === 0 && (
            <p className="text-xs text-gray-400 mt-4 text-center">No users found</p>
          )}
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
              }}
              className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/5 transition ${
                selectedUser?._id === user._id ? "bg-white/10" : ""
              }`}
            >
              <div className="relative">
                <img
                  src={user.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                {onlineUsers.includes(user._id) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1f1b3a]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{user.fullName}</p>
                <p className={`text-xs ${onlineUsers.includes(user._id) ? "text-green-400" : "text-gray-400"}`}>
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </p>
              </div>
              {unseenMessages[user._id] > 0 && (
                <span className="text-xs bg-violet-500 rounded-full px-2 py-0.5 min-w-[22px] text-center">
                  {unseenMessages[user._id]}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
