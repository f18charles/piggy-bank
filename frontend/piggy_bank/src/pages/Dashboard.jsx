import StatCard from "../components/Cards/StatCard";
import DashData from "../../dummies/dash.data";
import NetworthCard from "../components/Dashboard/NetWorthCard";
import MonthlyBurnCard from "../components/Dashboard/MonthlyBurnCard";
import { AccountsCard, BudgetOverviewCard } from "../components/Dashboard";

const Dashboard = () => {
    return (
        <>
            <p>Dashboard</p>
            {/* <div className="flex flex-row gap-2"></div> */}
            <div className="flex gap-5">
                <NetworthCard data={DashData.netWorth} />
                <MonthlyBurnCard data={DashData.monthlyBurn} />
            </div>
            <div className="flex flex-row gap-3 mt-3">
                <AccountsCard data={DashData.accounts} />
                <BudgetOverviewCard data={DashData.budgetHealth} />
            </div>
        </>
    )
}

export default Dashboard;

