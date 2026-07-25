import { useState } from 'react'

const getTypeColor = (type) => {
    switch (type) {
        case 'income': return 'text-emerald-600 bg-emerald-50'
        case 'expense': return 'text-rose-600 bg-rose-50'
        default: return 'text-gray-600 bg-gray-50'
    }
}

const getStatusColor = (status) => {
    switch (status) {
        case 'completed': return 'text-emerald-600 bg-emerald-50'
        case 'pending': return 'text-yellow-600 bg-yellow-50'
        case 'failed': return 'text-rose-600 bg-rose-50'
        default: return 'text-gray-600 bg-gray-50'
    }
}

const getPaymentMethodIcon = (method) => {
    const icons = {
        cash: '💰',
        credit_card: '💳',
        debit_card: '💳',
        bank_transfer: '🏦',
        mobile_money: '📱',
        check: '📝',
        other: '💵'
    }
    return icons[method] || '💵'
}

const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

const TransactionRow = ({ transaction, onEdit, onDelete, isDeleting }) => {
    const [showDetails, setShowDetails] = useState(false)
    
    const isIncome = transaction.type === 'income'

    return (
        <>
            {/* Main Row */}
            <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-gray-50 transition-colors">
                {/* Description */}
                <div className="col-span-3">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800 truncate">
                            {transaction.description || 'Untitled Transaction'}
                        </span>
                        <span className="text-xs text-gray-400">
                            {formatDate(transaction.transactionDate)}
                        </span>
                    </div>
                </div>

                {/* Type */}
                <div className="col-span-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(transaction.type)}`}>
                        {transaction.type}
                    </span>
                </div>

                {/* Payment Method */}
                <div className="col-span-2 flex items-center gap-1.5">
                    <span className="text-sm">{getPaymentMethodIcon(transaction.paymentMethod)}</span>
                    <span className="text-sm text-gray-700 capitalize">
                        {transaction.paymentMethod?.replace('_', ' ') || 'N/A'}
                    </span>
                </div>

                {/* Amount */}
                <div className="col-span-2 text-right">
                    <span className={`text-sm font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                </div>

                {/* Status */}
                <div className="col-span-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                    </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1">
                    <button 
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        title="Toggle details"
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
                        onClick={() => onEdit(transaction)} 
                        className="text-sm px-2 py-1 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Edit transaction"
                    >
                        Edit
                    </button>
                    <button 
                        onClick={() => onDelete(transaction)} 
                        className="text-sm px-2 py-1 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={isDeleting}
                        title="Delete transaction"
                    >
                        {isDeleting ? '...' : 'Delete'}
                    </button>
                </div>
            </div>

            {/* Expanded Details Row */}
            {showDetails && (
                <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="col-span-12">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-gray-400">Account ID</p>
                                <p className="font-mono text-xs text-gray-700 truncate">
                                    {transaction.accountId || transaction.account_id}
                                </p>
                            </div>
                            {transaction.categoryId && (
                                <div>
                                    <p className="text-xs text-gray-400">Category ID</p>
                                    <p className="font-mono text-xs text-gray-700 truncate">
                                        {transaction.categoryId || transaction.category_id}
                                    </p>
                                </div>
                            )}
                            {transaction.referenceId && (
                                <div>
                                    <p className="text-xs text-gray-400">Reference ID</p>
                                    <p className="font-mono text-xs text-gray-700 truncate">
                                        {transaction.referenceId || transaction.reference_id}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-gray-400">Created At</p>
                                <p className="text-xs text-gray-700">{formatDate(transaction.createdAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default TransactionRow