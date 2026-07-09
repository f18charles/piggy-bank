import Layout from './components/Layout/Layout'
import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import './styles/App.css'
import ProtectedRoute from './utils/auth/Protectedroute'
import Login from './pages/auth/Login'

function App() {
    return (
        <Routes>
            <Route path="login" element={<Login />} />
            <Route element={<ProtectedRoute />} >
                <Route path="/" element={<Layout />} >
                    <Route index element={<Dashboard />} />
                </Route>
            </Route>
            
        </Routes>
    )
}

export default App
