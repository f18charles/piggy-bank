import { Link } from "react-router-dom";
import brand from "../assets/piggybank.png";
import useAuth from "../utils/auth/Useauth";
import {
    MdAccountBalance,
    MdReceipt,
    MdTrendingUp,
    MdAttachMoney,
    MdSecurity,
    MdAnalytics,
    MdArrowForward,
    MdCheckCircle
} from "react-icons/md";


const Welcome = () => {
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 text-gray-800 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
            {/* Navigation Bar */}
            <header className="w-full bg-white/80 backdrop-blur-md border-b border-emerald-100/60 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                            <img src={brand} alt="PiggyBank Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 bg-clip-text text-transparent tracking-tight">
                                PiggyBank
                            </span>
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-600 -mt-1 hidden sm:block">
                                Personal Finance
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                        <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a>
                        <a href="#insights" className="hover:text-emerald-600 transition-colors">Insights</a>
                        <a href="#tech" className="hover:text-emerald-600 transition-colors">Architecture</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm font-semibold shadow-md shadow-emerald-700/20 hover:shadow-emerald-700/30 transition-all transform hover:-translate-y-0.5"
                            >
                                <span>Go to Dashboard</span>
                                <MdArrowForward className="w-4 h-4" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm font-semibold shadow-md shadow-emerald-700/20 hover:shadow-emerald-700/30 transition-all transform hover:-translate-y-0.5"
                                >
                                    <span>Get Started</span>
                                    <MdArrowForward className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
                {/* Background decorative blobs */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-gradient-to-tr from-emerald-200/40 via-teal-100/30 to-amber-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs sm:text-sm font-medium mb-6 shadow-xs">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Modern Personal Finance & Wealth Control</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.15]">
                            Smart Money Management,{" "}
                            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 bg-clip-text text-transparent">
                                Total Clarity.
                            </span>
                        </h1>

                        <p className="mt-6 text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
                            Take command of your financial journey. Track multi-currency accounts across M-Pesa, NCBA, and cash, enforce smart category budgets, reach milestone savings goals, and visualize monthly spending habits in real time.
                        </p>

                        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to={isAuthenticated ? "/" : "/login"}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all transform hover:-translate-y-0.5"
                            >
                                <span>{isAuthenticated ? `Welcome back, ${user?.full_name || "User"}` : "Launch Dashboard"}</span>
                                <MdArrowForward className="w-5 h-5" />
                            </Link>
                            <a
                                href="#features"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-semibold text-base border border-gray-200 shadow-sm transition-all"
                            >
                                Explore Features
                            </a>
                        </div>

                        {/* Feature Badges */}
                        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xs p-2.5 rounded-xl border border-gray-100 shadow-xs">
                                <MdCheckCircle className="text-emerald-600 shrink-0 w-5 h-5" />
                                <span className="text-xs font-semibold text-gray-700">Multi-Account Hub</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xs p-2.5 rounded-xl border border-gray-100 shadow-xs">
                                <MdCheckCircle className="text-emerald-600 shrink-0 w-5 h-5" />
                                <span className="text-xs font-semibold text-gray-700">Live Burn Rate Alerts</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xs p-2.5 rounded-xl border border-gray-100 shadow-xs">
                                <MdCheckCircle className="text-emerald-600 shrink-0 w-5 h-5" />
                                <span className="text-xs font-semibold text-gray-700">Goal Milestones</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xs p-2.5 rounded-xl border border-gray-100 shadow-xs">
                                <MdCheckCircle className="text-emerald-600 shrink-0 w-5 h-5" />
                                <span className="text-xs font-semibold text-gray-700">Fast CSV Export</span>
                            </div>
                        </div>
                    </div>

                    {/* App Mockup Preview */}
                    <div className="mt-14 max-w-5xl mx-auto">
                        <div className="rounded-2xl sm:rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-gray-900/5 to-gray-900/10 border border-gray-200/80 shadow-2xl backdrop-blur-sm">
                            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden shadow-inner">
                                {/* Mockup Top Bar */}
                                <div className="bg-gray-50/80 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-400" />
                                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                        <span className="ml-2 text-xs font-medium text-gray-400">PiggyBank Dashboard Preview</span>
                                    </div>
                                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-medium">Live Overview</span>
                                </div>

                                {/* Mockup Content Grid */}
                                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 bg-slate-50/40">
                                    {/* Net Worth Card Mock */}
                                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Net Worth</span>
                                            <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">KES 248,500.00</div>
                                            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                                                <span>↑ 14.8%</span> from last month
                                            </p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                                            <span>3 Active Accounts</span>
                                            <span className="text-emerald-700 font-medium">Healthy</span>
                                        </div>
                                    </div>

                                    {/* Monthly Burn Card Mock */}
                                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Monthly Burn</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">On Track</span>
                                            </div>
                                            <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">KES 42,350.00</div>
                                            <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                                                <div className="bg-emerald-500 h-full rounded-full w-[48%]" />
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                                            <span>Budget: KES 88,000</span>
                                            <span>48.1% spent</span>
                                        </div>
                                    </div>

                                    {/* Goal Card Mock */}
                                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Featured Goal</span>
                                            <div className="font-bold text-gray-800 text-lg mt-1">Emergency Fund</div>
                                            <div className="flex justify-between items-baseline mt-1 text-sm">
                                                <span className="font-bold text-emerald-700">KES 75,000</span>
                                                <span className="text-xs text-gray-400">of KES 100,000</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                                                <div className="bg-gradient-to-r from-teal-500 to-emerald-600 h-full rounded-full w-[75%]" />
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                                            <span>Target: Dec 2026</span>
                                            <span className="text-emerald-700 font-semibold">75% Complete</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Features Grid Section */}
            <section id="features" className="py-16 sm:py-24 bg-white border-t border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-xs sm:text-sm uppercase tracking-widest font-bold text-emerald-600 mb-2">
                            Engineered for Financial Control
                        </h2>
                        <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                            Everything you need to master your money
                        </p>
                        <p className="mt-3 text-gray-600 text-sm sm:text-base">
                            Built with precision to give you immediate insights and total transparency into your accounts, cash flow, and long-term goals.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="group p-6 rounded-2xl bg-slate-50/60 hover:bg-white border border-gray-100 hover:border-emerald-200 shadow-xs hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <MdAccountBalance className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Multi-Account Management</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Seamlessly track balances across NCBA Bank accounts, M-Pesa mobile wallets, and physical cash drawers in one consolidated dashboard.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group p-6 rounded-2xl bg-slate-50/60 hover:bg-white border border-gray-100 hover:border-emerald-200 shadow-xs hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <MdReceipt className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Smart Category Budgets</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Set custom monthly spending limits per category. Visual indicators and burn rate alerts warn you before you exceed your budget threshold.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group p-6 rounded-2xl bg-slate-50/60 hover:bg-white border border-gray-100 hover:border-emerald-200 shadow-xs hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <MdTrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Target Savings Goals</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Define milestones for emergency funds, tech gear, or travel. Make contributions or withdrawals and track progress against scheduled deadlines.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="group p-6 rounded-2xl bg-slate-50/60 hover:bg-white border border-gray-100 hover:border-emerald-200 shadow-xs hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <MdAttachMoney className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Granular Transactions</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Record income, expenses, and inter-account transfers. Filter by date, category, or payment method, and export everything directly to CSV.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="group p-6 rounded-2xl bg-slate-50/60 hover:bg-white border border-gray-100 hover:border-emerald-200 shadow-xs hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <MdAnalytics className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Spending Insights & Burn Rate</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Monthly burn rate calculations, net worth evolution, and category breakdowns give you actionable visibility over where every shilling goes.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="group p-6 rounded-2xl bg-slate-50/60 hover:bg-white border border-gray-100 hover:border-emerald-200 shadow-xs hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <MdSecurity className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Private & Self-Hosted</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Full ownership of your financial records. Runs on a performant Go + PostgreSQL backend with JWT authentication and zero third-party telemetry.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-16 sm:py-24 bg-gradient-to-b from-white to-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-xs sm:text-sm uppercase tracking-widest font-bold text-emerald-600 mb-2">
                            Simple & Streamlined
                        </h2>
                        <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                            Get started in 3 easy steps
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Step 1 */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-lg flex items-center justify-center mb-6 shadow-md shadow-emerald-600/30">
                                1
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Set Up Accounts</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Add your bank accounts, mobile money wallets (M-Pesa), and cash holdings with their starting balances.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-lg flex items-center justify-center mb-6 shadow-md shadow-emerald-600/30">
                                2
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Track & Budget</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Log transactions with custom categories. Establish budget limits and monitor your monthly burn progress.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-lg flex items-center justify-center mb-6 shadow-md shadow-emerald-600/30">
                                3
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Grow Your Savings</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Fund your financial goals, inspect deep spending analytics, and achieve measurable financial freedom.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Architecture / Tech Stack Section */}
            <section id="tech" className="py-16 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center mb-12">
                        <span className="text-emerald-400 text-xs uppercase font-bold tracking-widest">Built for Performance</span>
                        <h2 className="text-3xl font-extrabold mt-2">Modern, Robust Tech Stack</h2>
                        <p className="text-slate-400 text-sm mt-3">
                            A clean layered architecture designed for speed, resilience, and maintainability.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-center">
                        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                            <div className="text-emerald-400 font-bold text-lg mb-1">Go + Gin</div>
                            <div className="text-xs text-slate-400">High-throughput REST API</div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                            <div className="text-emerald-400 font-bold text-lg mb-1">PostgreSQL</div>
                            <div className="text-xs text-slate-400">Reliable transactional storage</div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                            <div className="text-emerald-400 font-bold text-lg mb-1">React + Vite</div>
                            <div className="text-xs text-slate-400">Lightning-fast responsive UI</div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                            <div className="text-emerald-400 font-bold text-lg mb-1">Tailwind CSS</div>
                            <div className="text-xs text-slate-400">Sleek, fluid design system</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call To Action Banner */}
            <section className="py-16 sm:py-20 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        Take Control of Your Personal Finances Today
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-emerald-100 max-w-2xl mx-auto">
                        No complicated spreadsheets or clunky tools. Clear, beautiful, and actionable financial tracking in one place.
                    </p>
                    <div className="mt-8 flex justify-center">
                        <Link
                            to={isAuthenticated ? "/" : "/login"}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white hover:bg-gray-100 text-emerald-900 font-bold text-base shadow-xl shadow-emerald-950/20 transition-all transform hover:-translate-y-0.5"
                        >
                            <span>{isAuthenticated ? "Enter PiggyBank Dashboard" : "Get Started Now"}</span>
                            <MdArrowForward className="w-5 h-5 text-emerald-800" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full bg-white border-t border-gray-200 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <img src={brand} alt="PiggyBank Logo" className="w-6 h-6 object-contain" />
                        <span className="font-semibold text-gray-700">PiggyBank</span>
                        <span>— Self-Hosted Personal Finance Management</span>
                    </div>
                    <div>
                        <span>Built with Go, PostgreSQL, React, and Tailwind CSS.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Welcome;
