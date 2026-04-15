import { useState, useEffect } from "react";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { login, register } from "../services/api";

/**
 * Login/Register view with JWT authentication.
 * Shows a sleek centered form with toggle between login and register modes.
 */
export default function LoginPage({ onAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isRegister) {
        result = await register(form.username, form.email, form.password);
        toast.success("Account created successfully!");
      } else {
        result = await login(form.email, form.password);
        toast.success("Welcome back!");
      }
      onAuth(result);
    } catch (err) {
      const msg = err.response?.data?.error || "Authentication failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <HiOutlineShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">RateGuard</h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">
              API Rate Limiter
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
          <h2 className="text-xl font-bold text-white text-center mb-1">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-gray-400 text-center mb-6">
            {isRegister
              ? "Sign up to access the dashboard"
              : "Sign in to your dashboard"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">
                  Username
                </label>
                <div className="relative flex items-center">
                  <HiOutlineUser className="absolute left-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Enter username"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-inner"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">
                Email
              </label>
              <div className="relative flex items-center">
                <HiOutlineMail className="absolute left-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">
                Password
              </label>
              <div className="relative flex items-center">
                <HiOutlineLockClosed className="absolute left-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-inner"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] cursor-pointer"
            >
              {loading
                ? "Please wait..."
                : isRegister
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setForm({ username: "", email: "", password: "" });
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              {isRegister
                ? "Already have an account? Sign in"
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        {/* Skip Auth (Demo Mode) */}
        <div className="mt-6 text-center">
          <button
            onClick={() =>
              onAuth({
                token: null,
                user: { username: "Admin", email: "admin@rateguard.app" },
              })
            }
            className="group text-xs font-semibold text-gray-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            Skip login (demo mode) 
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
