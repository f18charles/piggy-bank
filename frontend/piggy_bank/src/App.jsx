import Layout from './components/Layout/Layout'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import './styles/App.css'
import ProtectedRoute from './utils/auth/Protectedroute'
import Login from './pages/auth/Login'
import Welcome from './pages/Welcome'
import Accounts from './pages/Accounts'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import Transactions from './pages/Transactions'

function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="accounts" element={<Accounts />} />
                    <Route path="budget" element={<Budgets />} />
                    <Route path="goals" element={<Goals />} />
                    <Route path="transactions" element={<Transactions />} />
                </Route>
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App

