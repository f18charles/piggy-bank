import { NavLink } from "react-router-dom";

const Sidebar = () => {
    const navItems = [
        {label: "Dashboard", path: "/"},
    ]

    return (
        <>
            {navItems.map((item) => (
                <NavLink key={item.path} to={item.path} className={({isActive}) => isActive ? "bg-slate-700 text-white" : "text-slate-300" }>
                    {item.label}
                </NavLink>
            ))}       
        </>
    )
}

export default Sidebar;