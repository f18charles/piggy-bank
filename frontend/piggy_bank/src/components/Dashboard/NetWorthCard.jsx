import { useState } from "react"

const NetworthCard = ({data}) => {
    return (
        <div className="rounded-lg border p-4">   
            <p className={"text-sm text-slate-500"}>Networth</p>         
            <p className={"text-md font-semibold"}>Assets:  {data.totalAssets}</p>
            <p className={`text-md font-semibold`}>Liabities: {data.totalLiabilities}</p>
            <p className={`text-md font-semibold`}>Networth: {data.totalLiabilities}</p>
            <p className={`text-md font-semibold`}>% Change: {data.changePercentage}</p>
            <p className={`text-md font-semibold`}>Currency: {data.currency}</p>
        </div>
    )
}

export default NetworthCard;