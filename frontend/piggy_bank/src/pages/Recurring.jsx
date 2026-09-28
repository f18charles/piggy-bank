import { useState, useEffect, useCallback } from "react"
import { apiGet, apiPost, apiPatch, apiDelete } from "../utils/Client"
import RecurringRow from "../components/Recurring/RecurringRow"
import RecurringForm from "../components/Recurring/RecurringForm"

const Recurring = () => {
    const [items, setItems] = useState([])
    const [accounts, setAccounts] = useState([])
    const [categories, setCategories] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [actionError, setActionError] = useState(null)

    const loadItems = useCallback(async () => {
        try {
            const data = await apiGet("/recurring")
            setItems(data || [])
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
                const [recurringData, accountsData, categoriesData] = await Promise.all([
                    apiGet("/recurring"),
                    apiGet("/accounts"),
                    apiGet("/categories"),
                ])
                if (!ignore) {
                    setItems(recurringData || [])
                    setAccounts(accountsData || [])
                    setCategories(categoriesData || [])
                }
            } catch (err) {
                if (!ignore) setError(err.message)
            } finally {
                if (!ignore) setIsLoading(false)
            }
        }
        initialLoad()
        return () => { ignore = true }
    }, [])

    const openCreateForm = () => {
        setEditingItem(null)
        setActionError(null)
        setIsFormOpen(true)
    }

    const openEditForm = (item) => {
        setEditingItem(item)
        setActionError(null)
        setIsFormOpen(true)
    }

    const closeForm = () => {
        setIsFormOpen(false)
        setEditingItem(null)
    }

    const handleSubmit = async (payload) => {
        setIsSubmitting(true)
        setActionError(null)
        try {
            if (editingItem) {
                await apiPatch(`/recurring/${editingItem.id}`, payload)
            } else {
                await apiPost("/recurring", payload)
            }
            closeForm()
            await loadItems()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (item) => {
        if (!window.confirm(`Delete recurring "${item.description || item.type}"? This can't be undone.`)) {
            return
        }
        setDeletingId(item.id)
        setActionError(null)
        try {
            await apiDelete(`/recurring/${item.id}`)
            await loadItems()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="p-3 sm:p-4 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Recurring</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Scheduled transactions are generated automatically on their due date.
                    </p>
                </div>
                <button
                    onClick={openCreateForm}
                    className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Recurring
                </button>
            </div>

            {actionError && (
                <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-4">
                    {actionError}
                </div>
            )}

            {isFormOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black opacity-50 transition-opacity" onClick={closeForm} />
                        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto">
                            <RecurringForm
                                item={editingItem}
                                accounts={accounts}
                                categories={categories}
                                onSubmit={handleSubmit}
                                onCancel={closeForm}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : error ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
                    <p className="text-rose-600">Couldn't load recurring transactions: {error}</p>
                    <button onClick={loadItems} className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                        Try again
                    </button>
                </div>
            ) : items.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                    <h3 className="text-lg font-medium text-gray-800">No recurring transactions yet</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Set up rent, subscriptions or salary to have them recorded automatically.
                    </p>
                    <button
                        onClick={openCreateForm}
                        className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition-colors"
                    >
                        Create Recurring
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <RecurringRow
                            key={item.id}
                            item={item}
                            onEdit={openEditForm}
                            onDelete={handleDelete}
                            isDeleting={deletingId === item.id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Recurring
