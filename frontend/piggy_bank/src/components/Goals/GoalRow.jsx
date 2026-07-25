import { useState } from 'react'

const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-emerald-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    if (percentage >= 25) return 'bg-orange-500'
    return 'bg-gray-400'
}

const getStatusBadge = (percentage, deadline) => {
    if (percentage >= 100) {
        return { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' }
    }
    
    if (deadline) {
        const today = new Date()
        const deadlineDate = new Date(deadline)
        const daysRemaining = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24))
        
        if (daysRemaining < 0) {
            return { label: 'Overdue', color: 'bg-rose-100 text-rose-700' }
        } else if (daysRemaining <= 7) {
            return { label: 'Urgent', color: 'bg-orange-100 text-orange-700' }
        } else if (daysRemaining <= 30) {
            return { label: 'Soon', color: 'bg-yellow-100 text-yellow-700' }
        }
    }
    
    return { label: 'In Progress', color: 'bg-blue-100 text-blue-700' }
}

const formatCurrency = (_amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(_amount)
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

const getDaysRemaining = (deadline) => {
    if (!deadline) return null
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const days = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24))
    return days
}

const GoalRow = ({ goal, onEdit, onDelete, isDeleting }) => {
    const [showDetails, setShowDetails] = useState(false)
    
    const progress = goal.target_amount > 0 
        ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
        : 0
    
    const remaining = goal.target_amount - goal.current_amount
    const isComplete = progress >= 100
    const daysRemaining = getDaysRemaining(goal.deadline)
    const status = getStatusBadge(progress, goal.deadline)

    return (
        <div className="bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold text-gray-800">
                                {goal.name}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                                {status.label}
                            </span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                                <span>
                                    {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                                </span>
                                <span>{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                    className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 ml-4">
                    <div className="text-right min-w-[80px]">
                        <p className={`text-sm font-semibold ${isComplete ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {formatCurrency(remaining)}
                        </p>
                        <p className="text-xs text-gray-400">remaining</p>
                    </div>
                    
                    <button 
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
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

                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => onEdit(goal)} 
                            className="text-sm px-3 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                            Edit
                        </button>
                        <button 
                            onClick={() => onDelete(goal)} 
                            className="text-sm px-3 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded details */}
            {showDetails && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-xs text-gray-400">Deadline</p>
                            <p className="font-medium text-gray-700">{formatDate(goal.deadline)}</p>
                            {daysRemaining !== null && (
                                <p className={`text-xs ${daysRemaining < 0 ? 'text-rose-600' : 'text-gray-500'}`}>
                                    {daysRemaining < 0 
                                        ? `${Math.abs(daysRemaining)} days overdue` 
                                        : `${daysRemaining} days remaining`}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Target _amount</p>
                            <p className="font-medium text-gray-700">{formatCurrency(goal.target_amount)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Current _amount</p>
                            <p className="font-medium text-gray-700">{formatCurrency(goal.current_amount)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GoalRow