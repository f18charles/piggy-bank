import Layout from './components/Layout/Layout'
import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import './styles/App.css'

function App() {
    return (
        <Routes>
            {/* <Route path="login" element={<Login />} /> */}
            <Route path="/" element={<Layout />} >
                <Route index element={<Dashboard />} />
            </Route>
        </Routes>
    )
}

export default App
