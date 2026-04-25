import { useContext, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext.jsx";
import assets from "../assets/assets.js";

const ResetPasswordPage = () => {
  const { axios } = useContext(AuthContext);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      const { data } = await axios.post("/api/auth/reset-password", { token, password });
      if (data.success) {
        toast.success("Password updated. Please log in.");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${assets.bgImage})` }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md p-8 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex flex-col gap-5 shadow-2xl"
      >
        <h2 className="text-2xl font-medium">Set a new password</h2>
        {!token ? (
          <p className="text-sm text-red-300">This link is missing a token. Request a new one.</p>
        ) : (
          <>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              required
              className="p-3 rounded bg-transparent border border-white/20 outline-none focus:border-violet-400"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              required
              className="p-3 rounded bg-transparent border border-white/20 outline-none focus:border-violet-400"
            />
            <button
              type="submit"
              disabled={busy}
              className="py-3 rounded bg-gradient-to-r from-purple-500 to-violet-600 font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </>
        )}
        <p className="text-sm text-gray-300">
          <Link to="/login" className="text-violet-300">← Back to login</Link>
        </p>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
