import StatCard from "../components/Cards/StatCard";
import DashData from "../../dummies/dash.data";
import NetworthCard from "../components/Dashboard/NetWorthCard";
import MonthlyBurnCard from "../components/Dashboard/MonthlyBurnCard";

const Dashboard = () => {
    return (
        <>
            <p>Dashboard</p>
            <div className="flex gap-5">
                <NetworthCard data={DashData.netWorth} />
                <MonthlyBurnCard data={DashData.monthlyBurn} />
            </div>
        </>
    )
}

export default Dashboard;

