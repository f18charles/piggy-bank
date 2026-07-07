import StatCard from "../components/Cards/StatCard";
import DashData from "../../dummies/dash.data";
import NetworthCard from "../components/Dashboard/NetWorthCard";

const Dashboard = () => {
    return (
        <>
            <p>Dashboard</p>
            <div className="flex gap-5">
                <NetworthCard data={DashData.netWorth} />
            </div>
        </>
    )
}

export default Dashboard;

