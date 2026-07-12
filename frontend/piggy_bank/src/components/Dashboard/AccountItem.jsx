const AccountItemCard = ({account}) => {
    // Get color based on account type
    const getTypeColor = () => {
        switch(account.type) {
            case 'checking': return 'text-blue-600 bg-blue-50';
            case 'savings': return 'text-emerald-600 bg-emerald-50';
            case 'investment': return 'text-purple-600 bg-purple-50';
            case 'credit': return 'text-rose-600 bg-rose-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    // Get balance color
    const getBalanceColor = () => {
        if (account.balance < 0) return 'text-rose-600';
        if (account.balance < 1000) return 'text-amber-600';
        return 'text-emerald-600';
    };

    // Format currency
    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="bg-gray-50 rounded-xl p-4 border border-purple-300 border-t-4 hover:border-emerald-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-gray-800 truncate">
                    {account.name}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor()}`}>
                    {account.type}
                </span>
            </div>
            
            <div className="">
                <p className="text-xs text-gray-500 font-medium">Balance</p>
                <p className={`text-xl font-bold ${getBalanceColor()}`}>
                    {formatCurrency(account.balance, account.currency)}
                </p>
            </div>
        </div>
    )
}

export default AccountItemCard;
