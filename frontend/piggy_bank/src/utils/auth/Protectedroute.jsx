import { Navigate, Outlet } from "react-router-dom";
import useAuth from "./Useauth";

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}

export default ProtectedRoute;