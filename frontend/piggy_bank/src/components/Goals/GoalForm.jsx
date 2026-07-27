import { useState } from "react"

const GoalForm = ({ goal, onSubmit, onCancel, isSubmitting }) => {
    const isEditing = Boolean(goal)

    const [name, setName] = useState(goal?.name || '')
    const [targetAmount, setTargetAmount] = useState(goal?.target_amount || '')
    const [deadline, setDeadline] = useState(
        goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : ''
    )

    const handleSubmit = (e) => {
        e.preventDefault()
        const payload = {
            name,
            target_amount: Number(targetAmount),
        }
        if (deadline) payload.deadline = new Date(deadline).toISOString()
        onSubmit(payload)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                    {isEditing ? 'Edit Goal' : 'Add New Goal'}
                </h2>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Goal Name
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., Emergency Fund, Vacation, New Car"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>

            <div>
                <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Target Amount
                </label>
                <input
                    type="number"
                    id="targetAmount"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>

            <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline (Optional)
                </label>
                <input
                    type="date"
                    id="deadline"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>

            {!isEditing && (
                <p className="text-xs text-gray-400">
                    New goals start at $0 saved. Use "Add Funds" after creating it to contribute money from one of your accounts.
                </p>
            )}

            <div className="flex gap-3 pt-2">
                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2 px-3 transition-colors"
                >
                    {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Goal'}
                </button>
                <button 
                    type="button" 
                    onClick={onCancel} 
                    disabled={isSubmitting} 
                    className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg py-2 px-3 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

export default GoalForm
