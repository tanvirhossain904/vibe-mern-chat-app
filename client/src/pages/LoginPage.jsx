import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import assets from "../assets/assets.js";

const LoginPage = () => {
  const [currentState, setCurrentState] = useState("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const { login } = useContext(AuthContext);

  const onSubmitHandler = (event) => {
    event.preventDefault();
    if (currentState === "signup" && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }
    login(currentState === "signup" ? "signup" : "login", {
      fullName,
      email,
      password,
      bio,
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center gap-12 px-4 sm:px-16 flex-col sm:flex-row bg-cover bg-center"
      style={{ backgroundImage: `url(${assets.bgImage})` }}
    >
      <div className="flex flex-col items-center gap-3">
        <img src={assets.logo_big} alt="Vibe" className="w-[min(28vw,180px)]" />
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight">Vibe</h1>
      </div>

      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-md p-8 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 flex flex-col gap-5 shadow-2xl"
      >
        <h2 className="text-2xl font-medium flex items-center justify-between">
          {currentState === "signup" ? "Sign Up" : "Login"}
          {isDataSubmitted && (
            <img
              src={assets.arrow_icon}
              alt="back"
              onClick={() => setIsDataSubmitted(false)}
              className="w-5 cursor-pointer rotate-180 invert opacity-80"
            />
          )}
        </h2>

        {currentState === "signup" && !isDataSubmitted && (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            className="p-3 rounded bg-transparent border border-white/20 outline-none focus:border-violet-400"
            required
          />
        )}

        {!isDataSubmitted && (
          <>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
              className="p-3 rounded bg-transparent border border-white/20 outline-none focus:border-violet-400"
              required
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="p-3 rounded bg-transparent border border-white/20 outline-none focus:border-violet-400"
              required
            />
          </>
        )}

        {currentState === "signup" && isDataSubmitted && (
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="A short bio..."
            className="p-3 rounded bg-transparent border border-white/20 outline-none focus:border-violet-400"
            required
          />
        )}

        <button
          type="submit"
          className="py-3 rounded bg-gradient-to-r from-purple-500 to-violet-600 font-medium hover:opacity-90 transition"
        >
          {currentState === "signup" ? "Create Account" : "Login Now"}
        </button>

        <p className="text-sm text-gray-300">
          {currentState === "signup" ? "Already have an account?" : "New here?"}{" "}
          <span
            onClick={() => {
              setCurrentState(currentState === "signup" ? "login" : "signup");
              setIsDataSubmitted(false);
            }}
            className="text-violet-300 cursor-pointer"
          >
            {currentState === "signup" ? "Login" : "Sign up"}
          </span>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
