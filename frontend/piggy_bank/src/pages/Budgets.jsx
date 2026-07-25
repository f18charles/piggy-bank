import { useState, useEffect, useCallback } from "react"
import { apiGet, apiPost, apiPatch, apiDelete } from "../utils/Client"
import BudgetRow from "../components/Budgets/BudgetRow"
import BudgetForm from "../components/Budgets/BudgetForm"

const Budgets = () => {
    const [budgets, setBudgets] = useState([])
    const [categories, setCategories] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingBudget, setEditingBudget] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [actionError, setActionError] = useState(null)

    const loadBudgets = useCallback(async () => {
        try {
            const data = await apiGet("/budgets")
            setBudgets(data)
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
                const [budgetsData, categoriesData] = await Promise.all([
                    apiGet("/budgets"),
                    apiGet("/categories"),
                ])
                if (!ignore) {
                    setBudgets(budgetsData)
                    setCategories(categoriesData)
                }
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
        setEditingBudget(null)
        setActionError(null)
        setIsFormOpen(true)
    }

    const openEditForm = (budget) => {
        setEditingBudget(budget)
        setActionError(null)
        setIsFormOpen(true)
    }

    const closeForm = () => {
        setIsFormOpen(false)
        setEditingBudget(null)
    }

    const handleSubmit = async (payload) => {
        setIsSubmitting(true)
        setActionError(null)
        try {
            if (editingBudget) {
                await apiPatch(`/budgets/${editingBudget.id}`, payload)
            } else {
                await apiPost("/budgets", payload)
            }
            closeForm()
            await loadBudgets()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (budget) => {
        if (!window.confirm(`Delete budget for "${budget.category?.name || 'this category'}"? This can't be undone.`)) {
            return
        }
        setDeletingId(budget.id)
        setActionError(null)
        try {
            await apiDelete(`/budgets/${budget.id}`)
            await loadBudgets()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setDeletingId(null)
        }
    }

    const getSummaryStats = () => {
        if (budgets.length === 0) return null
        
        const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
        const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent), 0)
        const totalRemaining = totalBudgeted - totalSpent
        const averageSpent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
        
        return {
            totalBudgeted,
            totalSpent,
            totalRemaining,
            averageSpent,
            isOverBudget: totalRemaining < 0
        }
    }

    const stats = getSummaryStats()

    return (
        <div className="p-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Budgets</h1>
                    {stats && (
                        <p className="text-sm text-gray-500 mt-1">
                            {budgets.length} active {budgets.length === 1 ? 'budget' : 'budgets'}
                        </p>
                    )}
                </div>
                <button
                    onClick={openCreateForm}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Budget
                </button>
            </div>

            {/* Summary Cards */}
            {stats && !isLoading && !error && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Total Budgeted</p>
                        <p className="text-xl font-bold text-gray-900">
                            ${stats.totalBudgeted.toFixed(0)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Total Spent</p>
                        <p className="text-xl font-bold text-gray-900">
                            ${stats.totalSpent.toFixed(0)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Remaining</p>
                        <p className={`text-xl font-bold ${stats.isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                            ${stats.totalRemaining.toFixed(0)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Average Spent</p>
                        <p className="text-xl font-bold text-gray-900">
                            {stats.averageSpent.toFixed(0)}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                                className={`h-1 rounded-full transition-all duration-300 ${
                                    stats.averageSpent < 50 ? 'bg-emerald-500' :
                                    stats.averageSpent < 75 ? 'bg-yellow-500' :
                                    stats.averageSpent < 90 ? 'bg-orange-500' :
                                    'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(stats.averageSpent, 100)}%` }}
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

            {/* Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 bg-black opacity-50 transition-all duration-100"
                            onClick={closeForm}
                        />
                        
                        {/* Modal Panel */}
                        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto">
                            <BudgetForm
                                budget={editingBudget}
                                categories={categories}
                                onSubmit={handleSubmit}
                                onCancel={closeForm}
                                isSubmitting={isSubmitting}
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
                    <p className="text-rose-600">Couldn't load budgets: {error}</p>
                    <button 
                        onClick={loadBudgets}
                        className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                        Try again
                    </button>
                </div>
            ) : budgets.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                    <div className="text-gray-400 mb-3">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">No budgets yet</h3>
                    <p className="text-sm text-gray-500 mt-1">Create your first budget to start tracking your spending</p>
                    <button
                        onClick={openCreateForm}
                        className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition-colors"
                    >
                        Create Budget
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {budgets.map((budget) => (
                        <BudgetRow
                            key={budget.id}
                            budget={budget}
                            onEdit={openEditForm}
                            onDelete={handleDelete}
                            isDeleting={deletingId === budget.id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Budgets