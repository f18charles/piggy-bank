const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1"

const getAccessToken = () => {
    return localStorage.getItem("accessToken")
}

const getRefreshToken = () => {
    return localStorage.getItem("refreshToken")
}

const clearStoredSession = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
}

const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
        throw new Error("No refresh token available")
    }

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {"Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken })
    })

    const json = await res.json().catch(() => null)

    if (!res.ok) {
        throw new Error("Failed to refresh access token")
    }

    localStorage.setItem("accessToken", json.data.access_token)
    localStorage.setItem("refreshToken", json.data.refresh_token)
}

const request = async (path, { method = "GET", body, auth = true } = {}) => {
    const headers = { "Content-Type": "application/json" }

    if (auth) {
        const token = getAccessToken()
        if (token) {
            headers.Authorization = `Bearer ${token}`
        }
    }

    const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })

    if (res.status === 401 && auth && !body?.skipRefresh) {
        try {
            await refreshAccessToken()
            return request(path, { method, body, auth, skipRefresh: true })
        } catch {
            clearStoredSession()
        }
    }

    const json = await res.json().catch(() => null)

    if (!res.ok) {
        const message = json?.error || `request failed with status ${res.status}`
        const error = new Error(message)
        error.status = res.status
        throw error
    }

    return json?.data
}

export const ApiGet = (path, options) => {
    return request(path, {...options, method: "GET"})
}

export const apiPost = (path, body, options) => {
    return request(path, {...options, method: "POST", body})
}

export const apiPatch = (path, body, options) => {
    return request(path, {...options, method: "PATCH", body})
}

export const apiDelete = (path, options) => {
    return request(path, {...options, method: "DELETE"})
}
 