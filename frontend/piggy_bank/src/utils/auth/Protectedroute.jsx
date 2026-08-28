import { Navigate, Outlet } from "react-router-dom";
import useAuth from "./Useauth";

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/welcome" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;