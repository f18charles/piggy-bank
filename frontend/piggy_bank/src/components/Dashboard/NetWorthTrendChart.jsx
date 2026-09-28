import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { apiGet } from "../../utils/Client"

const compact = (value) =>
    new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)

const label = (dateString) => {
    if (!dateString) return ''
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateString))
}

const NetWorthTrendChart = () => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let ignore = false
        async function load() {
            try {
                const result = await apiGet('/insights/net-worth?months=12')
                if (ignore) return
                const rows = (result?.history || []).map((s) => ({
                    date: label(s.snapshot_date),
                    value: s.total_net_worth || 0,
                }))
                setData(rows)
            } catch {
                // Supplementary chart.
            } finally {
                if (!ignore) setLoading(false)
            }
        }
        load()
        return () => { ignore = true }
    }, [])

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Net Worth Trend</h2>
            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                </div>
            ) : data.length < 2 ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-400 text-center px-6">
                    Net worth history builds up daily. Check back once a few snapshots exist.
                </div>
            ) : (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                            <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
                            <Tooltip formatter={(value) => new Intl.NumberFormat('en-US').format(value)} />
                            <Line type="monotone" dataKey="value" name="Net worth" stroke="#059669" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}

export default NetWorthTrendChart
