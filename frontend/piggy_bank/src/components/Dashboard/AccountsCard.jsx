import AccountItemCard from "./AccountItem";

const AccountsCard = ({data}) => {
    return (
        <div className="bg-white rounded-2xl border-l-4 border-emerald-500 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Accounts</p>
                    <p className="text-sm text-gray-500 mt-1">{data.length} active accounts</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        Total: ${data.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}
                    </span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((item) => (
                    <AccountItemCard key={item.id} account={item} />
                ))}
            </div>
        </div>
    )
}

export default AccountsCard;
