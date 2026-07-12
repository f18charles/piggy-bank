const StatCard = ({label, value, accent="text-green-700", health, saving}) => {
    // compute derived values from props (no setState in render)
    const healthVal = health ? (health / 100) : null;
    const savingVal = saving ? (saving / 100) : null;

    if (health) {
        return (
            <div className="">
                <p className="text-sm text-slate-500">{label}</p>
                <p className={`text-2xl font-semibold ${accent}`}>{Math.round(health)}%</p>
            </div>
        )
    } else if (saving) {
        return (
            <div className="">
                <p className="text-sm text-slate-500">{label}</p>
                <p className={`text-2xl font-semibold ${accent}`}>{Math.round(saving)}%</p>
            </div>
        )
    }
    return (
        <div className="rounded-lg border p-4">            
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`text-2xl font-semibold ${accent}`}>{value}</p>
        </div>
    )
}

export default StatCard;
