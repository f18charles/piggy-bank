import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../utils/auth/Useauth";
import { useState } from "react";
import brand from "../../assets/piggybank.png";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const autoAdd = (e) => {
        e.preventDefault();
        setEmail("demo@email.com");
        setPassword("demo1234");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError(null);
        setIsSubmitting(true);

        try {
            await login(email, password);
            navigate("/");
        } catch (err) {
            setError(err.message || "Failed to log in");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-emerald-50/40 p-4">
            <div className="w-full max-w-sm">
                {/* Brand Header */}
                <div className="text-center mb-6">
                    <Link to="/welcome" className="inline-flex items-center gap-2 group">
                        <img
                            src={brand}
                            alt="PiggyBank Logo"
                            className="w-12 h-12 object-contain group-hover:scale-105 transition-transform"
                        />
                        <span className="text-2xl font-black bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent">
                            PiggyBank
                        </span>
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">Sign in to your personal finance dashboard</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 space-y-4"
                >
                    <h1 className="text-xl font-bold text-gray-800">
                        Welcome Back
                    </h1>

                    {/* Demo Account Credentials Helper */}
                    <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200/60 shadow-xs text-xs flex flex-col gap-2 text-emerald-950">
                        <p className="font-medium text-emerald-900">
                            Demo account credentials:
                        </p>
                        <div className="space-y-0.5 font-mono text-[11px] text-gray-700 bg-white/70 p-2 rounded-lg border border-emerald-100">
                            <p><strong className="text-emerald-800 font-sans">Email:</strong> demo@email.com</p>
                            <p><strong className="text-emerald-800 font-sans">Password:</strong> demo1234</p>
                        </div>
                        <button
                            type="button"
                            onClick={autoAdd}
                            className="mt-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer text-center"
                        >
                            Auto-fill Demo Credentials
                        </button>
                    </div>

                    {error && (
                        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200/60 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="user@example.com"
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 shadow-md shadow-emerald-700/20 hover:shadow-emerald-700/30 transition-all cursor-pointer"
                    >
                        {isSubmitting ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/welcome" className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors">
                        ← Back to Welcome Page
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;