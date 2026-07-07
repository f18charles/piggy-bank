import { useState } from "react"

const StatCard = ({label, value, accent="text-green-700", health, saving}) => {
    const [healthVal, setHealthVal] = useState(0)
    const [savingVal, setSavinghVal] = useState(0)

    if (health) { 
        setHealthVal(health/ 100)
        return (
            <div className="">

            </div>
        )
    } else if (saving) {
        return (
            <div className="">

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

