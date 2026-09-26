import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../utils/auth/Useauth";
import { useState } from "react";
import brand from "../../assets/piggybank.png";

const Register = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [currency, setCurrency] = useState("KES");
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError(null);
        setIsSubmitting(true);

        try {
            await register(email, password, fullName, currency);
            navigate("/");
        } catch (err) {
            setError(err.message || "Failed to create account");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-emerald-50/40 p-4">
            <div className="w-full max-w-md">
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
                    <p className="text-xs text-gray-500 mt-1">Start tracking your personal finances today</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 space-y-4"
                >
                    <h1 className="text-xl font-bold text-gray-800">
                        Create Your Account
                    </h1>

                    {error && (
                        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200/60 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            placeholder="Jane Doe"
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="jane@example.com"
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="••••••••"
                                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                                Base Currency
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            >
                                <option value="KES">KES (KSh)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 shadow-md shadow-emerald-700/20 hover:shadow-emerald-700/30 transition-all cursor-pointer"
                    >
                        {isSubmitting ? "Creating Account..." : "Create Account"}
                    </button>

                    <div className="text-center pt-2">
                        <p className="text-xs text-gray-500">
                            Already have an account?{" "}
                            <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
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

export default Register;
