import { useState } from "react"
import AccountItemCard from "./AccountItem";

const AccountsCard = ({data}) => {
    return (
        <div>
        <h2>Accounts</h2>
        {data.map((item) => (
            <AccountItemCard key={item.id} account={item} />
        ))}
        </div>
    )
}

export default AccountsCard;