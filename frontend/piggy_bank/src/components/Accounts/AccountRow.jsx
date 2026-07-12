const getTypeColor = (type) => {
    switch (type) {
        case 'checking': return 'text-blue-600 bg-blue-50'
        case 'savings': return 'text-emerald-600 bg-emerald-50'
        case 'investment': return 'text-purple-600 bg-purple-50'
        case 'credit': return 'text-rose-600 bg-rose-50'
        default: return 'text-gray-600 bg-gray-50'
    }
}
 
const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

const AccountRow = ({ account, onEdit, onDelete, isDeleting }) => {
    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-emerald-200 hover:shadow-sm transition-all">
            <div className="flex items-center gap-4">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(account.type)}`}>{account.type}</span>
                <div className="">
                    <p className="text-sm font-semibold text-gray-800">{account.name}</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(account.balance, account.currency)}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onEdit(account)} className="text-sm px-3 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors">
                    Edit
                </button>
                <button onClick={() => onDelete(account)} className="text-sm px-3 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    )
}

export default AccountRow;