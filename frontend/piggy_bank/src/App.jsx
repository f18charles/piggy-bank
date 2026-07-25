import Layout from './components/Layout/Layout'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import './styles/App.css'
import ProtectedRoute from './utils/auth/Protectedroute'
import Login from './pages/auth/Login'
import Accounts from './pages/Accounts'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />} >
                <Route path="/" element={<Layout />} >
                    <Route index element={<Dashboard />} />
                    <Route path='/accounts' element={<Accounts />} />
                    <Route path='/budget' element={<Budgets />} />
                    <Route path='/goals' element={<Goals />} />
                </Route>
            </Route>
            
        </Routes>
    )
}

export default App
