import { useState } from "react"

const BudgetCategoryCard = ({budget}) => {
    return (
        <>
        <div className="rounded-lg my-2 border p-4">   
            <p className={"text-sm"} style={{color:budget.color}} >{budget.categoryName}</p> 
            <p className={`text-md font-semibold`}>Budget: {budget.budget}</p>
            <p className={`text-md font-semibold`}>Spent: {budget.spent}</p>
            <p className={`text-md font-semibold`}>Percentage: {budget.percentage}</p>
        </div>
        {/* Burn Rate Progress Bar */}
            <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Spending vs Income</span>
                    <span>%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                            40 > 85 ? 'bg-rose-500' : 
                            40 > 70 ? 'bg-amber-500' : 
                            'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(50, 100)}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span>100%</span>
                </div>
            </div>
            </>
    )
}

export default BudgetCategoryCard;


// categoryName: "Housing",
// spent: 1850.00,
// budget: 2000.00,
// percentage: 92.5,
// color: "#4CAF50"