import StatCard from "../components/Cards/StatCard";
import DashData from "../../dummies/dash.data";
import NetworthCard from "../components/Dashboard/NetWorthCard";
import MonthlyBurnCard from "../components/Dashboard/MonthlyBurnCard";
import { AccountsCard, BudgetOverviewCard, GoalsCard } from "../components/Dashboard";

const Dashboard = () => {
    return (
        <div className="p-4 max-w-7xl mx-auto">
            {/* Page Title */}
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
            
            {/* Top Row: NetWorth & MonthlyBurn - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <NetworthCard data={DashData.netWorth} />
                <MonthlyBurnCard data={DashData.monthlyBurn} />
            </div>
            
            {/* Middle Row: Accounts - Full width */}
            <div className="mb-6">
                <AccountsCard data={DashData.accounts} />
            </div>
            
            {/* Bottom Row: BudgetOverview & Goals - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BudgetOverviewCard data={DashData.budgetHealth} />
                <GoalsCard data={DashData.goalsProgress} />
            </div>
        </div>
    )
}

export default Dashboard;

