import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { apiGet } from "../../utils/Client"

const compact = (value) =>
    new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)

const shortDate = (dateString) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateString))

const GoalGrowthChart = ({ goalId }) => {
    const [points, setPoints] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let ignore = false
        async function load() {
            setLoading(true)
            setError(null)
            try {
                const history = await apiGet(`/goals/${goalId}/history`)
                if (!ignore) setPoints(history || [])
            } catch (err) {
                if (!ignore) setError(err.message)
            } finally {
                if (!ignore) setLoading(false)
            }
        }
        load()
        return () => { ignore = true }
    }, [goalId])

    if (loading) {
        return <div className="h-40 flex items-center justify-center text-sm text-gray-400">Loading growth…</div>
    }
    if (error) {
        return <div className="h-40 flex items-center justify-center text-sm text-rose-500">{error}</div>
    }
    if (points.length < 2) {
        return (
            <div className="h-40 flex items-center justify-center text-sm text-gray-400 text-center px-4">
                Add funds over time to see this goal's growth curve.
            </div>
        )
    }

    const chartData = points.map((p) => ({ date: shortDate(p.date), cumulative: p.cumulative }))

    return (
        <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
                    <Tooltip formatter={(value) => new Intl.NumberFormat('en-US').format(value)} />
                    <Line type="monotone" dataKey="cumulative" name="Saved" stroke="#059669" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export default GoalGrowthChart
