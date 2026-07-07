import { NavLink } from "react-router-dom";

const Sidebar = () => {
    return (
        <>
            <NavLink to="/" className={({isActive}) => isActive ? "bg-slate-700 text-white" : "text-slate-300" }>
                Dashboard
            </NavLink>
        </>
    )
}

export default Sidebar;