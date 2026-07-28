const NetworthCard = ({data}) => {
    return (
        <div className="bg-white rounded-2xl border-l-4 border-emerald-500 shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Net Worth</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1 break-words">
                        {data.net_worth.toLocaleString()} {data.currency}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                            +{data.change_percentage}%
                        </span>
                    </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                    <p className="text-xs text-emerald-600">Assets</p>
                    <p className="text-md font-semibold text-emerald-700">{data.total_assets.toLocaleString()} {data.currency}</p>
                    <p className="text-xs text-rose-500 mt-1">Liabilities</p>
                    <p className="text-md font-semibold text-rose-600">{data.total_liabilities.toLocaleString()} {data.currency}</p>
                </div>
            </div>
        </div>
    )
}

export default NetworthCard;