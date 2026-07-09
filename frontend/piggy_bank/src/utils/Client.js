const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1"

const getAccessToken = () => {
    return localStorage.getItem("accessToken")
}

const request = async (path, { method = "GET", body, auth = true } = {}) => {
    const headers = { "Content-Type": "application/json" }

    if (auth) {
        const token = getAccessToken
        if (token) {
            headers.Authorization = `Bearer ${token}`
        }
    }

    const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })

    const json = await res.json().catch(() => null)

    if (!res.ok) {
        const message = json?.error || `request failed with status ${res.status}`
        const error = new Error(message)
        error.status = res.status
        throw error
    }

    return json?.data
}

const apiGet = (path, options) => {
    return request(path, {...options, method: "GET"})
}

const apiPost = (path, options) => {
    return request(path, {...options, method: "POST", body})
}

const apiPatch = (path, options) => {
    return request(path, {...options, method: "PATCH", body})
}

const apiDelete = (path, options) => {
    return request(path, {...options, method: "DELETE"})
}

export default (apiGet, apiPost, apiPatch, apiDelete)