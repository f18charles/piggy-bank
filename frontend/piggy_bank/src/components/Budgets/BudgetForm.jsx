import { useState } from "react"

const PERIOD_TYPES = ['monthly', 'quarterly', 'yearly', 'custom']

const BudgetForm = ({ budget, onSubmit, onCancel, isSubmitting }) => {
    const isEditing = Boolean(budget)

    const [categoryId, setCategoryId] = useState(budget?.categoryId || '')
    const [amount, setAmount] = useState(budget?.amount || 0)
    const [spent, setSpent] = useState(budget?.spent || 0)
    const [period, setPeriod] = useState(budget?.period || PERIOD_TYPES[0])
    const [startDate, setStartDate] = useState(budget?.startDate || '')
    const [endDate, setEndDate] = useState(budget?.endDate || '')

    const handleSubmit = (e) => {
        e.preventDefault()
        const payload = {
            categoryId,
            amount: Number(amount),
            spent: Number(spent),
            period,
            startDate,
            endDate: period === 'custom' ? endDate : undefined
        }
        onSubmit(payload)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
                {isEditing ? 'Edit Budget' : 'Add New Budget'}
            </h2>
            
            <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                    Category ID
                </label>
                <input
                    type="text"
                    id="categoryId"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    placeholder="e.g., GROC-001"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                        Budget Amount
                    </label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div>
                    <label htmlFor="spent" className="block text-sm font-medium text-gray-700 mb-1">
                        Spent
                    </label>
                    <input
                        type="number"
                        id="spent"
                        value={spent}
                        onChange={(e) => setSpent(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
                    Period
                </label>
                <select
                    id="period"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    {PERIOD_TYPES.map((item) => (
                        <option key={item} value={item}>
                            {item.charAt(0).toUpperCase() + item.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                        End Date {period !== 'custom' && <span className="text-gray-400 text-xs">(Auto-calculated)</span>}
                    </label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required={period === 'custom'}
                        disabled={period !== 'custom'}
                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            period !== 'custom' 
                                ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' 
                                : 'border-gray-300'
                        }`}
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2 px-3 transition-colors"
                >
                    {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Budget'}
                </button>
                <button 
                    type="button" 
                    onClick={onCancel} 
                    disabled={isSubmitting} 
                    className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg py-2 px-3 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

export default BudgetForm