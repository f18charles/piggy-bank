import NetworthCard from "../components/Dashboard/NetWorthCard";
import MonthlyBurnCard from "../components/Dashboard/MonthlyBurnCard";
import { AccountsCard, BudgetOverviewCard, GoalsCard } from "../components/Dashboard";
import { apiGet } from "../utils/Client";
import { useEffect, useState } from "react";

const Dashboard = () => {
    const [overview, setOverview] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let ignore = false;

        const loadOverview = async () => {
            try {
                const data = await apiGet("/insights/overview")
                if (!ignore) setOverview(data)
            } catch (err) {
                if (!ignore) setError(err.message)
            } finally {
                if (!ignore) setLoading(false)
            }
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

    if (error) {
        return <div className="p-3 sm:p-4 max-w-7xl mx-auto">
            <p className="text-sm text-rose-500">
                Dashboard couldn't load
            </p>
        </div>
    }

    return (
        <div className="p-3 sm:p-4 max-w-7xl mx-auto">
            {/* Page Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            
            {/* Top Row: NetWorth & MonthlyBurn - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <NetworthCard data={overview.net_worth} />
                <MonthlyBurnCard data={overview.monthly_burn} />
            </div>
            
            {/* Middle Row: Accounts - Full width */}
            <div className="mb-6">
                <AccountsCard data={overview.accounts} />
            </div>
            
            {/* Bottom Row: BudgetOverview & Goals - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BudgetOverviewCard data={overview.budget_health} />
                <GoalsCard data={overview.goals_progress} />
            </div>
        </div>
    )
}

export default Dashboard;

