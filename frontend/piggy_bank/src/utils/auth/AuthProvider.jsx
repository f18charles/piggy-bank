import { useState } from "react";
import { apiPost } from "../Client";
import { AuthContext } from "./Authcontextobject";

const readStoredUser = () => {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken"))
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("refreshToken"))
    const [user, setUser] = useState(readStoredUser)

    const persistSession = ({accessToken, refreshToken, user}) => {
        localStorage.setItem("accessToken", accessToken)
        localStorage.setItem("refreshToken", refreshToken)
        localStorage.setItem("user", JSON.stringify(user))

        setAccessToken(accessToken)
        setRefreshToken(refreshToken)
        setUser(user)
    }

    const clearSession = () => {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("user")

        setAccessToken(null)
        setRefreshToken(null)
        setUser(null)
    }

    const login = async (email, password) => {
        const data = await apiPost("/auth/login", { email, password }, { auth: false })
        persistSession(data)
        return data.user
    }

    const logout = async () => {
        try {
            await apiPost("/auth/logout")
        } catch {

        }
        clearSession()
    }

    const value = {
        user,
        accessToken,
        refreshToken,
        isAuthenticated: Boolean(accessToken),
        login,
        logout,
    }
    
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider;