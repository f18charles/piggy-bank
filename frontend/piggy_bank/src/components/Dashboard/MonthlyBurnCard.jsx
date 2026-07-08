import { useState } from "react"

const MonthlyBurnCard = ({data}) => {
    return (
        <div className="rounded-lg border p-4">   
            <p className={"text-sm text-slate-500"}>Monthly Burn</p>         
            <p className={"text-md font-semibold"}>Avg. spend: {data.averageMonthlySpend}</p>
            <p className={`text-md font-semibold`}>Income: {data.monthlyIncome}</p>
            <p className={`text-md font-semibold`}>BurnRate: {data.burnRate}</p>
            <p className={`text-md font-semibold`}>Projected Runway: {data.projectedRunway}</p>
            <p className={`text-md font-semibold`}>Currency: {data.currency}</p>
        </div>
    )
}

export default MonthlyBurnCard;