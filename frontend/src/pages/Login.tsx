import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Globe2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleName, setRoleName] = useState("ADMIN");

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      const origin = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";
      navigate(origin, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login({ email: email.trim(), password });
      } else {
        await register({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          role_name: roleName,
        });
      }

      const redirectPath = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      let msg = "Authentication failed. Please verify your credentials.";

      if (typeof detail === "string") {
        msg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        msg = detail
          .map((item: any) => {
            if (typeof item === "string") return item;
            const field = item.loc ? item.loc[item.loc.length - 1] : "";
            const message = item.msg || "Invalid value";
            return field ? `${field}: ${message}` : message;
          })
          .join(". ");
      } else if (err.message && typeof err.message === "string") {
        msg = err.message;
      }

      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail("admin@connectai.org");
    setPassword("admin123");
    setErrorMessage(null);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting effects */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-sky-500/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-indigo-400 text-xs font-semibold tracking-wide uppercase shadow-inner mb-4">
            <Globe2 className="w-3.5 h-3.5 animate-spin-slow text-indigo-400" />
            ConnectAI Multilingual Engine
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === "login"
              ? "Sign in to manage AI campaigns, translations, and multi-channel delivery."
              : "Register to orchestrate multilingual public communications."}
          </p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl bg-slate-900/70 border border-slate-800/80 shadow-2xl shadow-indigo-950/40 rounded-2xl p-6 sm:p-8">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "login"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "register"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Register
            </button>
          </div>

          {/* Quick Demo Helper */}
          {mode === "login" && (
            <div className="mb-6 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Demo: <strong className="text-white">admin@connectai.org</strong></span>
              </div>
              <button
                type="button"
                onClick={handleFillDemoAdmin}
                className="px-2.5 py-1 font-medium bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 rounded-md transition-colors"
              >
                Auto-fill
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Role</label>
                  <select
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="ADMIN">Administrator (Full Access)</option>
                    <option value="CAMPAIGN_MANAGER">Campaign Manager</option>
                    <option value="COMMUNICATION_TEAM">Communication Team</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@connectai.org"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In to Dashboard" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security footnote */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center gap-2 text-slate-500 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Secured with JWT & Role-Based Access Control</span>
          </div>
        </div>
      </div>
    </div>
  );
}
