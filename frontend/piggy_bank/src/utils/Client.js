const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1"

const getAccessToken = () => {
    return localStorage.getItem("accessToken")
}

