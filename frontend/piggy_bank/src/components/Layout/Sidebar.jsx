import { MdOutlineDashboard, MdAccountBalance, MdReceipt, MdAttachMoney, MdTrendingUp } from "react-icons/md";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
    const navItems = [
        { label: "Dashboard", path: "/", icon: MdOutlineDashboard },
        { label: "Accounts", path: "/accounts", icon: MdAccountBalance },
        { label: "Budget", path: "/budget", icon: MdReceipt },
        { label: "Goals", path: "/goals", icon: MdTrendingUp },
        { label: "Transactions", path: "/transactions", icon: MdAttachMoney },
    ];

    return (
        <aside className="w-50 bg-gradient-to-b from-emerald-900 to-emerald-800 shadow-lg">
            <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                                transition-all duration-200
                                ${isActive 
                                    ? "bg-emerald-700/50 text-white shadow-lg shadow-emerald-900/30 border border-emerald-600/50" 
                                    : "text-emerald-200/70 hover:text-white hover:bg-emerald-800/50 hover:border hover:border-emerald-700/30"
                                }
                            `}
                        >
                            <span className="text-xl">{Icon && <Icon />}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${({ isActive }) => isActive ? 'bg-emerald-400' : 'bg-emerald-600'}`}></span>
                            {item.label}
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;