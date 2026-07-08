import { useState } from "react"
import GoalItemCard from "./GoalsItem";

const GoalsCard = ({data}) => {
    return (
        <div>
        <h2>Goals</h2>
        {data.map((item) => (
            <GoalItemCard key={item.id} goal={item} />
        ))}
        </div>
    )
}

export default GoalsCard;