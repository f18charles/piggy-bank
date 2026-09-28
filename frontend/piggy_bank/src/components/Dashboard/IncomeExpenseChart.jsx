import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts"
import { apiGet } from "../../utils/Client"

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const compact = (value) =>
    new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)

const IncomeExpenseChart = () => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let ignore = false
        async function load() {
            try {
                const year = new Date().getFullYear()
                const summary = await apiGet(`/insights/summary/yearly?year=${year}`)
                if (ignore) return
                const rows = (summary || []).map((m) => ({
                    month: MONTHS[(m.month || 1) - 1],
                    income: m.income || 0,
                    expenses: m.expenses || 0,
                }))
                setData(rows)
            } catch {
                // Chart is supplementary; fail silently to keep the dashboard usable.
            } finally {
                if (!ignore) setLoading(false)
            }
        }
        load()
        return () => { ignore = true }
    }, [])

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Income vs Expenses ({new Date().getFullYear()})</h2>
            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                </div>
            ) : (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                            <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
                            <Tooltip formatter={(value) => new Intl.NumberFormat('en-US').format(value)} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="income" name="Income" fill="#059669" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="expenses" name="Expenses" fill="#e11d48" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}

export default IncomeExpenseChart
