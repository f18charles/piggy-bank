import GoalItemCard from "./GoalsItem";

const GoalsCard = ({data}) => {
    return (
        <div className="bg-white border-l-4 rounded-xl border-emerald-500 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col align-center">
                <div className="flex flex-row justify-between items-center">
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Goals</p>
                    <p className="text-sm text-gray-500 mt-1">{data.length}</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {data.map((item) => (
                        <GoalItemCard key={item.id} goal={item} />
                    ))}
                </div>
            </div>
            
        </div>
    )
}

export default GoalsCard;