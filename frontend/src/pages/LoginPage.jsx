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
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
            <HiOutlineShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">RateGuard</h1>
            <p className="text-[11px] text-dark-400 uppercase tracking-widest">
              API Rate Limiter
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass rounded-3xl border border-white/10 p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white text-center mb-1">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-xs text-dark-400 text-center mb-6">
            {isRegister
              ? "Sign up to access the dashboard"
              : "Sign in to your dashboard"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs text-dark-400 mb-1.5 font-medium">
                  Username
                </label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Enter username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-accent-cyan/40 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-dark-400 mb-1.5 font-medium">
                Email
              </label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-accent-cyan/40 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-dark-400 mb-1.5 font-medium">
                Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-700 border border-white/10 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-accent-cyan/40 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
            >
              {loading
                ? "Please wait..."
                : isRegister
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setForm({ username: "", email: "", password: "" });
              }}
              className="text-xs text-dark-400 hover:text-accent-cyan transition-colors cursor-pointer"
            >
              {isRegister
                ? "Already have an account? Sign in"
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        {/* Skip Auth (Demo Mode) */}
        <div className="mt-4 text-center">
          <button
            onClick={() =>
              onAuth({
                token: null,
                user: { username: "Admin", email: "admin@rateguard.app" },
              })
            }
            className="text-xs text-dark-500 hover:text-dark-300 transition-colors cursor-pointer"
          >
            Skip login (demo mode) →
          </button>
        </div>
      </div>
    </div>
  );
}
