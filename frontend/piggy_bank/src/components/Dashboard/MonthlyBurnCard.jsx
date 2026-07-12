import { useState } from "react"

const MonthlyBurnCard = ({data}) => {
    // Format currency helper
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: data.currency || 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Get status color based on burn rate
    const getBurnStatusColor = () => {
        if (data.burn_rate > 85) return 'text-rose-600 bg-rose-50';
        if (data.burn_rate > 70) return 'text-amber-600 bg-amber-50';
        return 'text-emerald-600 bg-emerald-50';
    };

    return (
        <div className="bg-white rounded-2xl border-l-4 border-emerald-500 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                        Monthly Burn
                    </p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                        {formatCurrency(data.average_monthly_spend)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${getBurnStatusColor()}`}>
                            {data.burn_rate}% burn rate
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-emerald-600">Income</p>
                    <p className="text-md font-semibold text-emerald-700">
                        {formatCurrency(data.monthly_income)}
                    </p>
                    <p className="text-xs text-rose-500 mt-1">Runway</p>
                    <p className={`text-md font-semibold ${
                        data.projected_runway > 24 ? 'text-emerald-600' : 
                        data.projected_runway > 12 ? 'text-amber-600' : 
                        'text-rose-600'
                    }`}>
                        {data.projected_runway} months
                    </p>
                </div>
            </div>
        </div>
    )
}

export default MonthlyBurnCard;