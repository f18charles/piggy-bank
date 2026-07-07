import StatCard from "../components/Cards/StatCard";

const Dashboard = () => {
    return (
        <>
            <p>Dashboard</p>
            <div className="flex gap-5">
            <StatCard label="Net Balance" value="KES 42,500" />
            <StatCard label="This Month's Spending" value="KES 8,200" />
            </div>
        </>
    )
}

export default Dashboard;