const formatCurrency = (amount, currency = 'kes') =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount || 0)

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(dateString))
}

const getTypeColor = (type) => {
    switch (type) {
        case 'income': return 'text-emerald-700 bg-emerald-50'
        case 'expense': return 'text-rose-700 bg-rose-50'
        case 'transfer': return 'text-slate-700 bg-slate-100'
        default: return 'text-gray-700 bg-gray-50'
    }
}

const RecurringRow = ({ item, onEdit, onDelete, isDeleting }) => {
    const isTransfer = item.type === 'transfer'
    const accountLabel = isTransfer
        ? `${item.account?.name || '?'} → ${item.to_account?.name || '?'}`
        : (item.account?.name || 'Unknown account')

    return (
        <div className="bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                            {item.description || item.category?.name || 'Recurring transaction'}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeColor(item.type)}`}>
                            {item.type}
                        </span>
                        {!item.is_active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                paused
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {accountLabel} • every {item.frequency} • next {formatDate(item.next_due_date)}
                    </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                    <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount, item.account?.currency)}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onEdit(item)}
                            className="text-sm px-2.5 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(item)}
                            disabled={isDeleting}
                            className="text-sm px-2.5 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        >
                            {isDeleting ? '...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RecurringRow
