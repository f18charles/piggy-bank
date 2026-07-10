import { useState } from "react"

const BudgetCategoryCard = ({budget}) => {
    return (
        <>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all ">
                <div className="flex justify-between">
                    <p className={"text-md"} style={{color:budget.color}} >{budget.category_name}</p> 
                    <span className="text-md">{budget.percentage}%</span>
                </div>
            
                {/* Burn Rate Progress Bar */}
                <div className="mt-2">
                    <div className="text-right justify-between text-sm text-gray-500 mb-1">
                        <span>{budget.spent} / {budget.budget}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                                budget.percentage > 85 ? 'bg-rose-500' : 
                                budget.percentage > 60 ? 'bg-amber-500' : 
                                'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </>    
    )
}

export default BudgetCategoryCard;
