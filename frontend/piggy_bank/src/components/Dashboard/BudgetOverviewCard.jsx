import BudgetCategoryCard from "./BudgetCategory";

const BudgetOverviewCard = ({data}) => {
    return (
        <div className="bg-white rounded-2xl border-l-4 border-emerald-500 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col">
                <div className="flex flex-row justify-between items-center">
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Budgets</p>
                    <p className="text-sm text-gray-500 mt-1">{data.length}</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {data.map((item) => (
                        <BudgetCategoryCard key={item.category_name} budget={item} />
                    ))}
                </div>                
            </div>
        </div>
        
    )
}

export default BudgetOverviewCard;
