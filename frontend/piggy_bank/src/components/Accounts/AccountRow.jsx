const getTypeConfig = (type) => {
    const configs = {
        checking: { 
            color: 'blue', 
            bg: 'bg-blue-50', 
            text: 'text-blue-700',
            border: 'border-blue-200',
            icon: '🏦',
            gradient: 'from-blue-500 to-blue-600'
        },
        savings: { 
            color: 'emerald', 
            bg: 'bg-emerald-50', 
            text: 'text-emerald-700',
            border: 'border-emerald-200',
            icon: '💰',
            gradient: 'from-emerald-500 to-emerald-600'
        },
        investment: { 
            color: 'purple', 
            bg: 'bg-purple-50', 
            text: 'text-purple-700',
            border: 'border-purple-200',
            icon: '📈',
            gradient: 'from-purple-500 to-purple-600'
        },
        credit: { 
            color: 'rose', 
            bg: 'bg-rose-50', 
            text: 'text-rose-700',
            border: 'border-rose-200',
            icon: '💳',
            gradient: 'from-rose-500 to-rose-600'
        },
        mpesa: { 
            color: 'orange', 
            bg: 'bg-orange-50', 
            text: 'text-orange-700',
            border: 'border-orange-200',
            icon: '📱',
            gradient: 'from-orange-500 to-orange-600'
        }
    }
    return configs[type] || configs.checking
}

const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

const AccountRow = ({ account, onEdit, onDelete, isDeleting }) => {
    const config = getTypeConfig(account.type)

    return (
        <div 
            className="group bg-white rounded-2xl border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-emerald-200"
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5">
                {/* Left Section */}
                <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                    {/* Icon Circle */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl ${config.bg} flex items-center justify-center text-xl sm:text-2xl transition-transform duration-300 group-hover:scale-110`}>
                        {config.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <h3 className="text-base font-semibold text-gray-800 truncate">
                                {account.name}
                            </h3>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.bg} ${config.text} border ${config.border}`}>
                                {account.type}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                            <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(account.balance, account.currency)}
                            </span>
                            <span className="text-xs text-gray-400">current balance</span>
                        </div>
                    </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex items-center gap-2 justify-end sm:ml-4">
                    {/* Quick action buttons - always visible on touch devices, fade in on hover for pointer devices */}
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:translate-x-2 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 transition-all duration-300">
                        <button 
                            onClick={() => onEdit(account)} 
                            className="text-sm px-3 py-1.5 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-all duration-200 flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                        <button 
                            onClick={() => onDelete(account)} 
                            className="text-sm px-3 py-1.5 rounded-xl text-rose-700 hover:bg-rose-50 transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed" 
                            disabled={isDeleting}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                    
                    {/* Always visible action indicator - hidden on mobile since actions are already visible there */}
                    <div className="hidden sm:flex w-8 h-8 rounded-xl bg-gray-50 items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all duration-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                    </div>
                </div>
            </div>
            
            {/* Bottom gradient accent bar */}
            <div className={`h-0.5 bg-gradient-to-r ${config.gradient} opacity-0 group-hover:opacity-100 transition-all duration-300`}></div>
        </div>
    )
}

export default AccountRow