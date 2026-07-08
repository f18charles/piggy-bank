import { useState } from "react"

const AccountItemCard = ({account}) => {
    return (
        <div className="rounded-lg my-2 border p-4">   
            <p className={"text-sm text-slate-500"}>{account.name}</p> 
            <p className={"text-sm text-slate-500"}>Type: {account.type}</p>
            <p className={`text-md font-semibold`}>Balance: {account.balance}</p>
            <p className={`text-md font-semibold`}>Currency: {account.currency}</p>
        </div>
    )
}

export default AccountItemCard;
//  id: "acc_001",
// name: "Chase Checking",
// type: "checking",
// balance: 12450.75,
// currency: "USD"