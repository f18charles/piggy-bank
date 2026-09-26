import { useState, useEffect } from "react";
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

    useEffect(() => {
        const handleTokensRefreshed = (e) => {
            if (e.detail?.access_token) {
                setAccessToken(e.detail.access_token)
            }
            if (e.detail?.refresh_token) {
                setRefreshToken(e.detail.refresh_token)
            }
        }

        window.addEventListener("auth:tokensRefreshed", handleTokensRefreshed)
        return () => window.removeEventListener("auth:tokensRefreshed", handleTokensRefreshed)
    }, [])

    const persistSession = ({ access_token, refresh_token, user }) => {
        if (access_token) localStorage.setItem("accessToken", access_token)
        if (refresh_token) localStorage.setItem("refreshToken", refresh_token)
        if (user) localStorage.setItem("user", JSON.stringify(user))

        if (access_token) setAccessToken(access_token)
        if (refresh_token) setRefreshToken(refresh_token)
        if (user) setUser(user)
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

    const register = async (email, password, fullName, currency = "KES") => {
        const data = await apiPost("/auth/register", {
            email,
            password,
            full_name: fullName,
            currency
        }, { auth: false })
        persistSession(data)
        return data.user
    }

    const logout = async () => {
        try {
            const currentRefreshToken = refreshToken || localStorage.getItem("refreshToken")
            await apiPost("/auth/logout", { refresh_token: currentRefreshToken })
        } catch {
            // Ignore errors on logout
        }
        clearSession()
    }

    const value = {
        user,
        accessToken,
        refreshToken,
        isAuthenticated: Boolean(accessToken),
        login,
        register,
        logout,
    }
    
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider;