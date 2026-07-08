import { useState } from "react"

const GoalItemCard = ({goal}) => {
    return (
        <div className="rounded-lg my-2 border p-4">   
            <p className={"text-sm text-slate-500"}>{goal.name}</p> 
            <p className={"text-sm text-slate-500"}>Target: {goal.targetAmount}</p>
            <p className={`text-md font-semibold`}>Current: {goal.currentAmount}</p>
            <p className={`text-md font-semibold`}>Percentage: {goal.percentage}</p>
            <p className={`text-md font-semibold`}>Deadline: {goal.deadline}</p>
        </div>
    )
}

export default GoalItemCard;

// id: "goal_001",
// name: "Emergency Fund",
// targetAmount: 30000,
// currentAmount: 15000,
// percentage: 50,
// deadline: "2026-12-31"