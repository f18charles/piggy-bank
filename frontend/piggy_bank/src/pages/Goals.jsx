import { useState, useEffect, useCallback } from "react"
import { apiGet, apiPost, apiPatch, apiDelete } from "../utils/Client"
import GoalRow from "../components/Goals/GoalRow"
import GoalForm from "../components/Goals/GoalForm"
import GoalFundsForm from "../components/Goals/GoalFundsForm"

const Goals = () => {
    const [goals, setGoals] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingGoal, setEditingGoal] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [actionError, setActionError] = useState(null)

    // Contribute / withdraw modal: { goal, mode: 'contribute' | 'withdraw' } | null
    const [fundsAction, setFundsAction] = useState(null)
    const [isFundsSubmitting, setIsFundsSubmitting] = useState(false)

    const loadGoals = useCallback(async () => {
        try {
            const data = await apiGet("/goals")
            setGoals(data)
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        let ignore = false

        async function initialLoad() {
            try {
                const data = await apiGet("/goals")
                if (!ignore) setGoals(data)
            } catch (err) {
                if (!ignore) setError(err.message)
            } finally {
                if (!ignore) setIsLoading(false)
            }
        }

        initialLoad()

        return () => {
            ignore = true
        }
    }, [])

    const openCreateForm = () => {
        setEditingGoal(null)
        setActionError(null)
        setIsFormOpen(true)
    }

    const openEditForm = (goal) => {
        setEditingGoal(goal)
        setActionError(null)
        setIsFormOpen(true)
    }

    const closeForm = () => {
        setIsFormOpen(false)
        setEditingGoal(null)
    }

    const handleSubmit = async (payload) => {
        setIsSubmitting(true)
        setActionError(null)
        try {
            if (editingGoal) {
                await apiPatch(`/goals/${editingGoal.id}`, payload)
            } else {
                await apiPost("/goals", payload)
            }
            closeForm()
            await loadGoals()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (goal) => {
        if (!window.confirm(`Delete goal "${goal.name}"? This can't be undone.`)) {
            return
        }
        setDeletingId(goal.id)
        setActionError(null)
        try {
            await apiDelete(`/goals/${goal.id}`)
            await loadGoals()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setDeletingId(null)
        }
    }

    const openContributeForm = (goal) => {
        setActionError(null)
        setFundsAction({ goal, mode: 'contribute' })
    }

    const openWithdrawForm = (goal) => {
        setActionError(null)
        setFundsAction({ goal, mode: 'withdraw' })
    }

    const closeFundsForm = () => {
        setFundsAction(null)
    }

    const handleFundsSubmit = async (payload) => {
        if (!fundsAction) return
        setIsFundsSubmitting(true)
        setActionError(null)
        try {
            const path = fundsAction.mode === 'withdraw'
                ? `/goals/${fundsAction.goal.id}/withdraw`
                : `/goals/${fundsAction.goal.id}/contribute`
            await apiPost(path, payload)
            closeFundsForm()
            await loadGoals()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setIsFundsSubmitting(false)
        }
    }

    // Calculate summary statistics
    const getSummaryStats = () => {
        if (goals.length === 0) return null
        
        const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0)
        const totalCurrent = goals.reduce((sum, g) => sum + Number(g.current_amount), 0)
        const totalRemaining = totalTarget - totalCurrent
        const averageProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0
        
        const completedGoals = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length
        const progressGoals = goals.filter(g => Number(g.current_amount) > 0 && Number(g.current_amount) < Number(g.target_amount)).length
        const notStartedGoals = goals.filter(g => Number(g.current_amount) === 0).length
        
        return {
            totalTarget,
            totalCurrent,
            totalRemaining,
            averageProgress,
            completedGoals,
            progressGoals,
            notStartedGoals,
            isComplete: averageProgress >= 100
        }
    }

    const stats = getSummaryStats()

    return (
        <div className="p-3 sm:p-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Goals</h1>
                    {stats && (
                        <p className="text-sm text-gray-500 mt-1">
                            {goals.length} {goals.length === 1 ? 'goal' : 'goals'} • 
                            {stats.completedGoals} completed • 
                            {stats.progressGoals} in progress
                        </p>
                    )}
                </div>
                <button
                    onClick={openCreateForm}
                    className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Goal
                </button>
            </div>

            {/* Summary Cards */}
            {stats && !isLoading && !error && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Total Target</p>
                        <p className="text-xl font-bold text-gray-900">
                            ${stats.totalTarget.toFixed(0)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Total Saved</p>
                        <p className="text-xl font-bold text-gray-900">
                            ${stats.totalCurrent.toFixed(0)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Remaining</p>
                        <p className={`text-xl font-bold ${stats.isComplete ? 'text-emerald-600' : 'text-gray-900'}`}>
                            ${stats.totalRemaining.toFixed(0)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Overall Progress</p>
                        <p className="text-xl font-bold text-gray-900">
                            {stats.averageProgress.toFixed(0)}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                                className={`h-1 rounded-full transition-all duration-300 ${
                                    stats.averageProgress >= 100 ? 'bg-emerald-500' :
                                    stats.averageProgress >= 50 ? 'bg-blue-500' :
                                    'bg-gray-400'
                                }`}
                                style={{ width: `${Math.min(stats.averageProgress, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Action Error */}
            {actionError && (
                <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-4 flex items-center justify-between">
                    <span>{actionError}</span>
                    <button 
                        onClick={() => setActionError(null)}
                        className="text-rose-400 hover:text-rose-600"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        {/* Backdrop with opacity-50 bg-black */}
                        <div 
                            className="fixed inset-0 bg-black opacity-50 transition-opacity"
                            onClick={closeForm}
                        />
                        
                        {/* Modal Panel */}
                        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto">
                            <GoalForm
                                goal={editingGoal}
                                onSubmit={handleSubmit}
                                onCancel={closeForm}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Contribute / Withdraw Modal */}
            {fundsAction && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div 
                            className="fixed inset-0 bg-black opacity-50 transition-opacity"
                            onClick={closeFundsForm}
                        />
                        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto">
                            <GoalFundsForm
                                goal={fundsAction.goal}
                                mode={fundsAction.mode}
                                onSubmit={handleFundsSubmit}
                                onCancel={closeFundsForm}
                                isSubmitting={isFundsSubmitting}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : error ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
                    <p className="text-rose-600">Couldn't load goals: {error}</p>
                    <button 
                        onClick={loadGoals}
                        className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                        Try again
                    </button>
                </div>
            ) : goals.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                    <div className="text-gray-400 mb-3">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">No goals yet</h3>
                    <p className="text-sm text-gray-500 mt-1">Set your first financial goal and start tracking your progress</p>
                    <button
                        onClick={openCreateForm}
                        className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition-colors"
                    >
                        Create Goal
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {goals.map((goal) => (
                        <GoalRow
                            key={goal.id}
                            goal={goal}
                            onEdit={openEditForm}
                            onDelete={handleDelete}
                            onContribute={openContributeForm}
                            onWithdraw={openWithdrawForm}
                            isDeleting={deletingId === goal.id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Goals
