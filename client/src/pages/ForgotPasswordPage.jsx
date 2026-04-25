import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext.jsx";
import assets from "../assets/assets.js";

const ForgotPasswordPage = () => {
  const { axios } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await axios.post("/api/auth/forgot-password", { email });
      if (data.success) setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Request failed");
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
        <h2 className="text-2xl font-medium">Forgot password</h2>
        {submitted ? (
          <p className="text-sm text-gray-300">
            If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            It expires in 1 hour.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-400">
              Enter your email and we'll send you a reset link.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="p-3 rounded bg-transparent border border-white/20 outline-none focus:border-violet-400"
            />
            <button
              type="submit"
              disabled={busy}
              className="py-3 rounded bg-gradient-to-r from-purple-500 to-violet-600 font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {busy ? "Sending…" : "Send reset link"}
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

export default ForgotPasswordPage;
