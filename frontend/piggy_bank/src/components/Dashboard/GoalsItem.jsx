import { useState } from "react"

const GoalItemCard = ({goal}) => {
    return (
        <>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all">   
                <div className="flex justify-between">
                    <p className={"text-md"}>{goal.name}</p> 
                    <span className="text-md">{goal.percentage.toFixed(1)}%</span>
                </div>

                {/* Burn Rate Progress Bar */}
                <div className="mt-2">
                    <div className="text-right text-sm text-gray-500 mb-1">
                        <span>{goal.current_amount} / {goal.target_amount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                                goal.percentage > 85 ? 'bg-emerald-500' : 
                                goal.percentage >= 40 ? 'bg-amber-500' : 
                                'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                        ></div>
                    </div>
                </div>
                <p className={`text-xs mt-2`}>{goal.deadline}</p>
            </div>
        </>
        
    )
}

export default GoalItemCard;

// id: "goal_001",
// name: "Emergency Fund",
// targetAmount: 30000,
// currentAmount: 15000,
// percentage: 50,
// deadline: "2026-12-31"