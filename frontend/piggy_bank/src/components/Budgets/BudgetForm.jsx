import { useState } from "react"

const PERIOD_TYPES = ['monthly', 'quarterly', 'yearly', 'custom']

// The backend doesn't auto-calculate an end date -- it just stores
// whatever it's given. This is what actually makes the "(Auto-calculated)"
// label true: compute a sensible end date ourselves before submitting,
// for every period except "custom" (where the user picks one explicitly).
function calculateEndDate(startDate, period) {
    if (!startDate) return ''
    const date = new Date(startDate)

    if (period === 'monthly') date.setMonth(date.getMonth() + 1)
    else if (period === 'quarterly') date.setMonth(date.getMonth() + 3)
    else if (period === 'yearly') date.setFullYear(date.getFullYear() + 1)

    return date.toISOString().slice(0, 10)
}

// Backend dates come back as full ISO datetimes (e.g. "2026-01-01T00:00:00Z"),
// but <input type="date"> only accepts the YYYY-MM-DD portion -- feeding it
// the full string makes the input silently show blank.
function toDateInputValue(isoString) {
    if (!isoString) return ''
    return isoString.slice(0, 10)
}

const BudgetForm = ({ budget, categories, onSubmit, onCancel, isSubmitting }) => {
    const isEditing = Boolean(budget)

    const [categoryId, setCategoryId] = useState(budget?.category_id || '')
    const [amount, setAmount] = useState(budget?.amount || 0)
    const [period, setPeriod] = useState(budget?.period || PERIOD_TYPES[0])
    const [startDate, setStartDate] = useState(toDateInputValue(budget?.start_date))
    const [endDate, setEndDate] = useState(toDateInputValue(budget?.end_date))

    const handleSubmit = (e) => {
        e.preventDefault()

        const resolvedEndDate = period === 'custom'
            ? endDate
            : calculateEndDate(startDate, period)

        // Deliberately no "spent" here -- it's a running total the backend
        // updates automatically as transactions come in, not something
        // this form should ever be able to overwrite. A new budget starts
        // at 0 (the model's own default); editing one shouldn't touch it.
        const payload = {
            category_id: categoryId,
            amount: Number(amount),
            period,
            start_date: startDate,
            end_date: resolvedEndDate,
        }
        onSubmit(payload)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
                {isEditing ? 'Edit Budget' : 'Add New Budget'}
            </h2>

            <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                </label>
                <select
                    id="categoryId"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="" disabled>Select a category</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {isEditing && (
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
                    Spent so far: <span className="font-medium text-gray-700">{budget.spent}</span>
                    {' '}-- updates automatically as transactions come in, not editable here.
                </div>
            )}

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
                        value={period === 'custom' ? endDate : calculateEndDate(startDate, period)}
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