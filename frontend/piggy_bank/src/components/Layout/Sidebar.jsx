import { MdOutlineDashboard, MdAccountBalance, MdReceipt, MdAttachMoney, MdTrendingUp, MdClose } from "react-icons/md";
import { NavLink } from "react-router-dom";

const Sidebar = ({ isOpen, onClose }) => {
    const navItems = [
        { label: "Dashboard", path: "/", icon: MdOutlineDashboard },
        { label: "Accounts", path: "/accounts", icon: MdAccountBalance },
        { label: "Budget", path: "/budget", icon: MdReceipt },
        { label: "Goals", path: "/goals", icon: MdTrendingUp },
        { label: "Transactions", path: "/transactions", icon: MdAttachMoney },
    ];

    return (
        <>
            {/* Mobile backdrop - only rendered while the drawer is open */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`
                    fixed md:static top-0 bottom-0 left-0 z-50 md:z-auto
                    w-64 md:w-50 md:shrink-0
                    bg-gradient-to-b from-emerald-900 to-emerald-800 shadow-lg
                    overflow-y-auto
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                `}
            >
                {/* Mobile-only drawer header with close button */}
                <div className="flex items-center justify-between px-4 py-3 md:hidden border-b border-emerald-700/50">
                    <span className="text-white font-semibold text-sm">Menu</span>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-emerald-200/70 hover:text-white hover:bg-emerald-800/50 transition-colors"
                        aria-label="Close menu"
                    >
                        <MdClose className="w-5 h-5" />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
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
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
