import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import assets from "../assets/assets.js";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const [selectedImage, setSelectedImage] = useState(null);
  const [name, setName] = useState(authUser?.fullName || "");
  const [bio, setBio] = useState(authUser?.bio || "");
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

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${assets.bgImage})` }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg p-8 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex flex-col gap-5 shadow-2xl"
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
    </div>
  );
};

export default ProfilePage;
