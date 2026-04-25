import { useContext, useMemo } from "react";
import { ChatContext } from "../context/ChatContext.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import assets from "../assets/assets.js";

const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);

  const sharedMedia = useMemo(
    () => messages.filter((m) => m.image).map((m) => m.image),
    [messages]
  );

  if (!selectedUser) return null;

  return (
    <div className="bg-black/20 h-full p-5 overflow-y-auto text-white max-md:hidden flex flex-col">
      <div className="flex flex-col items-center gap-2">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          className="w-20 h-20 rounded-full object-cover ring-2 ring-violet-400/40"
          alt=""
        />
        <h3 className="text-lg flex items-center gap-2">
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 bg-green-500 rounded-full" />
          )}
          {selectedUser.fullName}
        </h3>
        <p className="text-sm text-gray-300 text-center">{selectedUser.bio}</p>
      </div>

      <hr className="border-white/10 my-4" />

      <div className="flex-1 min-h-0">
        <p className="text-sm text-gray-300 mb-2">Media</p>
        <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
          {sharedMedia.length === 0 && (
            <p className="text-xs text-gray-500 col-span-2">No shared media yet</p>
          )}
          {sharedMedia.map((url, idx) => (
            <img
              key={idx}
              src={url}
              onClick={() => window.open(url)}
              className="rounded cursor-pointer w-full h-20 object-cover hover:opacity-80 transition"
              alt=""
            />
          ))}
        </div>
      </div>

      <button
        onClick={logout}
        className="mt-6 w-full py-2 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 text-sm font-medium hover:opacity-90 transition"
      >
        Logout
      </button>
    </div>
  );
};

export default RightSidebar;
