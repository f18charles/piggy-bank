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
        e.preventDefault()
        setEmail('demo@email.com')
        setPassword('demo1234')
    }

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <form onSubmit={handleSubmit}
                className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-4"
            >
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Login
                </h1>
                <div className="m-2 bg-emerald-50 p-3 rounded-xl border-1 border-emerald-100/50 shadow-xs text-sm flex flex-col gap-3">
                    <p>There is a demo account already created
                    Login with the following credentials</p>
                    <p><strong className="text-emerald-700">email</strong>: demo@email.com</p>
                    <p><strong className="text-emerald-700">password:</strong> demo1234</p>
                    <button onClick={autoAdd} className="p-1 border-1 bg-emerald-600 text-l text-gray-100 rounded-xl ">Auto add details</button>
                </div>
                {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
                <div className="">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 space-y-4"
                >
                    <h1 className="text-xl font-bold text-gray-800">
                        Welcome Back
                    </h1>
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