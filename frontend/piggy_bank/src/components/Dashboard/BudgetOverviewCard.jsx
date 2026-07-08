import { useState } from "react"
import BudgetCategoryCard from "./BudgetCategory";

const BudgetOverviewCard = ({data}) => {
    return (
        <div>
        <h2>Budgets</h2>
        {data.map((item) => (
            <BudgetCategoryCard key={item.categoryName} budget={item} />
        ))}
        </div>
    )
}

export default BudgetOverviewCard;