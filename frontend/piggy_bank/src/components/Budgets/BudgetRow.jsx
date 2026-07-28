import { useState } from 'react'

const getPeriodColor = (period) => {
    switch (period) {
        case 'monthly': return 'text-blue-600 bg-blue-50'
        case 'quarterly': return 'text-purple-600 bg-purple-50'
        case 'yearly': return 'text-emerald-600 bg-emerald-50'
        case 'custom': return 'text-amber-600 bg-amber-50'
        default: return 'text-gray-600 bg-gray-50'
    }
}

const getProgressColor = (percentage) => {
    if (percentage < 50) return 'bg-emerald-500'
    if (percentage < 75) return 'bg-yellow-500'
    if (percentage < 90) return 'bg-orange-500'
    return 'bg-rose-500'
}

const formatCurrency = (amount, currency = 'kes') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date)
}

const BudgetRow = ({ budget, onEdit, onDelete, isDeleting }) => {
    const [showDetails, setShowDetails] = useState(false)

    const spentPercentage = budget.amount > 0
        ? Math.min((budget.spent / budget.amount) * 100, 100)
        : 0

    const remaining = budget.amount - budget.spent
    const isOverBudget = remaining < 0
    const categoryName = budget.category?.name || 'Uncategorized'

    return (
        <div className="bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${getPeriodColor(budget.period)}`}>
                        {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <p
                                className="text-sm font-semibold text-gray-800 truncate"
                                style={budget.category?.color ? { color: budget.category.color } : undefined}
                            >
                                {categoryName}
                            </p>
                            <span className="text-xs text-gray-400 hidden sm:inline">•</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                    {formatCurrency(budget.amount)}
                                </span>
                                <span className="text-xs text-gray-400">budget</span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                                <span>Spent: {formatCurrency(budget.spent)}</span>
                                <span>{spentPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                    className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(spentPercentage)}`}
                                    style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 sm:ml-4">
                    <div className="text-left sm:text-right">
                        <p className={`text-sm font-semibold ${isOverBudget ? 'text-rose-600' : 'text-gray-900'}`}>
                            {formatCurrency(remaining)}
                        </p>
                        <p className="text-xs text-gray-400">remaining</p>
                    </div>

                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <svg 
                                className={`w-4 h-4 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <button 
                            onClick={() => onEdit(budget)} 
                            className="text-sm px-2 sm:px-3 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                            Edit
                        </button>
                        <button 
                            onClick={() => onDelete(budget)} 
                            className="text-sm px-2 sm:px-3 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                            disabled={isDeleting}
                        >
                            {isDeleting ? '...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded details */}
            {showDetails && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                        <div>
                            <p className="text-xs text-gray-400">Period</p>
                            <p className="font-medium text-gray-700 capitalize">{budget.period}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Start Date</p>
                            <p className="font-medium text-gray-700">{formatDate(budget.start_date)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">End Date</p>
                            <p className="font-medium text-gray-700">{formatDate(budget.end_date)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BudgetRow