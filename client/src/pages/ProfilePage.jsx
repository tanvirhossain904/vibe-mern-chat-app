import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import assets from "../assets/assets.js";

const ProfilePage = () => {
  const { authUser, updateProfile, deleteAccount } = useContext(AuthContext);
  const [selectedImage, setSelectedImage] = useState(null);
  const [name, setName] = useState(authUser?.fullName || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      await updateProfile({ fullName: name, bio });
      navigate("/");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(selectedImage);
    reader.onload = async () => {
      await updateProfile({ profilePic: reader.result, fullName: name, bio });
      navigate("/");
    };
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    await deleteAccount();
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 bg-cover bg-center"
      style={{ backgroundImage: `url(${assets.bgImage})` }}
    >
      <div className="w-full max-w-lg flex flex-col gap-6">
        <form
          onSubmit={handleSubmit}
          className="p-8 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex flex-col gap-5 shadow-2xl"
        >
          <h2 className="text-2xl">Profile</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="file"
              accept=".png, .jpg, .jpeg"
              hidden
              onChange={(e) => setSelectedImage(e.target.files[0])}
            />
            <img
              src={
                selectedImage
                  ? URL.createObjectURL(selectedImage)
                  : authUser?.profilePic || assets.avatar_icon
              }
              alt=""
              className="w-16 h-16 rounded-full object-cover ring-2 ring-violet-400/40"
            />
            <span className="text-sm text-gray-300">Upload profile image</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="p-3 rounded bg-transparent border border-white/20 outline-none focus:border-violet-400"
            required
          />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Write your bio"
            className="p-3 rounded bg-transparent border border-white/20 outline-none focus:border-violet-400"
            required
          />
          <button
            type="submit"
            className="py-3 rounded bg-gradient-to-r from-purple-500 to-violet-600 font-medium hover:opacity-90 transition"
          >
            Save
          </button>
        </form>

        <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5">
          <h3 className="text-lg text-red-300 mb-2">Danger zone</h3>
          {!confirmingDelete ? (
            <>
              <p className="text-sm text-gray-300 mb-3">
                Permanently delete your account and all your messages. This cannot be undone.
              </p>
              <button
                onClick={() => setConfirmingDelete(true)}
                className="px-4 py-2 rounded text-sm bg-red-500/30 hover:bg-red-500/50 transition border border-red-500/40"
              >
                Delete my account
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-300">
                Type <strong>DELETE</strong> to confirm. Your messages with other users will also be removed.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="p-2 rounded bg-transparent border border-red-500/40 outline-none text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== "DELETE"}
                  className="px-4 py-2 rounded text-sm bg-red-500 hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Permanently delete
                </button>
                <button
                  onClick={() => {
                    setConfirmingDelete(false);
                    setConfirmText("");
                  }}
                  className="px-4 py-2 rounded text-sm bg-white/5 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
