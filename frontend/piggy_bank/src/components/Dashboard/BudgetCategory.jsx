import { useState } from "react"

const BudgetCategoryCard = ({budget}) => {
    return (
        <div className="rounded-lg my-2 border p-4">   
            <p className={"text-sm"} style={{color:budget.color}} >{budget.categoryName}</p> 
            <p className={`text-md font-semibold`}>Budget: {budget.type}</p>
            <p className={`text-md font-semibold`}>Spent: {budget.balance}</p>
            <p className={`text-md font-semibold`}>Percentage: {budget.percentage}</p>
        </div>
    )
}

export default BudgetCategoryCard;


// categoryName: "Housing",
// spent: 1850.00,
// budget: 2000.00,
// percentage: 92.5,
// color: "#4CAF50"