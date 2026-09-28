import NetworthCard from "../components/Dashboard/NetWorthCard";
import MonthlyBurnCard from "../components/Dashboard/MonthlyBurnCard";
import IncomeExpenseChart from "../components/Dashboard/IncomeExpenseChart";
import NetWorthTrendChart from "../components/Dashboard/NetWorthTrendChart";
import { AccountsCard, BudgetOverviewCard, GoalsCard } from "../components/Dashboard";
import { apiGet } from "../utils/Client";
import { useEffect, useState } from "react";

const Dashboard = () => {
    const [overview, setOverview] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let ignore = false;

        const loadOverview = async () => {
            try {
                // Overview endpoint removed (insights feature pending);
                // fall back to empty state for new accounts.
                const data = await apiGet("/insights/overview")
                if (!ignore) setOverview(data)
            } catch {
                // Expected when insights feature is not yet wired;
                // continue with empty overview so dashboard still renders.
                if (!ignore) setOverview(null)
            }
            if (!ignore) setLoading(false)
        }

        loadOverview()

        return () => {
            ignore = true
        }
    }, [])

    if (loading) {
        return <div className="p-3 sm:p-4 max-w-7xl mx-auto">
           <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        </div>
    }

    // If no overview data (new account or insights not wired),
    // show a friendly start state instead of breaking.
    if (!overview) {
        return (
            <div className="p-3 sm:p-4 max-w-7xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-xl font-medium text-gray-600 mb-2">Welcome to your dashboard</h2>
                    <p className="text-gray-500">
                        Set up your accounts and transactions to see your financial overview here.
                    </p>
                    <button
                        onClick={() => window.location.href = "/accounts"}
                        className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition-colors"
                    >
                        Add Your First Account
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-3 sm:p-4 max-w-7xl mx-auto">
            {/* Page Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

            {/* Top Row: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <IncomeExpenseChart />
                <NetWorthTrendChart />
            </div>

            {/* NetWorth & MonthlyBurn - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <NetworthCard data={overview.net_worth} />
                <MonthlyBurnCard data={overview.monthly_burn} />
            </div>

            {/* Accounts - Full width */}
            <div className="mb-6">
                <AccountsCard data={overview.accounts} />
            </div>

            {/* BudgetOverview & Goals - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BudgetOverviewCard data={overview.budget_health} />
                <GoalsCard data={overview.goals_progress} />
            </div>
        </div>
    )
}

export default Dashboard

